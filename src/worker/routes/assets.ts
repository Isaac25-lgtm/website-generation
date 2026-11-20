import { Hono } from "hono";
import { z } from "zod";
import type { Ctx, HonoEnv } from "../env";
import { HttpError, now } from "../env";
import { audit, enforceRate, requireUser } from "../lib/auth";
import { newId, sha256Hex } from "../lib/crypto";
import { ownedProject } from "../lib/site";
import { deleteBlob, imageSize, MAX_DOC_BYTES, MAX_IMAGE_BYTES, putBlob, sniffMime, storageBackend } from "../lib/storage";
import { safeFetch } from "../lib/ssrf";
import { analyzeUrl, briefFromSampledColors } from "../lib/inspiration";

export const assets = new Hono<HonoEnv>();

const PROJECT_QUOTA_BYTES = 300 * 1024 * 1024;
const PROJECT_QUOTA_BYTES_D1 = 60 * 1024 * 1024;
const PROJECT_QUOTA_FILES = 400;

function assetJson(a: any) {
  return { id: a.id, kind: a.kind, mime: a.mime, bytes: a.bytes, width: a.width, height: a.height, name: a.original_name, alt: a.alt, source: a.source, license: a.license, attribution: a.attribution, sourceUrl: a.source_url, url: `/media/${a.id}`, createdAt: a.created_at };
}

async function storeAsset(c: Ctx, projectId: string, ownerId: string, bytes: Uint8Array, declaredName: string, opts: { kind?: "image" | "document" | "screenshot"; alt?: string; source?: string; license?: string | null; attribution?: string | null; sourceUrl?: string | null; visibility?: "public" | "private" } = {}) {
  const mime = sniffMime(bytes);
  if (!mime) throw new HttpError(415, "Unsupported file. Upload JPG, PNG, WebP or GIF images, or a PDF document.", "bad_type");
  const isDoc = mime === "application/pdf";
  if (bytes.byteLength > (isDoc ? MAX_DOC_BYTES : MAX_IMAGE_BYTES)) throw new HttpError(413, `File too large. Maximum ${isDoc ? 10 : 8} MB.`, "too_large");
  const usage = await c.env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS b FROM site_assets WHERE project_id = ? AND deleted_at IS NULL").bind(projectId).first<{ n: number; b: number }>();
  const quota = storageBackend(c.env) === "r2" ? PROJECT_QUOTA_BYTES : PROJECT_QUOTA_BYTES_D1;
  if ((usage?.n ?? 0) >= PROJECT_QUOTA_FILES || (usage?.b ?? 0) + bytes.byteLength > quota) throw new HttpError(413, "This project's media storage is full. Delete unused files first.", "quota");
  const id = newId("ast");
  const key = `p/${projectId}/${id}`;
  const storage = await putBlob(c.env, key, bytes, mime);
  const dims = mime.startsWith("image/") ? imageSize(bytes, mime) : null;
  const kind = opts.kind ?? (isDoc ? "document" : "image");
  const safeName = declaredName.replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  await c.env.DB.prepare(
    `INSERT INTO site_assets (id, project_id, owner_id, kind, mime, bytes, width, height, original_name, storage, storage_key, alt, source, license, attribution, source_url, visibility, sha256, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(id, projectId, ownerId, kind, mime, bytes.byteLength, dims?.width ?? null, dims?.height ?? null, safeName, storage, key,
    (opts.alt ?? "").slice(0, 300), opts.source ?? "upload", opts.license ?? null, opts.attribution ?? null, opts.sourceUrl ?? null,
    opts.visibility ?? "public", await sha256Hex(bytes), now()).run();
  return c.env.DB.prepare("SELECT * FROM site_assets WHERE id = ?").bind(id).first();
}

assets.get("/projects/:id/assets", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const r = await c.env.DB.prepare("SELECT * FROM site_assets WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 400").bind(p.id).all();
  const usage = r.results.reduce((a: number, x: any) => a + x.bytes, 0);
  return c.json({ assets: r.results.map(assetJson), usageBytes: usage, quotaBytes: storageBackend(c.env) === "r2" ? PROJECT_QUOTA_BYTES : PROJECT_QUOTA_BYTES_D1, storage: storageBackend(c.env) });
});

assets.post("/projects/:id/assets", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  await enforceRate(c.env, `upload:${u.id}`, 120, 3600, "Upload limit reached for this hour.");
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") throw new HttpError(400, "Choose a file to upload.");
  const f = file as File;
  if (f.size > MAX_DOC_BYTES) throw new HttpError(413, "File too large.");
  const bytes = new Uint8Array(await f.arrayBuffer());
  const row = await storeAsset(c, p.id, u.id, bytes, f.name || "upload", { alt: String(form!.get("alt") || "") });
  return c.json({ asset: assetJson(row) });
});

assets.patch("/assets/:aid", async (c) => {
  const u = requireUser(c);
  const a = await c.env.DB.prepare("SELECT project_id FROM site_assets WHERE id = ? AND deleted_at IS NULL").bind(c.req.param("aid")).first<{ project_id: string }>();
  if (!a) throw new HttpError(404, "File not found.");
  await ownedProject(c, u, a.project_id);
  const body = z.object({ alt: z.string().max(300) }).parse(await c.req.json());
  await c.env.DB.prepare("UPDATE site_assets SET alt = ? WHERE id = ?").bind(body.alt, c.req.param("aid")).run();
  return c.json({ ok: true });
});

assets.delete("/assets/:aid", async (c) => {
  const u = requireUser(c);
  const aid = c.req.param("aid");
  const a = await c.env.DB.prepare("SELECT * FROM site_assets WHERE id = ? AND deleted_at IS NULL").bind(aid).first<{ project_id: string; storage: string; storage_key: string }>();
  if (!a) throw new HttpError(404, "File not found.");
  await ownedProject(c, u, a.project_id);
  // Refuse to delete media used by the live published version (would break the public site).
  const live = await c.env.DB.prepare("SELECT 1 FROM published_sites ps JOIN site_versions sv ON sv.id = ps.current_version_id WHERE ps.project_id = ? AND ps.status = 'live' AND instr(sv.doc_json, ?) > 0").bind(a.project_id, aid).first();
  const inProduct = await c.env.DB.prepare("SELECT 1 FROM products WHERE project_id = ? AND instr(images_json, ?) > 0").bind(a.project_id, aid).first();
  if (live || inProduct) throw new HttpError(409, "This file is used on your live site or a product. Remove it there first, then publish, before deleting.", "in_use");
  await c.env.DB.prepare("UPDATE site_assets SET deleted_at = ? WHERE id = ?").bind(now(), aid).run();
  await deleteBlob(c.env, a.storage, a.storage_key);
  return c.json({ ok: true });
});

// ───── Licensed image search (Openverse: openly licensed, commercial use allowed) ─────
assets.get("/images/search", async (c) => {
  const u = requireUser(c);
  const q = (c.req.query("q") || "").trim().slice(0, 80);
  if (q.length < 2) throw new HttpError(400, "Type at least 2 characters.");
  await enforceRate(c.env, `imgsearch:${u.id}`, 60, 3600);
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=24&mature=false`;
  let data: any;
  try {
    const r = await fetch(url, { headers: { "user-agent": "ImprintSitesAI/1.0", accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(String(r.status));
    data = await r.json();
  } catch {
    throw new HttpError(503, "The licensed image library is unavailable right now. Please upload your own photos instead.", "openverse_unavailable");
  }
  return c.json({
    provider: "Openverse",
    results: (data.results ?? []).filter((x: any) => x.thumbnail && x.license).map((x: any) => ({
      id: x.id, title: String(x.title || "").slice(0, 120), thumbnail: x.thumbnail, creator: x.creator || "Unknown",
      license: `${String(x.license).toUpperCase()} ${x.license_version || ""}`.trim(), licenseUrl: x.license_url, sourceUrl: x.foreign_landing_url,
      attribution: x.attribution || `“${x.title}” by ${x.creator || "unknown"}, ${String(x.license).toUpperCase()} ${x.license_version || ""}`,
      width: x.width, height: x.height,
    })),
  });
});

assets.post("/projects/:id/assets/import", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ openverseId: z.string().uuid(), confirm: z.literal(true), alt: z.string().max(300).default("") }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Confirm the licence terms to import this image.");
  await enforceRate(c.env, `imgimport:${u.id}`, 40, 3600);
  // Look the image up server-side; never trust a client-supplied URL or licence.
  const r = await fetch(`https://api.openverse.org/v1/images/${body.data.openverseId}/`, { headers: { accept: "application/json", "user-agent": "ImprintSitesAI/1.0" }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r || !r.ok) throw new HttpError(503, "Couldn't fetch the image details. Try again or upload your own.");
  const x = (await r.json()) as any;
  const commercialOk = ["by", "by-sa", "cc0", "pdm"].includes(String(x.license).toLowerCase());
  if (!commercialOk) throw new HttpError(422, "This image's licence doesn't allow commercial use.");
  const img = await safeFetch(String(x.url), { maxBytes: MAX_IMAGE_BYTES, timeoutMs: 15000, accept: "image/*" });
  if (img.status >= 400 || img.truncated) throw new HttpError(422, "The image file couldn't be downloaded or is too large.");
  const attribution = String(x.attribution || `“${x.title}” by ${x.creator}, licensed ${String(x.license).toUpperCase()} ${x.license_version || ""}`).slice(0, 400);
  const row = await storeAsset(c, p.id, u.id, img.bytes, `${String(x.title || "openverse").slice(0, 60)}`, {
    alt: body.data.alt || String(x.title || "").slice(0, 200), source: "openverse",
    license: `${String(x.license).toUpperCase()} ${x.license_version || ""}`.trim(), attribution: ["cc0", "pdm"].includes(String(x.license).toLowerCase()) ? null : attribution,
    sourceUrl: String(x.foreign_landing_url || "").slice(0, 600),
  });
  await audit(c.env, u.id, "asset.licensed_import", "asset", (row as any).id, { license: x.license, source: x.foreign_landing_url });
  return c.json({ asset: assetJson(row) });
});

// ───── Inspiration ─────
assets.post("/projects/:id/inspiration", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ url: z.string().trim().min(4).max(2000) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Paste a website address.");
  await enforceRate(c.env, `insp:${u.id}`, 15, 3600, "You've analysed many websites this hour. Please wait a little.");
  const id = newId("ins");
  try {
    const { brief, screenshot } = await analyzeUrl(c.env, body.data.url, p.site_type);
    let shotId: string | null = null;
    if (screenshot) {
      const row = await storeAsset(c, p.id, u.id, screenshot, `inspiration-${brief.sourceHost}.jpg`, { kind: "screenshot", source: "browser_capture", alt: `Screenshot of ${brief.sourceHost} (private reference)`, visibility: "private", sourceUrl: body.data.url });
      shotId = (row as any).id;
    }
    await c.env.DB.prepare("INSERT INTO inspiration_references (id, project_id, user_id, url, method, status, brief_json, screenshot_asset_id, created_at) VALUES (?, ?, ?, ?, ?, 'ok', ?, ?, ?)")
      .bind(id, p.id, u.id, body.data.url.slice(0, 2000), brief.method, JSON.stringify(brief), shotId, now()).run();
    return c.json({ id, brief, screenshotUrl: shotId ? `/media/${shotId}` : null });
  } catch (e) {
    const msg = e instanceof HttpError ? e.message : "We couldn't analyse that website.";
    await c.env.DB.prepare("INSERT INTO inspiration_references (id, project_id, user_id, url, method, status, error, created_at) VALUES (?, ?, ?, ?, 'html', 'failed', ?, ?)").bind(id, p.id, u.id, body.data.url.slice(0, 2000), msg.slice(0, 300), now()).run();
    if (e instanceof HttpError) throw new HttpError(e.status, `${e.message} You can upload a screenshot instead.`, e.code);
    throw new HttpError(502, `${msg} You can upload a screenshot instead.`);
  }
});

assets.post("/projects/:id/inspiration/screenshot", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const body = z.object({ colors: z.array(z.string().max(30)).min(1).max(16), notes: z.string().max(600).default(""), assetId: z.string().max(40).optional() }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Upload a screenshot first.");
  const brief = briefFromSampledColors(body.data.colors, p.site_type, body.data.notes);
  const id = newId("ins");
  await c.env.DB.prepare("INSERT INTO inspiration_references (id, project_id, user_id, method, status, brief_json, screenshot_asset_id, created_at) VALUES (?, ?, ?, 'screenshot', 'ok', ?, ?, ?)").bind(id, p.id, u.id, JSON.stringify(brief), body.data.assetId ?? null, now()).run();
  return c.json({ id, brief });
});
