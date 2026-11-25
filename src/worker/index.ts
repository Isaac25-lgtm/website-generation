import { Hono } from "hono";
import type { AppEnv, HonoEnv } from "./env";
import { HttpError, baseUrl, now } from "./env";
import { csrfMiddleware, sessionMiddleware } from "./lib/auth";
import { newId } from "./lib/crypto";
import { aiAvailable } from "./lib/ai";
import { dodoConfigured, paymentsMode } from "./lib/dodo";
import { emailConfigured } from "./lib/email";
import { storageBackend } from "./lib/storage";
import { publicConfig } from "./lib/config";
import { auth, account } from "./routes/auth";
import { projects } from "./routes/projects";
import { assets } from "./routes/assets";
import { commerce } from "./routes/commerce";
import { publicApi, support } from "./routes/public";
import { billing, webhooks } from "./routes/billing";
import { admin } from "./routes/admin";
import { sites } from "./routes/sites";
import { assistant } from "./routes/assistant";
import { PLANS } from "../shared/pricing";
import { PUBLIC_DEMOS } from "../shared/demo";

const app = new Hono<HonoEnv>();

app.use("*", async (c, next) => {
  c.set("requestId", newId("req").slice(4, 14));
  await next();
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    c.res.headers.set("x-content-type-options", "nosniff");
    c.res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
    if (!c.res.headers.has("cache-control")) c.res.headers.set("cache-control", "no-store");
  }
});
app.use("*", sessionMiddleware);
app.use("/api/*", csrfMiddleware);

app.get("/healthz", async (c) => {
  const db = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>().catch(() => null);
  return c.json({ ok: !!db, time: new Date().toISOString() }, db ? 200 : 503);
});

app.get("/api/config", async (c) => c.json(await publicConfig(c.env)));

app.route("/api/auth", auth);
app.route("/api/account", account);
app.route("/api/projects", projects);
app.route("/api", assets);
app.route("/api", commerce);
app.route("/api/public", publicApi);
app.route("/api/support", support);
app.route("/api/billing", billing);
app.route("/api/webhooks", webhooks);
app.route("/api/admin", admin);
app.route("/api/assistant", assistant);
app.route("/", sites);

app.get("/robots.txt", (c) => c.text(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /preview/\nDisallow: /dashboard\nDisallow: /projects/\nSitemap: ${baseUrl(c)}/sitemap.xml\n`));
app.get("/sitemap.xml", async (c) => {
  const b = baseUrl(c);
  const pages = ["/", "/pricing", "/templates", "/how-it-works", "/contact", "/terms", "/privacy", "/refunds"];
  const sitesLive = await c.env.DB.prepare("SELECT ps.slug, ps.last_published_at FROM published_sites ps JOIN projects p ON p.id = ps.project_id WHERE ps.status = 'live' AND p.deleted_at IS NULL LIMIT 5000").all<{ slug: string; last_published_at: number }>();
  const urls = [...pages.map((p) => `<url><loc>${b}${p}</loc></url>`), ...sitesLive.results.map((s) => `<url><loc>${b}/s/${s.slug}/</loc><lastmod>${new Date(s.last_published_at).toISOString().slice(0, 10)}</lastmod></url>`)];
  return c.body(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, 200, { "content-type": "application/xml" });
});

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.onError(async (err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message, code: err.code, ...(err.extra ?? {}) }, err.status as 400);
  }
  if (err && typeof err === "object" && "issues" in err) {
    return c.json({ error: "Some fields are invalid. Please check and try again.", code: "validation" }, 400);
  }
  const id = newId("err");
  console.error(id, (err as Error)?.stack || err);
  try {
    await c.env.DB.prepare("INSERT INTO error_events (id, route, message, created_at) VALUES (?, ?, ?, ?)").bind(id, new URL(c.req.url).pathname.slice(0, 200), String((err as Error)?.message || err).slice(0, 500), now()).run();
  } catch { /* ignore */ }
  return c.json({ error: `Something went wrong on our side. Reference: ${id.slice(-8).toUpperCase()}`, code: "server_error" }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_evt: ScheduledController, env: AppEnv) {
    const t = Date.now();
    await env.DB.batch([
      env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(t),
      env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(Math.floor(t / 1000) - 2 * 86400),
      env.DB.prepare("DELETE FROM password_resets WHERE expires_at < ?").bind(t - 7 * 86400_000),
      env.DB.prepare("DELETE FROM error_events WHERE created_at < ?").bind(t - 30 * 86400_000),
    ]);
  },
} satisfies ExportedHandler<AppEnv>;
