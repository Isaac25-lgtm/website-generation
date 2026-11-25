import { isOwnerStock, stripOwnerPhotos } from "../../shared/owner-photos";
import type { AppEnv, Ctx, SessionUser } from "../env";
import { HttpError, baseUrl, now } from "../env";
import type { CollectionView, ProductView, AssetMeta, RenderCtx } from "../../shared/render";
import { parseSiteDoc, type ImageRef, type SiteDoc } from "../../shared/schema";
import { hmacB64url, newId, timingSafeEqual } from "./crypto";
import { paymentsMode } from "./dodo";

export interface ProjectRow {
  id: string; owner_id: string; site_type: "personal" | "business" | "ecommerce"; name: string; slug: string; template_id: string;
  status: string; draft_json: string | null; draft_revision: number; is_demo: number; content_rights_ack_at: number | null;
  ai_review_ack_at: number | null; created_at: number; updated_at: number; deleted_at: number | null;
}

/** Load a project the current user may manage. Cross-tenant access returns 404 (no existence leak). */
export async function ownedProject(c: Ctx, user: SessionUser, projectId: string, opts: { allowAdmin?: boolean } = {}): Promise<ProjectRow> {
  if (!/^prj_[a-z0-9]{10,30}$/.test(projectId)) throw new HttpError(404, "Project not found.", "not_found");
  const row = await c.env.DB.prepare(
    `SELECT p.* FROM projects p
      WHERE p.id = ? AND p.deleted_at IS NULL
        AND (p.owner_id = ? OR EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = ?))`,
  ).bind(projectId, user.id, user.id).first<ProjectRow>();
  if (row) return row;
  if (opts.allowAdmin && user.isAdmin) {
    const r2 = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(projectId).first<ProjectRow>();
    if (r2) return r2;
  }
  throw new HttpError(404, "Project not found.", "not_found");
}

export function draftDoc(p: ProjectRow): SiteDoc | null {
  if (!p.draft_json) return null;
  const r = parseSiteDoc(JSON.parse(p.draft_json));
  return r.ok ? r.doc : null;
}

export async function loadStore(env: AppEnv, projectId: string, opts: { includeDrafts?: boolean } = {}): Promise<{ products: ProductView[]; collections: CollectionView[] }> {
  const [prods, vars, cols, links] = await env.DB.batch([
    env.DB.prepare(`SELECT * FROM products WHERE project_id = ? AND ${opts.includeDrafts ? "status != 'archived'" : "status = 'active'"} ORDER BY position, created_at`).bind(projectId),
    env.DB.prepare("SELECT * FROM product_variants WHERE project_id = ? ORDER BY position").bind(projectId),
    env.DB.prepare("SELECT id, name, handle, description FROM collections WHERE project_id = ? ORDER BY position, name").bind(projectId),
    env.DB.prepare("SELECT pc.product_id, c.handle FROM product_collections pc JOIN collections c ON c.id = pc.collection_id WHERE c.project_id = ?").bind(projectId),
  ]);
  const byProduct = new Map<string, any[]>();
  for (const v of vars.results as any[]) {
    if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
    byProduct.get(v.product_id)!.push(v);
  }
  const colsBy = new Map<string, string[]>();
  for (const l of links.results as any[]) {
    if (!colsBy.has(l.product_id)) colsBy.set(l.product_id, []);
    colsBy.get(l.product_id)!.push(l.handle);
  }
  const products: ProductView[] = (prods.results as any[]).map((p) => ({
    id: p.id, title: p.title, handle: p.handle, description: p.description,
    priceMinor: p.price_cents, compareAtMinor: p.compare_at_cents, currency: p.currency,
    images: safeImages(p.images_json), tags: String(p.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean),
    collections: colsBy.get(p.id) ?? [], featured: !!p.featured, productType: p.product_type,
    option1Name: p.option1_name, option2Name: p.option2_name, maxPerOrder: p.max_per_order, createdAt: p.created_at,
    variants: (byProduct.get(p.id) ?? []).map((v) => ({
      id: v.id, title: v.title, option1: v.option1, option2: v.option2,
      priceMinor: v.price_cents ?? p.price_cents,
      available: !v.track_inventory || v.stock > 0 || !!v.allow_backorder,
      stock: v.track_inventory ? v.stock : null, backorder: !!v.allow_backorder,
    })),
  }));
  // Stable collections; hide empty collections on storefront
  const used = new Set(products.flatMap((p) => p.collections));
  const collections = (cols.results as any[]).filter((c) => opts.includeDrafts || used.has(c.handle));
  return { products: products.filter((p) => p.variants.length > 0), collections };
}

function safeImages(json: string): ImageRef[] {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.filter((x) => x && (typeof x.assetId === "string" || (typeof x.stock === "string" && /^[a-z0-9-]{1,48}$/.test(x.stock) && !isOwnerStock(x.stock)))).slice(0, 12).map((x) => ({ assetId: typeof x.assetId === "string" ? x.assetId : undefined, stock: typeof x.assetId === "string" ? undefined : x.stock, alt: String(x.alt || "").slice(0, 300), caption: "" })) : [];
  } catch { return []; }
}

export async function loadAssetMeta(env: AppEnv, projectId: string): Promise<Record<string, AssetMeta>> {
  const r = await env.DB.prepare("SELECT id, alt, attribution, license, mime FROM site_assets WHERE project_id = ? AND deleted_at IS NULL").bind(projectId).all<{ id: string; alt: string; attribution: string | null; license: string | null; mime: string }>();
  return Object.fromEntries(r.results.map((a) => [a.id, { alt: a.alt, attribution: a.attribution, license: a.license, mime: a.mime }]));
}

export function renderCtxBase(c: Ctx, projectId: string, basePath: string, mode: RenderCtx["mode"]): RenderCtx {
  return {
    mode, basePath, projectId, apiBase: "",
    assetUrl: (id: string) => `/media/${id}`,
    platformName: c.env.APP_NAME || "ImprintSites AI",
    platformUrl: baseUrl(c),
    renderedAt: now(),
  };
}

export async function activeEntitlement(env: AppEnv, projectId: string): Promise<{ id: string; source: string } | null> {
  const mode = paymentsMode(env);
  const allowed = mode === "live" ? ["payment_live", "admin_demo"] : ["payment_live", "payment_test", "admin_demo"];
  const r = await env.DB.prepare(`SELECT id, source FROM entitlements WHERE project_id = ? AND status = 'active' AND source IN (${allowed.map(() => "?").join(",")}) ORDER BY created_at DESC LIMIT 1`)
    .bind(projectId, ...allowed).first<{ id: string; source: string }>();
  return r ?? null;
}

/** Key for preview links and order receipts. Production refuses to sign with the development fallback. */
function signingSecret(env: AppEnv): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (env.APP_ENV === "production") throw new HttpError(503, "This service isn't fully configured yet. Please try again later.", "not_configured");
  return "dev-secret";
}

/**
 * When a site no longer has any valid purchase or admin grant (refund, revoked demo), take it offline: the public
 * page and its checkout stop serving. Demo showcase sites are exempt. Returns true if a live site was withdrawn.
 */
export async function withdrawIfUnentitled(env: AppEnv, projectId: string, actorId: string | null, reason: string): Promise<boolean> {
  if (await activeEntitlement(env, projectId)) return false;
  const p = await env.DB.prepare("SELECT is_demo FROM projects WHERE id = ?").bind(projectId).first<{ is_demo: number }>();
  if (!p || p.is_demo) return false;
  const t = now();
  const [r] = await env.DB.batch([
    env.DB.prepare("UPDATE published_sites SET status = 'unpublished' WHERE project_id = ? AND status = 'live'").bind(projectId),
    env.DB.prepare("UPDATE projects SET status = 'preview_ready', updated_at = ? WHERE id = ? AND status = 'published'").bind(t, projectId),
  ]);
  if (!r.meta.changes) return false;
  await env.DB.prepare("INSERT INTO publication_jobs (id, project_id, user_id, action, status, created_at) VALUES (?, ?, ?, 'unpublish', 'succeeded', ?)").bind(newId("pub"), projectId, actorId, t).run();
  await env.DB.prepare("INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, detail_json, created_at) VALUES (?, ?, 'site.withdrawn', 'project', ?, ?, ?)").bind(newId("aud"), actorId, projectId, JSON.stringify({ reason }), t).run();
  return true;
}

export async function previewToken(env: AppEnv, projectId: string, expires: number): Promise<string> {
  return `${expires}.${await hmacB64url(signingSecret(env), `preview:${projectId}:${expires}`)}`;
}

export async function verifyPreviewToken(env: AppEnv, projectId: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  const e = Number(exp);
  if (!Number.isFinite(e) || e < now()) return false;
  const expected = await hmacB64url(signingSecret(env), `preview:${projectId}:${e}`);
  return timingSafeEqual(sig || "", expected);
}

export async function orderToken(env: AppEnv, orderId: string): Promise<string> {
  return (await hmacB64url(signingSecret(env), `order:${orderId}`)).slice(0, 32);
}

export const RESERVED_SLUGS = new Set(["admin", "api", "app", "www", "s", "preview", "media", "login", "signup", "dashboard", "pricing", "templates", "examples", "help", "support", "terms", "privacy", "refunds", "contact"]);

/** Find a free, non-reserved address: base, then base-2 … base-6, then a short random suffix. */
export async function uniqueSlug(env: AppEnv, rawBase: string): Promise<string> {
  let base = rawBase.replace(/^demo-+/, "").slice(0, 34).replace(/^-+|-+$/g, "") || "site";
  if (base.length < 3) base = `${base}-site`;
  if (RESERVED_SLUGS.has(base)) base = `${base}-site`;
  const candidates = [base, ...[2, 3, 4, 5, 6].map((n) => `${base}-${n}`)];
  for (const slug of candidates) {
    const exists = await env.DB.prepare("SELECT 1 FROM projects WHERE slug = ?").bind(slug).first();
    if (!exists) return slug;
  }
  return `${base.slice(0, 28)}-${newId("x").slice(2, 8)}`;
}

export async function saveDraft(env: AppEnv, projectId: string, doc: SiteDoc, revision: number, userId: string | null, note: string | null, checkpoint: boolean) {
  // Owner-supplied preview photos are never allowed on a customer's site.
  doc = stripOwnerPhotos(doc);
  const json = JSON.stringify(doc);
  const t = now();
  // Compare-and-set: the write lands only if the draft is still at the revision this save was based on, so two
  // editors who both loaded revision N can't both succeed; the slower one gets a conflict instead of overwriting.
  const head: D1PreparedStatement[] = [
    env.DB.prepare("UPDATE projects SET draft_json = ?, draft_revision = ?, template_id = ?, updated_at = ?, status = CASE WHEN status IN ('draft','generating') THEN 'preview_ready' ELSE status END WHERE id = ? AND draft_revision = ?")
      .bind(json, revision, doc.templateId, t, projectId, revision - 1),
  ];
  if (checkpoint) {
    head.push(env.DB.prepare("INSERT INTO draft_history (id, project_id, revision, doc_json, note, created_by, created_at) SELECT ?, ?, ?, ?, ?, ?, ? WHERE changes() = 1").bind(newId("hist"), projectId, revision, json, note, userId, t));
  }
  const [won] = await env.DB.batch(head);
  if (!won.meta.changes) {
    const cur = await env.DB.prepare("SELECT draft_revision FROM projects WHERE id = ?").bind(projectId).first<{ draft_revision: number }>();
    throw new HttpError(409, "This site was changed in another tab or by another person. Reload to get the latest version.", "conflict", { revision: cur?.draft_revision });
  }
  // Denormalised page/block index (reporting only; the SiteDoc JSON stays authoritative).
  const stmts: D1PreparedStatement[] = [];
  stmts.push(env.DB.prepare("DELETE FROM site_pages WHERE project_id = ?").bind(projectId));
  stmts.push(env.DB.prepare("DELETE FROM site_blocks WHERE project_id = ?").bind(projectId));
  doc.pages.forEach((p, i) => {
    stmts.push(env.DB.prepare("INSERT INTO site_pages (id, project_id, slug, title, position) VALUES (?, ?, ?, ?, ?)").bind(p.id, projectId, p.slug, p.title, i));
    p.sections.forEach((s, j) => stmts.push(env.DB.prepare("INSERT OR IGNORE INTO site_blocks (id, project_id, page_id, kind, position) VALUES (?, ?, ?, ?, ?)").bind(s.id, projectId, p.id, s.kind, j)));
  });
  // D1 caps statements per batch generously, but keep within limits by chunking
  for (let i = 0; i < stmts.length; i += 90) await env.DB.batch(stmts.slice(i, i + 90));
}
