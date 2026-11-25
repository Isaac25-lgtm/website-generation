import { Hono } from "hono";
import type { Ctx, HonoEnv } from "../env";
import { HttpError, baseUrl } from "../env";
import { randomToken } from "../lib/crypto";
import { draftDoc, loadAssetMeta, loadStore, renderCtxBase, verifyPreviewToken, type ProjectRow } from "../lib/site";
import { getBlob } from "../lib/storage";
import { ensureDemos } from "../seed";
import { routeOrderView } from "./public";
import { parseSiteDoc, type SiteDoc } from "../../shared/schema";
import { getTemplate, STORE_CATEGORIES, TEMPLATE_MAP, TEMPLATES } from "../../shared/templates";
import { renderSite } from "../../shared/render";
import { PERSONAS, demoProductViews, PUBLIC_DEMOS } from "../../shared/demo";
import { generateSiteDoc } from "../../shared/generate";

export const sites = new Hono<HonoEnv>();

function siteHeaders(nonce: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": [
      "default-src 'self'", `script-src 'nonce-${nonce}'`, "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com", "img-src 'self' data: blob:", "connect-src 'self'",
      "frame-src https://www.google.com https://maps.google.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "form-action 'self'", "base-uri 'none'", "object-src 'none'", "frame-ancestors 'self'",
    ].join("; "),
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    ...extra,
  };
}

// ───── Published customer sites: /s/:slug/... ─────
async function servePublished(c: Ctx) {
  const slug = c.req.param("slug")!.toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return c.notFound();
  if (slug.startsWith("demo-")) await ensureDemos(c.env);
  const url = new URL(c.req.url);
  const rest = url.pathname.slice(`/s/${slug}`.length);
  if (rest === "") return c.redirect(`/s/${slug}/${url.search}`, 301);
  const row = await c.env.DB.prepare(
    `SELECT p.id, p.is_demo, ps.status, sv.doc_json FROM published_sites ps JOIN projects p ON p.id = ps.project_id
       LEFT JOIN site_versions sv ON sv.id = ps.current_version_id WHERE ps.slug = ? AND p.deleted_at IS NULL`,
  ).bind(slug).first<{ id: string; is_demo: number; status: string; doc_json: string | null }>();
  const nonce = randomToken(16);
  if (!row || row.status !== "live" || !row.doc_json) {
    const msg = row?.status === "suspended" ? "This website is unavailable." : "This website isn't published.";
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${msg}</title><body style="font-family:system-ui;display:grid;place-items:center;min-height:90vh;color:#222"><main style="text-align:center"><h1>${msg}</h1><p><a href="/">${c.env.APP_NAME}</a></p></main></body></html>`, { status: 404, headers: siteHeaders(nonce) });
  }
  const parsed = parseSiteDoc(JSON.parse(row.doc_json));
  if (!parsed.ok) throw new HttpError(500, "Site data error");
  const doc = parsed.doc;
  const ctx = { ...renderCtxBase(c, row.id, `/s/${slug}`, "published" as const), nonce, isDemo: !!row.is_demo, query: url.searchParams, staticMode: url.searchParams.get("static") === "1", assets: await loadAssetMeta(c.env, row.id) };
  if (doc.type === "ecommerce") {
    const store = await loadStore(c.env, row.id);
    // Only list products priced in the live store's currency; checkout refuses the rest.
    store.products = store.products.filter((p) => p.currency === doc.store?.currency);
    Object.assign(ctx, { store });
    const m = rest.match(/^\/order\/(ord_[a-z0-9]+)\/?$/);
    if (m) Object.assign(ctx, { order: await routeOrderView(c.env, row.id, m[1], url.searchParams.get("k") ?? undefined) });
  }
  const r = renderSite(doc, getTemplate(doc.templateId, doc.type), ctx, rest);
  const noStore = doc.type === "ecommerce" || rest.startsWith("/order");
  return new Response(r.html, { status: r.status, headers: siteHeaders(nonce, { "cache-control": noStore ? "no-store" : "public, max-age=60" }) });
}
sites.get("/s/:slug", servePublished);
sites.get("/s/:slug/*", servePublished);

// ───── Private draft previews: owner session or signed share link ─────
async function servePreview(c: Ctx) {
  const pid = c.req.param("pid")!;
  if (!/^prj_[a-z0-9]{10,30}$/.test(pid)) return c.notFound();
  const url = new URL(c.req.url);
  const rest = url.pathname.slice(`/preview/${pid}`.length);
  const p = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL").bind(pid).first<ProjectRow>();
  const u = c.get("user");
  const allowed = !!p && ((u && (u.id === p.owner_id || u.isAdmin)) || (await verifyPreviewToken(c.env, pid, url.searchParams.get("t") ?? undefined)));
  if (!p || !allowed) return c.html(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Preview unavailable</title><body style="font-family:system-ui;padding:3rem"><h1>Preview unavailable</h1><p>This preview link is invalid or has expired, or you need to sign in.</p></body>`, 404);
  const doc = draftDoc(p);
  if (!doc) return c.html(`<!doctype html><meta charset="utf-8"><title>Not generated yet</title><body style="font-family:system-ui;padding:3rem;color:#444"><h1>Your site hasn't been generated yet</h1><p>Finish the setup steps and press “Generate my website”.</p></body>`, 200);
  const nonce = randomToken(16);
  const token = url.searchParams.get("t");
  const ctx = { ...renderCtxBase(c, p.id, `/preview/${p.id}`, "preview" as const), nonce, query: url.searchParams, staticMode: url.searchParams.get("static") === "1", assets: await loadAssetMeta(c.env, p.id) };
  if (doc.type === "ecommerce") Object.assign(ctx, { store: await loadStore(c.env, p.id, { includeDrafts: false }) });
  let html = renderSite(doc, getTemplate(doc.templateId, doc.type), ctx, rest).html;
  // keep the share token on internal navigation inside a shared preview
  if (token) html = html.replace(/href="(\/preview\/[^"?#]*)([^"]*)"/g, (_m, path, tail) => `href="${path}${tail.startsWith("?") ? tail + "&" : "?"}t=${encodeURIComponent(token)}"`);
  return new Response(html, { headers: siteHeaders(nonce, { "cache-control": "private, no-store", "x-robots-tag": "noindex" }) });
}
sites.get("/preview/:pid", (c) => c.redirect(`/preview/${c.req.param("pid")}/${new URL(c.req.url).search}`));
sites.get("/preview/:pid/*", servePreview);

// ───── Template gallery API + live sample previews ─────
sites.get("/api/templates", (c) => {
  const signedIn = !!c.get("user");
  return c.json({
    signedIn,
    templates: TEMPLATES.map((t) => ({
      id: t.id, name: t.name, type: t.type, tier: t.tier, styles: t.styles, industries: t.industries, description: t.description,
      colors: t.theme.colors, mode: t.theme.mode, fontHeading: t.theme.fontHeading, locked: t.tier === "member" && !signedIn,
      category: t.category ?? null, rank: t.rank ?? "standard", layout: t.layout ?? null,
    })),
    categories: STORE_CATEGORIES,
  });
});

/** The limited document behind a signed-out gallery card: the home page's first section only, no other page content. */
export function thumbnailDoc(doc: SiteDoc): SiteDoc {
  return { ...doc, pages: doc.pages.map((p) => ({ ...p, sections: p.slug === "" ? p.sections.slice(0, 1) : [] })) };
}

async function serveTemplatePreview(c: Ctx) {
  const tpl = TEMPLATE_MAP[c.req.param("tid")!];
  if (!tpl) return c.notFound();
  // Member templates need sign-in. Signed-out visitors get only a deliberately limited gallery thumbnail
  // (home page header and first section, static) — never the full home page, other pages or product details.
  const reqUrl = new URL(c.req.url);
  const restPath = reqUrl.pathname.slice(`/api/templates/${tpl.id}/preview`.length).replace(/^\/+|\/+$/g, "");
  const locked = tpl.tier === "member" && !c.get("user");
  const thumbOnly = locked && reqUrl.searchParams.get("static") === "1" && restPath === "";
  if (locked && !thumbOnly) {
    return c.html(`<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;display:grid;place-items:center;min-height:95vh;background:#fafafa;color:#171717;margin:0"><div style="text-align:center;padding:2rem"><h1 style="font-size:1.3rem">Sign in to unlock “${tpl.name}”</h1><p style="opacity:.75">Members get access to the full template library.</p></div></body>`, 200);
  }
  const persona = PERSONAS[tpl.id];
  const full = generateSiteDoc(tpl.type, tpl.id, persona.answers);
  const doc = thumbOnly ? thumbnailDoc(full) : full;
  const url = new URL(c.req.url);
  const base = `/api/templates/${tpl.id}/preview`;
  const rest = url.pathname.slice(base.length);
  const nonce = randomToken(16);
  const ctx = { ...renderCtxBase(c, "prj_template_preview", base, "template" as const), nonce, query: url.searchParams, staticMode: url.searchParams.get("static") === "1" };
  if (tpl.type === "ecommerce") Object.assign(ctx, { store: demoProductViews(persona, doc.store!.currency) });
  const r = renderSite(doc, tpl, ctx, rest);
  return new Response(r.html, { status: r.status, headers: siteHeaders(nonce, { "cache-control": tpl.tier === "public" ? "public, max-age=600" : "private, max-age=600", "x-robots-tag": "noindex" }) });
}
sites.get("/api/templates/:tid/preview", (c) => c.redirect(`/api/templates/${c.req.param("tid")}/preview/`));
sites.get("/api/templates/:tid/preview/*", serveTemplatePreview);

sites.get("/api/examples", async (c) => {
  await ensureDemos(c.env);
  return c.json({ examples: PUBLIC_DEMOS.map((d) => ({ ...d, url: `${baseUrl(c)}/s/${d.slug}/`, template: TEMPLATE_MAP[d.templateId].name })) });
});

// ───── Media ─────
sites.get("/media/:aid", async (c) => {
  const aid = c.req.param("aid");
  if (!/^ast_[a-z0-9]{10,30}$/.test(aid)) return c.notFound();
  const a = await c.env.DB.prepare("SELECT a.*, p.owner_id FROM site_assets a LEFT JOIN projects p ON p.id = a.project_id WHERE a.id = ? AND a.deleted_at IS NULL").bind(aid).first<any>();
  if (!a) return c.notFound();
  if (a.visibility === "private") {
    const u = c.get("user");
    if (!u || (u.id !== a.owner_id && !u.isAdmin)) return c.notFound();
  }
  const etag = `"${a.sha256?.slice(0, 32) ?? aid}"`;
  if (c.req.header("if-none-match") === etag) return new Response(null, { status: 304, headers: { etag } });
  const body = await getBlob(c.env, a.storage, a.storage_key);
  if (!body) return c.notFound();
  const download = c.req.query("download") === "1" || a.mime === "application/pdf";
  const filename = (a.original_name || `file`).replace(/[^\w.\- ]+/g, "_");
  return new Response(body, {
    headers: {
      "content-type": a.mime, etag,
      "cache-control": a.visibility === "private" ? "private, max-age=3600" : "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "cross-origin-resource-policy": "same-site",
    },
  });
});
