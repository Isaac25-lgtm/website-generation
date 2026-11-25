import { Hono } from "hono";
import { z } from "zod";
import { stripOwnerPhotos } from "../../shared/owner-photos";
import type { Ctx, HonoEnv } from "../env";
import { HttpError, baseUrl, now } from "../env";
import { audit, enforceRate, requireUser } from "../lib/auth";
import { newId } from "../lib/crypto";
import { activeEntitlement, draftDoc, loadAssetMeta, loadStore, ownedProject, previewToken, RESERVED_SLUGS, saveDraft, uniqueSlug, type ProjectRow } from "../lib/site";
import { aiAvailable, aiJson, CopySuggestion, COPY_JSON_SCHEMA, COPY_SYSTEM, REFINE_JSON_SCHEMA, refineSystem } from "../lib/ai";
import { dodoConfigured, paymentsMode } from "../lib/dodo";
import { generateSiteDoc, switchTemplate, type AnyAnswers } from "../../shared/generate";
import { FONT_KEYS, parseSiteDoc, type SiteDoc } from "../../shared/schema";
import { PLANS, isSiteType } from "../../shared/pricing";
import { getTemplate, TEMPLATE_MAP } from "../../shared/templates";
import { copySlop } from "../../shared/quality";
import { applyPatch, RefinePatch, ruleRefine } from "../../shared/refine";
import { slugify } from "../../shared/util";
import { renderSite } from "../../shared/render";
import { buildZip } from "../lib/zip";
import { getBlob, extFor } from "../lib/storage";

export const projects = new Hono<HonoEnv>();

async function setting(c: Ctx, key: string, fallback: string): Promise<string> {
  const r = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = ?").bind(key).first<{ value: string }>();
  return r?.value ?? fallback;
}

function summary(p: ProjectRow, extra: Record<string, unknown> = {}) {
  return {
    id: p.id, name: p.name, type: p.site_type, slug: p.slug, templateId: p.template_id, status: p.status,
    revision: p.draft_revision, isDemo: !!p.is_demo, createdAt: p.created_at, updatedAt: p.updated_at,
    price: PLANS[p.site_type].priceCents, ...extra,
  };
}

projects.get("/", async (c) => {
  const u = requireUser(c);
  const rows = await c.env.DB.prepare(
    `SELECT p.*, ps.status AS pub_status, ps.last_published_at, sv.version AS pub_version,
            (SELECT source FROM entitlements e WHERE e.project_id = p.id AND e.status = 'active' ORDER BY created_at DESC LIMIT 1) AS ent_source,
            (SELECT COUNT(*) FROM contact_leads l WHERE l.project_id = p.id AND l.status = 'new') +
            (SELECT COUNT(*) FROM quote_requests q WHERE q.project_id = p.id AND q.status = 'new') AS new_leads,
            (SELECT COUNT(*) FROM orders o WHERE o.project_id = p.id AND o.status = 'pending') AS pending_orders
       FROM projects p
       LEFT JOIN published_sites ps ON ps.project_id = p.id
       LEFT JOIN site_versions sv ON sv.id = ps.current_version_id
      WHERE p.owner_id = ? AND p.deleted_at IS NULL ORDER BY p.updated_at DESC LIMIT 100`,
  ).bind(u.id).all<ProjectRow & { pub_status: string | null; last_published_at: number | null; pub_version: number | null; ent_source: string | null; new_leads: number; pending_orders: number }>();
  return c.json({
    projects: rows.results.map((p) => summary(p, {
      published: p.pub_status === "live", publishedVersion: p.pub_version, lastPublishedAt: p.last_published_at,
      url: p.pub_status === "live" ? `${baseUrl(c)}/s/${p.slug}/` : null, entitlement: p.ent_source, newLeads: p.new_leads, pendingOrders: p.pending_orders,
    })),
  });
});

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

async function slugStatus(c: Ctx, slug: string): Promise<{ available: boolean; reason?: string }> {
  if (!SLUG_RE.test(slug)) return { available: false, reason: "Use 3–40 lowercase letters, numbers and dashes." };
  if (RESERVED_SLUGS.has(slug) || slug.startsWith("demo-")) return { available: false, reason: "That address is reserved." };
  const taken = await c.env.DB.prepare("SELECT 1 FROM projects WHERE slug = ?").bind(slug).first();
  return taken ? { available: false, reason: "That address is already taken." } : { available: true };
}

projects.get("/slug-available", async (c) => {
  const u = requireUser(c);
  await enforceRate(c.env, `slugcheck:${u.id}`, 120, 600);
  const slug = (c.req.query("slug") || "").trim().toLowerCase();
  const st = await slugStatus(c, slug);
  // Offer the nearest free alternative so people are never stuck on a taken name.
  const suggestion = !st.available && /^[a-z0-9-]{3,40}$/.test(slug) ? await uniqueSlug(c.env, slug.replace(/^-+|-+$/g, "").slice(0, 34)) : undefined;
  return c.json({ slug, ...st, suggestion });
});

projects.post("/", async (c) => {
  const u = requireUser(c);
  const body = z.object({ type: z.string(), name: z.string().trim().min(1).max(80), slug: z.string().trim().toLowerCase().max(40).optional(), templateId: z.string().max(40).optional(), answers: z.record(z.string(), z.unknown()).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success || !isSiteType(body.data.type)) throw new HttpError(400, "Choose a website type and name.");
  await enforceRate(c.env, `newproj:${u.id}`, 30, 86400, "You've created many projects today. Please continue with an existing one.");
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM projects WHERE owner_id = ? AND deleted_at IS NULL").bind(u.id).first<{ n: number }>();
  if ((count?.n ?? 0) >= 25) throw new HttpError(400, "You've reached the limit of 25 projects. Delete unused drafts to create more.");
  const type = body.data.type;
  const tpl = getTemplate(body.data.templateId, type);
  const id = newId("prj");
  let slug: string;
  if (body.data.slug) {
    const st = await slugStatus(c, body.data.slug);
    if (!st.available) throw new HttpError(409, `Web address not available: ${st.reason}`, "slug_unavailable");
    slug = body.data.slug;
  } else slug = await uniqueSlug(c.env, slugify(body.data.name, 40));
  const t = now();
  const answers = body.data.answers ?? {};
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO projects (id, owner_id, site_type, name, slug, template_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)").bind(id, u.id, type, body.data.name, slug, tpl.id, t, t),
    c.env.DB.prepare("INSERT INTO project_members (project_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").bind(id, u.id, t),
    c.env.DB.prepare("INSERT INTO project_intake (project_id, step, data_json, updated_at) VALUES (?, 0, ?, ?)").bind(id, JSON.stringify(answers).slice(0, 200_000), t),
  ]);
  return c.json({ id, slug });
});

projects.get("/:id", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const [intake, pub, ent, versions, jobs] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT step, data_json, completed_at, updated_at FROM project_intake WHERE project_id = ?").bind(p.id),
    c.env.DB.prepare("SELECT ps.status, ps.first_published_at, ps.last_published_at, sv.version, sv.id AS version_id FROM published_sites ps LEFT JOIN site_versions sv ON sv.id = ps.current_version_id WHERE ps.project_id = ?").bind(p.id),
    c.env.DB.prepare("SELECT id, source, created_at FROM entitlements WHERE project_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").bind(p.id),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM site_versions WHERE project_id = ?").bind(p.id),
    c.env.DB.prepare("SELECT COUNT(*) AS n FROM generation_jobs WHERE project_id = ? AND kind IN ('ai_copy','ai_refine') AND status = 'succeeded'").bind(p.id),
  ]);
  const ir = intake.results[0] as any;
  const pr = pub.results[0] as any;
  const valid = await activeEntitlement(c.env, p.id);
  return c.json({
    project: summary(p, { contentRightsAck: !!p.content_rights_ack_at, aiReviewAck: !!p.ai_review_ack_at }),
    intake: ir ? { step: ir.step, answers: JSON.parse(ir.data_json || "{}"), completedAt: ir.completed_at } : { step: 0, answers: {} },
    doc: draftDoc(p),
    publish: pr ? { status: pr.status, version: pr.version, versionId: pr.version_id, firstPublishedAt: pr.first_published_at, lastPublishedAt: pr.last_published_at, url: `${baseUrl(c)}/s/${p.slug}/` } : null,
    entitlement: valid ? { source: valid.source } : (ent.results[0] ? { source: (ent.results[0] as any).source, invalidInThisMode: true } : null),
    versions: (versions.results[0] as any)?.n ?? 0,
    ai: { available: aiAvailable(c.env), used: (jobs.results[0] as any)?.n ?? 0, limit: Number(await setting(c, "ai_generations_per_project", "20")) },
    payments: { configured: dodoConfigured(c.env), mode: paymentsMode(c.env) },
  });
});

projects.patch("/:id", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ name: z.string().trim().min(1).max(80).optional(), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, "Use 3–40 lowercase letters, numbers and dashes.").optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Invalid input");
  if (body.data.slug && body.data.slug !== p.slug) {
    if (RESERVED_SLUGS.has(body.data.slug) || body.data.slug.startsWith("demo-")) throw new HttpError(400, "That address is reserved. Choose another.");
    const taken = await c.env.DB.prepare("SELECT 1 FROM projects WHERE slug = ? AND id != ?").bind(body.data.slug, p.id).first();
    if (taken) throw new HttpError(409, "That address is already taken.");
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE projects SET slug = ?, updated_at = ? WHERE id = ?").bind(body.data.slug, now(), p.id),
      c.env.DB.prepare("UPDATE published_sites SET slug = ? WHERE project_id = ?").bind(body.data.slug, p.id),
    ]);
  }
  if (body.data.name) await c.env.DB.prepare("UPDATE projects SET name = ?, updated_at = ? WHERE id = ?").bind(body.data.name, now(), p.id).run();
  return c.json({ ok: true });
});

projects.delete("/:id", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  if (p.is_demo) throw new HttpError(400, "Demo projects can't be deleted.");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE projects SET deleted_at = ?, status = 'deleted', slug = slug || '-deleted-' || ? WHERE id = ?").bind(now(), now(), p.id),
    c.env.DB.prepare("UPDATE published_sites SET status = 'unpublished', slug = slug || '-deleted-' || ? WHERE project_id = ?").bind(now(), p.id),
  ]);
  await audit(c.env, u.id, "project.deleted", "project", p.id);
  return c.json({ ok: true });
});

projects.post("/:id/duplicate", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const id = newId("prj");
  const slug = await uniqueSlug(c.env, `${p.slug}-copy`);
  const t = now();
  const intake = await c.env.DB.prepare("SELECT data_json FROM project_intake WHERE project_id = ?").bind(p.id).first<{ data_json: string }>();
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO projects (id, owner_id, site_type, name, slug, template_id, status, draft_json, draft_revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)").bind(id, u.id, p.site_type, `${p.name} (copy)`.slice(0, 80), slug, p.template_id, p.draft_json ? "preview_ready" : "draft", p.draft_json ? JSON.stringify(stripOwnerPhotos(JSON.parse(p.draft_json))) : null, t, t),
    c.env.DB.prepare("INSERT INTO project_members (project_id, user_id, role, created_at) VALUES (?, ?, 'owner', ?)").bind(id, u.id, t),
    c.env.DB.prepare("INSERT INTO project_intake (project_id, step, data_json, updated_at) VALUES (?, 0, ?, ?)").bind(id, intake?.data_json ?? "{}", t),
  ]);
  return c.json({ id });
});

// ───── Intake (wizard autosave) ─────
projects.put("/:id/intake", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const text = await c.req.text();
  if (text.length > 250_000) throw new HttpError(413, "Your answers are too long. Shorten some text and try again.");
  const body = z.object({ step: z.number().int().min(0).max(30), answers: z.record(z.string(), z.unknown()), templateId: z.string().max(40).optional(), contentRightsAck: z.boolean().optional() }).safeParse(JSON.parse(text || "{}"));
  if (!body.success) throw new HttpError(400, "Invalid answers.");
  const stmts = [c.env.DB.prepare("UPDATE project_intake SET step = ?, data_json = ?, updated_at = ? WHERE project_id = ?").bind(body.data.step, JSON.stringify(body.data.answers), now(), p.id)];
  if (body.data.templateId && TEMPLATE_MAP[body.data.templateId]?.type === p.site_type) stmts.push(c.env.DB.prepare("UPDATE projects SET template_id = ?, updated_at = ? WHERE id = ?").bind(body.data.templateId, now(), p.id));
  if (body.data.contentRightsAck) {
    stmts.push(c.env.DB.prepare("UPDATE projects SET content_rights_ack_at = ? WHERE id = ?").bind(now(), p.id));
    stmts.push(c.env.DB.prepare("INSERT INTO consents (id, user_id, project_id, kind, version, created_at) VALUES (?, ?, ?, 'content_rights', '2026-11-20', ?)").bind(newId("cns"), u.id, p.id, now()));
  }
  await c.env.DB.batch(stmts);
  return c.json({ ok: true });
});

// ───── Generation ─────
async function logJob(c: Ctx, projectId: string, userId: string, kind: string, status: string, extra: { provider?: string; model?: string; inputTokens?: number; outputTokens?: number; error?: string } = {}) {
  await c.env.DB.prepare("INSERT INTO generation_jobs (id, project_id, user_id, kind, status, provider, model, input_tokens, output_tokens, error, created_at, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(newId("gen"), projectId, userId, kind, status, extra.provider ?? null, extra.model ?? null, extra.inputTokens ?? null, extra.outputTokens ?? null, extra.error?.slice(0, 500) ?? null, now(), now()).run();
}

async function aiQuotaOk(c: Ctx, projectId: string): Promise<boolean> {
  const limit = Number(await setting(c, "ai_generations_per_project", "20"));
  const used = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM generation_jobs WHERE project_id = ? AND kind IN ('ai_copy','ai_refine')").bind(projectId).first<{ n: number }>();
  return (used?.n ?? 0) < limit;
}

async function polishCopy(c: Ctx, p: ProjectRow, userId: string, doc: SiteDoc): Promise<{ doc: SiteDoc; ai: { used: boolean; error?: string } }> {
  if (!aiAvailable(c.env)) return { doc, ai: { used: false, error: "AI is not enabled on this platform yet." } };
  if (!(await aiQuotaOk(c, p.id))) return { doc, ai: { used: false, error: "AI suggestion limit reached for this project. You can still edit everything manually." } };
  const home = doc.pages.find((pg) => pg.slug === "")!;
  const hero = home.sections.find((s) => s.kind === "hero");
  const about = doc.pages.flatMap((pg) => pg.sections).find((s) => s.kind === "about");
  const services = doc.pages.flatMap((pg) => pg.sections).find((s) => s.kind === "services" || s.kind === "projects");
  const items: { title: string; description: string }[] = services?.kind === "services" ? services.data.items : services?.kind === "projects" ? services.data.items : [];
  const input = {
    siteType: doc.type, name: doc.brand.name, tagline: doc.brand.tagline,
    heroHeading: hero?.kind === "hero" ? hero.data.heading : "", heroSubheading: hero?.kind === "hero" ? hero.data.subheading : "",
    about: about?.kind === "about" ? about.data.body : "",
    services: items.map((i) => ({ title: i.title, description: i.description })),
  };
  const r = await aiJson(c.env, { system: COPY_SYSTEM, user: JSON.stringify(input), jsonSchema: COPY_JSON_SCHEMA, schema: CopySuggestion, maxTokens: 1400 });
  if (!r.ok) {
    await logJob(c, p.id, userId, "ai_copy", "failed", { provider: "workers-ai", model: r.model, error: r.error });
    return { doc, ai: { used: false, error: "The AI service didn't return a valid result, so your original text was kept." } };
  }
  await logJob(c, p.id, userId, "ai_copy", "succeeded", { provider: "workers-ai", model: r.model, inputTokens: r.inputTokens, outputTokens: r.outputTokens });
  // No-AI-slop rule: any suggested field with cliché phrasing or emoji is dropped, keeping the customer's own words.
  const clean = (x: string) => (copySlop(x) ? "" : x);
  const d = { ...r.data, heroHeading: clean(r.data.heroHeading), heroSubheading: clean(r.data.heroSubheading), about: clean(r.data.about), seoDescription: clean(r.data.seoDescription), serviceDescriptions: r.data.serviceDescriptions.map(clean) };
  const pages = doc.pages.map((pg) => ({
    ...pg,
    sections: pg.sections.map((s) => {
      if (s.kind === "hero" && pg.slug === "" && input.heroHeading && d.heroHeading) return { ...s, aiSuggested: true, data: { ...s.data, heading: d.heroHeading, subheading: input.heroSubheading ? d.heroSubheading || s.data.subheading : s.data.subheading } };
      if (s.kind === "about" && input.about && d.about) return { ...s, aiSuggested: true, data: { ...s.data, body: d.about } };
      if ((s.kind === "services") && d.serviceDescriptions.length === s.data.items.length) return { ...s, aiSuggested: true, data: { ...s.data, items: s.data.items.map((it, i) => ({ ...it, description: it.description ? d.serviceDescriptions[i] || it.description : it.description })) } };
      if ((s.kind === "projects") && d.serviceDescriptions.length === s.data.items.length) return { ...s, aiSuggested: true, data: { ...s.data, items: s.data.items.map((it, i) => ({ ...it, description: it.description ? d.serviceDescriptions[i] || it.description : it.description })) } };
      return s;
    }),
  }));
  const next = { ...doc, pages, seo: { ...doc.seo, description: d.seoDescription || doc.seo.description } };
  const parsed = parseSiteDoc(next);
  return parsed.ok ? { doc: parsed.doc, ai: { used: true } } : { doc, ai: { used: false, error: "AI output was rejected by validation; original text kept." } };
}

projects.post("/:id/generate", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ useAi: z.boolean().default(false) }).parse(await c.req.json().catch(() => ({})));
  await enforceRate(c.env, `gen:${u.id}`, 40, 3600, "You've generated many times in the last hour. Please wait a little.");
  const intake = await c.env.DB.prepare("SELECT data_json FROM project_intake WHERE project_id = ?").bind(p.id).first<{ data_json: string }>();
  const answers = JSON.parse(intake?.data_json || "{}") as AnyAnswers;
  let doc: SiteDoc;
  try { doc = generateSiteDoc(p.site_type, p.template_id, answers); }
  catch (e) {
    await logJob(c, p.id, u.id, "deterministic", "failed", { error: (e as Error).message });
    throw new HttpError(422, "Some answers couldn't be used. Check the highlighted fields and try again.");
  }
  await logJob(c, p.id, u.id, "deterministic", "succeeded", { provider: "builtin" });
  let ai: { used: boolean; error?: string } = { used: false };
  if (body.useAi) ({ doc, ai } = await polishCopy(c, p, u.id, doc));
  const rev = p.draft_revision + 1;
  await saveDraft(c.env, p.id, doc, rev, u.id, ai.used ? "Generated with AI copy suggestions" : "Generated from your answers", true);
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE project_intake SET completed_at = ? WHERE project_id = ?").bind(now(), p.id),
    c.env.DB.prepare("UPDATE projects SET ai_review_ack_at = NULL WHERE id = ?").bind(p.id),
  ]);
  return c.json({ doc, revision: rev, ai });
});

projects.post("/:id/ai/copy", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const doc = draftDoc(p);
  if (!doc) throw new HttpError(400, "Generate your site first.");
  await enforceRate(c.env, `ai:${u.id}`, 30, 3600);
  const r = await polishCopy(c, p, u.id, doc);
  if (!r.ai.used) throw new HttpError(503, r.ai.error || "AI unavailable", "ai_unavailable");
  const rev = p.draft_revision + 1;
  await saveDraft(c.env, p.id, r.doc, rev, u.id, "AI copy suggestions", true);
  await c.env.DB.prepare("UPDATE projects SET ai_review_ack_at = NULL WHERE id = ?").bind(p.id).run();
  return c.json({ doc: r.doc, revision: rev });
});

projects.post("/:id/refine", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const doc = draftDoc(p);
  if (!doc) throw new HttpError(400, "Generate your site first.");
  const body = z.object({ request: z.string().trim().min(2).max(400), preferAi: z.boolean().default(true) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Describe the change you want.");
  await enforceRate(c.env, `refine:${u.id}`, 60, 3600);
  let patch: RefinePatch | null = null;
  let engine: "ai" | "rules" = "rules";
  let note = "";
  if (body.data.preferAi && aiAvailable(c.env) && (await aiQuotaOk(c, p.id))) {
    const state = { mode: doc.theme.mode, colors: doc.theme.colors, fontHeading: doc.theme.fontHeading, fontBody: doc.theme.fontBody, radius: doc.theme.radius, density: doc.theme.density, headingScale: doc.theme.headingScale, animation: doc.theme.animation, headerStyle: doc.theme.headerStyle, cardStyle: doc.theme.cardStyle, ornament: doc.theme.ornament, inspiration: doc.inspiration ?? null };
    const r = await aiJson(c.env, { system: refineSystem(FONT_KEYS), user: `Current design: ${JSON.stringify(state)}\nRequest: ${body.data.request}`, jsonSchema: REFINE_JSON_SCHEMA, schema: RefinePatch, maxTokens: 500 });
    if (r.ok) { patch = r.data; engine = "ai"; await logJob(c, p.id, u.id, "ai_refine", "succeeded", { provider: "workers-ai", model: r.model, inputTokens: r.inputTokens, outputTokens: r.outputTokens }); }
    else { await logJob(c, p.id, u.id, "ai_refine", "failed", { provider: "workers-ai", model: r.model, error: r.error }); note = "AI was unavailable, so the rule-based designer handled this request."; }
  }
  if (!patch) { patch = ruleRefine(doc, body.data.request); await logJob(c, p.id, u.id, "rule_refine", "succeeded", { provider: "builtin" }); }
  const next = applyPatch(doc, patch);
  const parsed = parseSiteDoc(next);
  if (!parsed.ok) throw new HttpError(422, "That change couldn't be applied safely.");
  const rev = p.draft_revision + 1;
  await saveDraft(c.env, p.id, parsed.doc, rev, u.id, `Refine: ${body.data.request.slice(0, 120)}`, true);
  return c.json({ doc: parsed.doc, revision: rev, engine, explanation: patch.explanation, note });
});

// ───── Draft editing ─────
projects.put("/:id/draft", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const text = await c.req.text();
  if (text.length > 600_000) throw new HttpError(413, "This site is too large to save. Remove some content.");
  const body = z.object({ doc: z.unknown(), baseRevision: z.number().int(), checkpoint: z.boolean().default(false), note: z.string().max(160).optional() }).safeParse(JSON.parse(text || "{}"));
  if (!body.success) throw new HttpError(400, "Invalid request.");
  if (body.data.baseRevision !== p.draft_revision) throw new HttpError(409, "This site was changed in another tab or by another person. Reload to get the latest version.", "conflict", { revision: p.draft_revision });
  const parsed = parseSiteDoc(body.data.doc);
  if (!parsed.ok) throw new HttpError(422, `Couldn't save: ${parsed.error}`, "invalid_doc");
  if (parsed.doc.type !== p.site_type) throw new HttpError(422, "Site type can't be changed.");
  if (!TEMPLATE_MAP[parsed.doc.templateId] || TEMPLATE_MAP[parsed.doc.templateId].type !== p.site_type) throw new HttpError(422, "Unknown template.");
  const rev = p.draft_revision + 1;
  await saveDraft(c.env, p.id, parsed.doc, rev, u.id, body.data.note ?? null, body.data.checkpoint);
  return c.json({ ok: true, revision: rev });
});

projects.post("/:id/template", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ templateId: z.string().max(40) }).parse(await c.req.json().catch(() => ({})));
  const tpl = TEMPLATE_MAP[body.templateId];
  if (!tpl || tpl.type !== p.site_type) throw new HttpError(400, "That template isn't available for this site type.");
  const doc = draftDoc(p);
  const rev = p.draft_revision + 1;
  if (doc) {
    const intake = await c.env.DB.prepare("SELECT data_json FROM project_intake WHERE project_id = ?").bind(p.id).first<{ data_json: string }>();
    const answers = JSON.parse(intake?.data_json || "{}") as AnyAnswers;
    const next = switchTemplate(doc, tpl.id, { ...(answers.inspiration?.tokens ?? {}), ...(answers.style ?? {}) });
    await saveDraft(c.env, p.id, next, rev, u.id, `Template: ${tpl.name}`, true);
    return c.json({ doc: next, revision: rev });
  }
  await c.env.DB.prepare("UPDATE projects SET template_id = ?, updated_at = ? WHERE id = ?").bind(tpl.id, now(), p.id).run();
  return c.json({ ok: true });
});

projects.get("/:id/history", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const r = await c.env.DB.prepare("SELECT id, revision, note, created_at FROM draft_history WHERE project_id = ? ORDER BY created_at DESC LIMIT 50").bind(p.id).all();
  return c.json({ history: r.results });
});

projects.post("/:id/history/:hid/restore", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const h = await c.env.DB.prepare("SELECT doc_json, revision FROM draft_history WHERE id = ? AND project_id = ?").bind(c.req.param("hid"), p.id).first<{ doc_json: string; revision: number }>();
  if (!h) throw new HttpError(404, "Checkpoint not found.");
  const parsed = parseSiteDoc(JSON.parse(h.doc_json));
  if (!parsed.ok) throw new HttpError(422, "That checkpoint can't be restored.");
  const rev = p.draft_revision + 1;
  await saveDraft(c.env, p.id, parsed.doc, rev, u.id, `Restored checkpoint from revision ${h.revision}`, true);
  return c.json({ doc: parsed.doc, revision: rev });
});

projects.post("/:id/preview-link", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const exp = now() + 7 * 24 * 3600_000;
  return c.json({ url: `${baseUrl(c)}/preview/${p.id}/?t=${encodeURIComponent(await previewToken(c.env, p.id, exp))}`, expiresAt: exp });
});

// ───── Publishing ─────
function publishProblems(doc: SiteDoc, p: ProjectRow, storeCount: number): string[] {
  const problems: string[] = [];
  if (!doc.brand.name.trim()) problems.push("Add your site or business name.");
  if (doc.type === "ecommerce") {
    const st = doc.store;
    if (!st || !st.paymentMethods.length) problems.push("Choose at least one way for customers to pay.");
    if (!st || !st.fulfillment.length) problems.push("Add at least one delivery or pickup option.");
    if (!st?.returnsPolicy.trim()) problems.push("Write your returns & refunds policy.");
    if (!st?.shippingPolicy.trim()) problems.push("Write your delivery & shipping policy.");
    if (!st?.privacyNote.trim()) problems.push("Write a short privacy notice for buyers.");
    if (!st?.prohibitedAck) problems.push("Confirm that you will not sell prohibited goods.");
    if (storeCount === 0) problems.push("Add at least one active product.");
  }
  return problems;
}

projects.post("/:id/publish", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ contentRightsAck: z.boolean().default(false), aiReviewAck: z.boolean().default(false) }).parse(await c.req.json().catch(() => ({})));
  const doc = draftDoc(p);
  if (!doc) throw new HttpError(400, "Generate your site before publishing.");
  if (p.status === "suspended") throw new HttpError(403, "This site has been suspended. Contact support.");
  const ent = await activeEntitlement(c.env, p.id);
  if (!ent) throw new HttpError(402, `Publishing requires the one-time ${PLANS[p.site_type].shortName} fee.`, "payment_required");
  if (!p.content_rights_ack_at && !body.contentRightsAck) throw new HttpError(400, "Please confirm you have the rights to the content and images on your site.", "rights_ack_required");
  const hasAi = doc.pages.some((pg) => pg.sections.some((s) => s.aiSuggested));
  if (hasAi && !p.ai_review_ack_at && !body.aiReviewAck) throw new HttpError(400, "Please confirm you've reviewed the AI-suggested text for accuracy.", "ai_ack_required");
  const products = doc.type === "ecommerce" ? await c.env.DB.prepare("SELECT COUNT(*) AS n FROM products WHERE project_id = ? AND status = 'active'").bind(p.id).first<{ n: number }>() : { n: 0 };
  const problems = publishProblems(doc, p, products?.n ?? 0);
  if (doc.type === "ecommerce" && doc.store) {
    // Never publish prices in a currency other than the store's; amounts are not converted automatically (audit #1).
    const other = await c.env.DB.prepare("SELECT currency, COUNT(*) AS n FROM products WHERE project_id = ? AND status = 'active' AND currency != ? GROUP BY currency").bind(p.id, doc.store.currency).all<{ currency: string; n: number }>();
    for (const row of other.results) problems.push(`${row.n} product${row.n === 1 ? " is" : "s are"} priced in ${row.currency}, but your store currency is ${doc.store.currency}. Prices aren't converted automatically: update ${row.n === 1 ? "it" : "them"} (or regenerate your site after changing the store currency) before publishing.`);
  }
  if (problems.length) throw new HttpError(422, "A few things are needed before publishing.", "not_ready", { problems });
  const last = await c.env.DB.prepare("SELECT COALESCE(MAX(version), 0) AS v FROM site_versions WHERE project_id = ?").bind(p.id).first<{ v: number }>();
  const version = (last?.v ?? 0) + 1;
  const vid = newId("ver");
  const t = now();
  const stmts = [
    c.env.DB.prepare("INSERT INTO site_versions (id, project_id, version, doc_json, created_by, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(vid, p.id, version, JSON.stringify(doc), u.id, t, `Published revision ${p.draft_revision}`),
    c.env.DB.prepare(`INSERT INTO published_sites (project_id, slug, current_version_id, status, first_published_at, last_published_at) VALUES (?, ?, ?, 'live', ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET current_version_id = excluded.current_version_id, slug = excluded.slug, status = 'live', last_published_at = excluded.last_published_at`).bind(p.id, p.slug, vid, t, t),
    c.env.DB.prepare("UPDATE projects SET status = 'published', updated_at = ? WHERE id = ?").bind(t, p.id),
    c.env.DB.prepare("INSERT INTO publication_jobs (id, project_id, user_id, action, version, status, created_at) VALUES (?, ?, ?, 'publish', ?, 'succeeded', ?)").bind(newId("pub"), p.id, u.id, version, t),
  ];
  if (body.contentRightsAck && !p.content_rights_ack_at) {
    stmts.push(c.env.DB.prepare("UPDATE projects SET content_rights_ack_at = ? WHERE id = ?").bind(t, p.id));
    stmts.push(c.env.DB.prepare("INSERT INTO consents (id, user_id, project_id, kind, version, created_at) VALUES (?, ?, ?, 'content_rights', '2026-11-20', ?)").bind(newId("cns"), u.id, p.id, t));
  }
  if (hasAi && body.aiReviewAck) {
    stmts.push(c.env.DB.prepare("UPDATE projects SET ai_review_ack_at = ? WHERE id = ?").bind(t, p.id));
    stmts.push(c.env.DB.prepare("INSERT INTO consents (id, user_id, project_id, kind, version, created_at) VALUES (?, ?, ?, 'ai_review', '2026-11-20', ?)").bind(newId("cns"), u.id, p.id, t));
  }
  await c.env.DB.batch(stmts);
  await audit(c.env, u.id, "site.published", "project", p.id, { version, entitlement: ent.source });
  return c.json({ ok: true, version, url: `${baseUrl(c)}/s/${p.slug}/` });
});

projects.post("/:id/unpublish", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  if (p.is_demo) throw new HttpError(400, "Demo sites stay published.");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE published_sites SET status = 'unpublished' WHERE project_id = ? AND status = 'live'").bind(p.id),
    c.env.DB.prepare("UPDATE projects SET status = 'preview_ready', updated_at = ? WHERE id = ? AND status = 'published'").bind(now(), p.id),
    c.env.DB.prepare("INSERT INTO publication_jobs (id, project_id, user_id, action, status, created_at) VALUES (?, ?, ?, 'unpublish', 'succeeded', ?)").bind(newId("pub"), p.id, u.id, now()),
  ]);
  await audit(c.env, u.id, "site.unpublished", "project", p.id);
  return c.json({ ok: true });
});

projects.get("/:id/versions", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const [vers, cur] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT id, version, note, created_at FROM site_versions WHERE project_id = ? ORDER BY version DESC LIMIT 50").bind(p.id),
    c.env.DB.prepare("SELECT current_version_id, status FROM published_sites WHERE project_id = ?").bind(p.id),
  ]);
  return c.json({ versions: vers.results, current: (cur.results[0] as any)?.current_version_id ?? null, status: (cur.results[0] as any)?.status ?? null });
});

projects.post("/:id/versions/:vid/rollback", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const v = await c.env.DB.prepare("SELECT id, version FROM site_versions WHERE id = ? AND project_id = ?").bind(c.req.param("vid"), p.id).first<{ id: string; version: number }>();
  if (!v) throw new HttpError(404, "Version not found.");
  if (p.status === "suspended") throw new HttpError(403, "This site has been suspended.");
  if (!(await activeEntitlement(c.env, p.id))) throw new HttpError(402, "Publishing requires an active purchase.", "payment_required");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE published_sites SET current_version_id = ?, status = 'live', last_published_at = ? WHERE project_id = ?").bind(v.id, now(), p.id),
    c.env.DB.prepare("UPDATE projects SET status = 'published', updated_at = ? WHERE id = ?").bind(now(), p.id),
    c.env.DB.prepare("INSERT INTO publication_jobs (id, project_id, user_id, action, version, status, created_at) VALUES (?, ?, ?, 'rollback', ?, 'succeeded', ?)").bind(newId("pub"), p.id, u.id, v.version, now()),
  ]);
  await audit(c.env, u.id, "site.rollback", "project", p.id, { version: v.version });
  return c.json({ ok: true, version: v.version });
});

// ───── Leads ─────
projects.get("/:id/leads", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const [leads, quotes] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT id, name, email, phone, message, page, status, created_at FROM contact_leads WHERE project_id = ? ORDER BY created_at DESC LIMIT 200").bind(p.id),
    c.env.DB.prepare("SELECT id, name, email, phone, service, budget, timeline, details, status, created_at FROM quote_requests WHERE project_id = ? ORDER BY created_at DESC LIMIT 200").bind(p.id),
  ]);
  return c.json({ leads: leads.results, quotes: quotes.results });
});

projects.patch("/:id/leads/:lid", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ status: z.enum(["new", "read", "archived"]), kind: z.enum(["contact", "quote"]) }).parse(await c.req.json());
  const table = body.kind === "quote" ? "quote_requests" : "contact_leads";
  await c.env.DB.prepare(`UPDATE ${table} SET status = ? WHERE id = ? AND project_id = ?`).bind(body.status, c.req.param("lid"), p.id).run();
  return c.json({ ok: true });
});

// ───── Domains (Stage 2 — truthful status only) ─────
projects.get("/:id/domains", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const r = await c.env.DB.prepare("SELECT id, hostname, kind, status, created_at FROM domains WHERE project_id = ?").bind(p.id).all();
  return c.json({ domains: r.results, customDomainsAvailable: false, note: "Custom domains are not yet available. Your site is live at its ImprintSites address. You can register interest in connecting your own domain, and we'll show the exact DNS steps when the feature launches." });
});

projects.post("/:id/domains", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ hostname: z.string().trim().toLowerCase().regex(/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/, "Enter a domain like www.example.com") }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Invalid domain");
  const t = now();
  await c.env.DB.prepare("INSERT INTO domains (id, project_id, hostname, kind, status, created_at, updated_at) VALUES (?, ?, ?, 'custom', 'not_available', ?, ?) ON CONFLICT(hostname) DO NOTHING").bind(newId("dom"), p.id, body.data.hostname, t, t).run();
  return c.json({ ok: true, status: "not_available" });
});

// ───── Export (static HTML + JSON + assets as a ZIP) ─────
projects.get("/:id/export", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const doc = draftDoc(p);
  if (!doc) throw new HttpError(400, "Nothing to export yet.");
  await enforceRate(c.env, `export:${u.id}`, 10, 3600);
  const tpl = getTemplate(doc.templateId, doc.type);
  const assets = await c.env.DB.prepare("SELECT id, mime, storage, storage_key FROM site_assets WHERE project_id = ? AND deleted_at IS NULL LIMIT 300").bind(p.id).all<{ id: string; mime: string; storage: string; storage_key: string }>();
  const extMap = Object.fromEntries(assets.results.map((a) => [a.id, extFor(a.mime)]));
  const store = doc.type === "ecommerce" ? await loadStore(c.env, p.id) : undefined;
  const ctx = { mode: "export" as const, basePath: "", projectId: p.id, apiBase: baseUrl(c), assetUrl: (id: string) => `/assets/${id}.${extMap[id] ?? "bin"}`, assets: await loadAssetMeta(c.env, p.id), store, platformName: c.env.APP_NAME, platformUrl: baseUrl(c), renderedAt: now() };
  const files: { name: string; data: Uint8Array }[] = [];
  const enc = new TextEncoder();
  for (const page of doc.pages) files.push({ name: page.slug ? `${page.slug}/index.html` : "index.html", data: enc.encode(renderSite(doc, tpl, ctx, page.slug).html) });
  if (store) {
    for (const prod of store.products) files.push({ name: `product/${prod.handle}/index.html`, data: enc.encode(renderSite(doc, tpl, ctx, `product/${prod.handle}`).html) });
    for (const k of ["cart", "checkout"]) files.push({ name: `${k}/index.html`, data: enc.encode(renderSite(doc, tpl, ctx, k).html) });
  }
  files.push({ name: "site.json", data: enc.encode(JSON.stringify(stripOwnerPhotos(doc), null, 2)) });
  files.push({ name: "README.txt", data: enc.encode(`Static export of "${p.name}" from ${c.env.APP_NAME}.\nUpload these files to the root of any static host. Forms and store checkout keep sending to ${baseUrl(c)} while your project exists there.\nsite.json contains your full site content in structured form.\n`) });
  for (const a of assets.results) {
    const blob = await getBlob(c.env, a.storage, a.storage_key);
    if (!blob) continue;
    const data = blob instanceof ArrayBuffer ? new Uint8Array(blob) : new Uint8Array(await new Response(blob).arrayBuffer());
    files.push({ name: `assets/${a.id}.${extFor(a.mime)}`, data });
  }
  const zip = buildZip(files);
  await audit(c.env, u.id, "project.exported", "project", p.id);
  return new Response(zip, { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${p.slug}-export.zip"`, "cache-control": "no-store" } });
});
