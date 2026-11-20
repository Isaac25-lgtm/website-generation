import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "../env";
import { HttpError, baseUrl, now } from "../env";
import { audit, requireAdmin } from "../lib/auth";
import { newId, randomToken, sha256Hex } from "../lib/crypto";

export const admin = new Hono<HonoEnv>();

admin.use("*", async (c, next) => { requireAdmin(c); await next(); });

admin.get("/overview", async (c) => {
  const d30 = now() - 30 * 86400_000;
  const q = (sql: string, ...b: unknown[]) => c.env.DB.prepare(sql).bind(...b);
  const r = await c.env.DB.batch([
    q("SELECT COUNT(*) AS n FROM users"),
    q("SELECT COUNT(*) AS n FROM users WHERE created_at > ?", d30),
    q("SELECT site_type, status, COUNT(*) AS n FROM projects WHERE deleted_at IS NULL AND is_demo = 0 GROUP BY site_type, status"),
    q("SELECT COUNT(*) AS n FROM published_sites ps JOIN projects p ON p.id = ps.project_id WHERE ps.status = 'live' AND p.is_demo = 0"),
    q("SELECT kind, status, COUNT(*) AS n, COALESCE(SUM(input_tokens),0) AS tin, COALESCE(SUM(output_tokens),0) AS tout FROM generation_jobs WHERE created_at > ? GROUP BY kind, status", d30),
    q("SELECT COUNT(*) AS n, COALESCE(SUM(bytes),0) AS b, storage FROM site_assets WHERE deleted_at IS NULL GROUP BY storage"),
    q("SELECT mode, status, COUNT(*) AS n, COALESCE(SUM(amount_cents),0) AS cents FROM payments GROUP BY mode, status"),
    q("SELECT status, COUNT(*) AS n FROM support_tickets GROUP BY status"),
    q("SELECT COUNT(*) AS n FROM orders WHERE is_demo = 0"),
    q("SELECT status, COUNT(*) AS n FROM webhook_events GROUP BY status"),
    q("SELECT action, status, COUNT(*) AS n FROM publication_jobs WHERE created_at > ? GROUP BY action, status", d30),
    q("SELECT COUNT(*) AS n FROM inspiration_references WHERE status = 'failed' AND created_at > ?", d30),
    q("SELECT id, route, message, created_at FROM error_events ORDER BY created_at DESC LIMIT 20"),
  ]);
  const first = (i: number) => (r[i].results[0] as any)?.n ?? 0;
  return c.json({
    users: first(0), usersLast30: first(1), projects: r[2].results, liveSites: first(3), generation: r[4].results, media: r[5].results,
    payments: r[6].results, tickets: r[7].results, realOrders: first(8), webhooks: r[9].results, publishing: r[10].results,
    failedInspirations30: first(11), recentErrors: r[12].results,
  });
});

admin.get("/users", async (c) => {
  const q = `%${(c.req.query("q") || "").slice(0, 80)}%`;
  const r = await c.env.DB.prepare("SELECT id, email, name, role, status, email_verified, google_sub IS NOT NULL AS google, created_at, (SELECT COUNT(*) FROM projects p WHERE p.owner_id = users.id AND p.deleted_at IS NULL) AS projects FROM users WHERE email LIKE ? OR name LIKE ? ORDER BY created_at DESC LIMIT 100").bind(q, q).all();
  return c.json({ users: r.results });
});

admin.patch("/users/:uid", async (c) => {
  const me = requireAdmin(c);
  const body = z.object({ status: z.enum(["active", "suspended"]) }).parse(await c.req.json());
  if (c.req.param("uid") === me.id) throw new HttpError(400, "You can't change your own status.");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").bind(body.status, now(), c.req.param("uid")),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND ? = 'suspended'").bind(c.req.param("uid"), body.status),
  ]);
  await audit(c.env, me.id, "admin.user_status", "user", c.req.param("uid"), body);
  return c.json({ ok: true });
});

admin.post("/users/:uid/reset-link", async (c) => {
  const me = requireAdmin(c);
  const u = await c.env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(c.req.param("uid")).first<{ id: string }>();
  if (!u) throw new HttpError(404, "User not found.");
  const token = randomToken(32);
  await c.env.DB.prepare("INSERT INTO password_resets (id, user_id, created_at, expires_at, created_by) VALUES (?, ?, ?, ?, ?)").bind(await sha256Hex(token), u.id, now(), now() + 24 * 3600_000, me.id).run();
  await audit(c.env, me.id, "admin.reset_link_created", "user", u.id);
  return c.json({ url: `${baseUrl(c)}/reset-password?token=${token}`, note: "Send this link to the verified account holder only. It expires in 24 hours." });
});

admin.get("/projects", async (c) => {
  const q = `%${(c.req.query("q") || "").slice(0, 80)}%`;
  const r = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.slug, p.site_type, p.status, p.is_demo, p.created_at, p.updated_at, u.email AS owner,
            ps.status AS pub_status, (SELECT source FROM entitlements e WHERE e.project_id = p.id AND e.status = 'active' LIMIT 1) AS entitlement
       FROM projects p JOIN users u ON u.id = p.owner_id LEFT JOIN published_sites ps ON ps.project_id = p.id
      WHERE p.deleted_at IS NULL AND (p.name LIKE ? OR p.slug LIKE ? OR u.email LIKE ?) ORDER BY p.updated_at DESC LIMIT 150`,
  ).bind(q, q, q).all();
  return c.json({ projects: r.results });
});

admin.post("/projects/:pid/entitlement", async (c) => {
  const me = requireAdmin(c);
  const body = z.object({ reason: z.string().trim().min(5, "Give a reason (kept in the audit log).").max(300) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Reason required");
  const p = await c.env.DB.prepare("SELECT id, owner_id, site_type FROM projects WHERE id = ? AND deleted_at IS NULL").bind(c.req.param("pid")).first<{ id: string; owner_id: string; site_type: string }>();
  if (!p) throw new HttpError(404, "Project not found.");
  await c.env.DB.prepare("INSERT INTO entitlements (id, project_id, user_id, site_type, source, granted_by, reason, status, created_at) VALUES (?, ?, ?, ?, 'admin_demo', ?, ?, 'active', ?)").bind(newId("ent"), p.id, p.owner_id, p.site_type, me.id, body.data.reason, now()).run();
  await audit(c.env, me.id, "admin.demo_entitlement_granted", "project", p.id, { reason: body.data.reason });
  return c.json({ ok: true });
});

admin.delete("/projects/:pid/entitlement", async (c) => {
  const me = requireAdmin(c);
  await c.env.DB.prepare("UPDATE entitlements SET status = 'revoked', revoked_at = ? WHERE project_id = ? AND source = 'admin_demo' AND status = 'active'").bind(now(), c.req.param("pid")).run();
  await audit(c.env, me.id, "admin.demo_entitlement_revoked", "project", c.req.param("pid"));
  return c.json({ ok: true });
});

admin.post("/projects/:pid/suspend", async (c) => {
  const me = requireAdmin(c);
  const body = z.object({ reason: z.string().trim().min(5).max(300), suspend: z.boolean() }).parse(await c.req.json());
  const pid = c.req.param("pid");
  if (body.suspend) {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE projects SET status = 'suspended', updated_at = ? WHERE id = ?").bind(now(), pid),
      c.env.DB.prepare("UPDATE published_sites SET status = 'suspended' WHERE project_id = ?").bind(pid),
      c.env.DB.prepare("INSERT INTO publication_jobs (id, project_id, user_id, action, status, created_at) VALUES (?, ?, ?, 'suspend', 'succeeded', ?)").bind(newId("pub"), pid, me.id, now()),
    ]);
  } else {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE projects SET status = 'preview_ready', updated_at = ? WHERE id = ? AND status = 'suspended'").bind(now(), pid),
      c.env.DB.prepare("UPDATE published_sites SET status = 'unpublished' WHERE project_id = ? AND status = 'suspended'").bind(pid),
    ]);
  }
  await audit(c.env, me.id, body.suspend ? "admin.site_suspended" : "admin.site_unsuspended", "project", pid, { reason: body.reason });
  return c.json({ ok: true });
});

admin.get("/tickets", async (c) => {
  const r = await c.env.DB.prepare("SELECT id, category, name, email, subject, message, reference_url, status, admin_note, created_at FROM support_tickets ORDER BY (status IN ('open','in_progress')) DESC, created_at DESC LIMIT 200").all();
  return c.json({ tickets: r.results });
});

admin.patch("/tickets/:tid", async (c) => {
  const me = requireAdmin(c);
  const body = z.object({ status: z.enum(["open", "in_progress", "resolved", "closed"]), adminNote: z.string().max(2000).optional() }).parse(await c.req.json());
  await c.env.DB.prepare("UPDATE support_tickets SET status = ?, admin_note = COALESCE(?, admin_note), updated_at = ? WHERE id = ?").bind(body.status, body.adminNote ?? null, now(), c.req.param("tid")).run();
  await audit(c.env, me.id, "admin.ticket_updated", "ticket", c.req.param("tid"), { status: body.status });
  return c.json({ ok: true });
});

admin.get("/payments", async (c) => {
  const [pays, hooks, sessions] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT p.*, u.email FROM payments p LEFT JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC LIMIT 100"),
    c.env.DB.prepare("SELECT id, event_type, status, error, received_at, processed_at FROM webhook_events ORDER BY received_at DESC LIMIT 100"),
    c.env.DB.prepare("SELECT id, project_id, site_type, amount_cents, mode, status, created_at FROM builder_checkout_sessions ORDER BY created_at DESC LIMIT 100"),
  ]);
  return c.json({ payments: pays.results, webhooks: hooks.results, checkouts: sessions.results });
});

admin.get("/orders", async (c) => {
  const r = await c.env.DB.prepare("SELECT o.id, o.number, o.project_id, p.name AS store, o.status, o.payment_status, o.currency, o.total_cents, o.is_demo, o.created_at FROM orders o JOIN projects p ON p.id = o.project_id ORDER BY o.created_at DESC LIMIT 200").all();
  return c.json({ orders: r.results });
});

const SETTING_KEYS = ["hosting_fee_status", "hosting_fee_amount", "hosting_fee_currency", "hosting_fee_interval", "ai_generations_per_project", "free_previews_per_day", "operator_display_name", "operator_status_note", "support_email"] as const;

admin.get("/settings", async (c) => {
  const r = await c.env.DB.prepare("SELECT key, value, updated_at FROM system_settings").all();
  return c.json({ settings: r.results });
});

admin.put("/settings", async (c) => {
  const me = requireAdmin(c);
  const body = z.record(z.string(), z.string().max(500)).parse(await c.req.json());
  const stmts = [];
  for (const [k, v] of Object.entries(body)) {
    if (!(SETTING_KEYS as readonly string[]).includes(k)) throw new HttpError(400, `Unknown setting ${k}`);
    if (k === "hosting_fee_status" && !["not_set", "announced", "active"].includes(v)) throw new HttpError(400, "hosting_fee_status must be not_set, announced or active");
    if (k === "ai_generations_per_project" && !/^\d{1,3}$/.test(v)) throw new HttpError(400, "AI limit must be a number");
    stmts.push(c.env.DB.prepare("INSERT INTO system_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at").bind(k, v.trim(), me.id, now()));
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await audit(c.env, me.id, "admin.settings_updated", "settings", undefined, body);
  return c.json({ ok: true });
});

admin.get("/audit", async (c) => {
  const r = await c.env.DB.prepare("SELECT a.id, a.action, a.target_type, a.target_id, a.detail_json, a.created_at, u.email AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 200").all();
  return c.json({ audit: r.results });
});
