import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";
import type { AppEnv, Ctx, HonoEnv, SessionUser } from "../env";
import { HttpError, now } from "../env";
import { newId, randomToken, sha256Hex } from "./crypto";

export const SESSION_COOKIE = "is_session";
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

export function isAdminEmail(env: AppEnv, email: string, verified: number): boolean {
  if (!verified) return false;
  const list = (env.ADMIN_EMAILS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function ipHash(c: Ctx): Promise<string> {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "local";
  return (await sha256Hex(`${ip}|${c.env.SESSION_SECRET || "dev"}`)).slice(0, 24);
}

export async function createSession(c: Ctx, userId: string): Promise<void> {
  const token = randomToken(32);
  const id = await sha256Hex(token);
  const t = now();
  await c.env.DB.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, userId, t, t + SESSION_TTL_MS, await ipHash(c), (c.req.header("user-agent") || "").slice(0, 200))
    .run();
  setCookie(c, SESSION_COOKIE, token, {
    path: "/", httpOnly: true, secure: true, sameSite: "Lax", maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(c: Ctx): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
  deleteCookie(c, SESSION_COOKIE, { path: "/", secure: true });
}

export async function loadUser(c: Ctx): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const id = await sha256Hex(token);
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role, u.email_verified, u.status, u.google_sub,
            (u.password_hash IS NOT NULL) AS has_password, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
  ).bind(id).first<SessionUser & { expires_at: number }>();
  if (!row || row.expires_at < now() || row.status !== "active") return null;
  const { expires_at: _e, ...user } = row;
  return { ...user, isAdmin: user.role === "admin" || isAdminEmail(c.env, user.email, user.email_verified) };
}

/** Attaches the session user (or null) to every request. */
export const sessionMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  c.set("user", await loadUser(c));
  await next();
};

/**
 * CSRF defence for cookie-authenticated state changes: a custom header (which a
 * cross-site form cannot send without a CORS preflight we never grant) plus an
 * Origin check when the browser provides one.
 */
export const csrfMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const m = c.req.method;
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return next();
  const path = new URL(c.req.url).pathname;
  if (path.startsWith("/api/webhooks/")) return next();
  if (!c.req.header("x-requested-with")) throw new HttpError(403, "Missing request header", "csrf");
  if (!path.startsWith("/api/public/")) {
    const origin = c.req.header("origin");
    if (origin) {
      const self = new URL(c.req.url);
      if (origin !== `${self.protocol}//${self.host}`) throw new HttpError(403, "Cross-origin request blocked", "csrf");
    }
  }
  return next();
};

export function requireUser(c: Ctx): SessionUser {
  const u = c.get("user");
  if (!u) throw new HttpError(401, "Please sign in to continue.", "unauthenticated");
  return u;
}

export function requireAdmin(c: Ctx): SessionUser {
  const u = requireUser(c);
  if (!u.isAdmin) throw new HttpError(403, "Administrator access required.", "forbidden");
  return u;
}

export async function audit(env: AppEnv, actorId: string | null, action: string, targetType?: string, targetId?: string, detail?: unknown) {
  await env.DB.prepare("INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(newId("aud"), actorId, action, targetType ?? null, targetId ?? null, detail === undefined ? null : JSON.stringify(detail).slice(0, 4000), now())
    .run();
}

export async function rateLimit(env: AppEnv, key: string, limit: number, windowSec: number): Promise<boolean> {
  const win = Math.floor(Date.now() / 1000 / windowSec) * windowSec;
  const r = await env.DB.prepare(
    "INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1 RETURNING count",
  ).bind(key, win).first<{ count: number }>();
  return (r?.count ?? 0) <= limit;
}

export async function enforceRate(env: AppEnv, key: string, limit: number, windowSec: number, message = "Too many requests. Please wait a moment and try again.") {
  if (!(await rateLimit(env, key, limit, windowSec))) throw new HttpError(429, message, "rate_limited");
}
