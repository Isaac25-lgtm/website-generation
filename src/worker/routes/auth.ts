import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import type { HonoEnv } from "../env";
import { HttpError, baseUrl, now } from "../env";
import { audit, createSession, destroySession, enforceRate, ipHash, requireUser } from "../lib/auth";
import { b64url, hashPassword, newId, randomToken, sha256Hex, verifyPassword } from "../lib/crypto";
import { emailConfigured, sendEmail } from "../lib/email";

export const auth = new Hono<HonoEnv>();

const Email = z.string().trim().toLowerCase().email().max(200);
const Password = z.string().min(10, "Use at least 10 characters.").max(200);
const TERMS_VERSION = "2026-11-20";

function publicUser(u: { id: string; email: string; name: string; isAdmin: boolean; email_verified: number; has_password: number; google_sub: string | null }) {
  return { id: u.id, email: u.email, name: u.name, isAdmin: u.isAdmin, emailVerified: !!u.email_verified, hasPassword: !!u.has_password, google: !!u.google_sub };
}

auth.get("/me", (c) => {
  const u = c.get("user");
  return c.json({ user: u ? publicUser(u) : null });
});

auth.post("/signup", async (c) => {
  const body = z.object({ name: z.string().trim().min(1).max(80), email: Email, password: Password, acceptTerms: z.literal(true) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Please check the form.");
  const ip = await ipHash(c);
  await enforceRate(c.env, `signup:${ip}`, 8, 3600, "Too many sign-ups from this network. Please try again later.");
  const { name, email, password } = body.data;
  const exists = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (exists) throw new HttpError(409, "An account with this email already exists. Try signing in.", "email_taken");
  const id = newId("usr");
  const t = now();
  await c.env.DB.batch([
    c.env.DB.prepare("INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, email, name, await hashPassword(password), t, t),
    c.env.DB.prepare("INSERT INTO consents (id, user_id, kind, version, created_at) VALUES (?, ?, 'terms', ?, ?), (?, ?, 'privacy', ?, ?)").bind(newId("cns"), id, TERMS_VERSION, t, newId("cns"), id, TERMS_VERSION, t),
  ]);
  await createSession(c, id);
  return c.json({ ok: true });
});

auth.post("/login", async (c) => {
  const body = z.object({ email: Email, password: z.string().min(1).max(200) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Enter your email and password.");
  const ip = await ipHash(c);
  await enforceRate(c.env, `login:${ip}`, 20, 900, "Too many sign-in attempts. Please wait 15 minutes.");
  await enforceRate(c.env, `login:${body.data.email}`, 10, 900, "Too many sign-in attempts for this account. Please wait 15 minutes.");
  const u = await c.env.DB.prepare("SELECT id, password_hash, status FROM users WHERE email = ?").bind(body.data.email).first<{ id: string; password_hash: string | null; status: string }>();
  const ok = u ? await verifyPassword(body.data.password, u.password_hash) : await verifyPassword(body.data.password, "pbkdf2_sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
  if (!u || !ok) throw new HttpError(401, u && !u.password_hash ? "This account uses Google sign-in. Use “Continue with Google”." : "Incorrect email or password.", "bad_credentials");
  if (u.status !== "active") throw new HttpError(403, "This account is not active. Contact support.");
  await createSession(c, u.id);
  return c.json({ ok: true });
});

auth.post("/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

// ───── Google OAuth 2.0 (OpenID Connect, authorization code + PKCE) ─────
auth.get("/google/start", async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) return c.redirect("/login?error=google_unavailable");
  const next = c.req.query("next") || "/dashboard";
  const state = randomToken(24);
  const verifier = randomToken(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next.slice(0, 200) : "/dashboard";
  setCookie(c, "is_oauth", JSON.stringify({ state, verifier, next: safeNext }), { path: "/api/auth/google", httpOnly: true, secure: true, sameSite: "Lax", maxAge: 600 });
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID, redirect_uri: `${baseUrl(c)}/api/auth/google/callback`, response_type: "code",
    scope: "openid email profile", state, code_challenge: challenge, code_challenge_method: "S256", prompt: "select_account",
  });
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

auth.get("/google/callback", async (c) => {
  const raw = getCookie(c, "is_oauth");
  deleteCookie(c, "is_oauth", { path: "/api/auth/google", secure: true });
  let saved: { state: string; verifier: string; next: string };
  try { saved = JSON.parse(raw || ""); } catch { return c.redirect("/login?error=google_state"); }
  if (!c.req.query("code") || c.req.query("state") !== saved.state) return c.redirect("/login?error=google_state");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: c.req.query("code")!, client_id: c.env.GOOGLE_CLIENT_ID!, client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${baseUrl(c)}/api/auth/google/callback`, grant_type: "authorization_code", code_verifier: saved.verifier,
    }),
  });
  if (!tokenRes.ok) return c.redirect("/login?error=google_token");
  const tok = (await tokenRes.json()) as { access_token?: string };
  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } });
  if (!infoRes.ok) return c.redirect("/login?error=google_profile");
  const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!info.sub || !info.email || !info.email_verified) return c.redirect("/login?error=google_unverified");
  const email = info.email.toLowerCase();
  const t = now();
  let user = await c.env.DB.prepare("SELECT id, status, google_sub, email_verified FROM users WHERE google_sub = ? OR email = ? ORDER BY (google_sub = ?) DESC LIMIT 1").bind(info.sub, email, info.sub).first<{ id: string; status: string; google_sub: string | null; email_verified: number }>();
  if (user && user.status !== "active") return c.redirect("/login?error=inactive");
  if (!user) {
    const id = newId("usr");
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO users (id, email, name, google_sub, email_verified, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)").bind(id, email, (info.name || "").slice(0, 80), info.sub, (info.picture || "").slice(0, 400), t, t),
      c.env.DB.prepare("INSERT INTO consents (id, user_id, kind, version, created_at) VALUES (?, ?, 'terms', ?, ?), (?, ?, 'privacy', ?, ?)").bind(newId("cns"), id, TERMS_VERSION, t, newId("cns"), id, TERMS_VERSION, t),
    ]);
    user = { id, status: "active", google_sub: info.sub, email_verified: 1 };
  } else if (!user.google_sub) {
    // Linking Google to an email/password account whose address was never verified:
    // invalidate the unverified password and all sessions to defeat account pre-hijacking.
    const stmts = [c.env.DB.prepare("UPDATE users SET google_sub = ?, email_verified = 1, updated_at = ? WHERE id = ?").bind(info.sub, t, user.id)];
    if (!user.email_verified) {
      stmts.push(c.env.DB.prepare("UPDATE users SET password_hash = NULL WHERE id = ?").bind(user.id));
      stmts.push(c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id));
    }
    await c.env.DB.batch(stmts);
    await audit(c.env, user.id, "auth.google_linked", "user", user.id, { passwordCleared: !user.email_verified });
  }
  await createSession(c, user.id);
  return c.redirect(saved.next || "/dashboard");
});

// ───── Password reset ─────
auth.post("/forgot", async (c) => {
  const body = z.object({ email: Email }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Enter a valid email.");
  await enforceRate(c.env, `forgot:${await ipHash(c)}`, 5, 3600);
  const generic = { ok: true, emailConfigured: emailConfigured(c.env), message: emailConfigured(c.env) ? "If an account exists for that email, a reset link has been sent." : "Email delivery is not set up yet, so reset links can't be emailed. Please contact support using the contact form and we'll help you regain access." };
  const u = await c.env.DB.prepare("SELECT id, email FROM users WHERE email = ? AND status = 'active'").bind(body.data.email).first<{ id: string; email: string }>();
  if (!u || !emailConfigured(c.env)) return c.json(generic);
  const token = randomToken(32);
  await c.env.DB.prepare("INSERT INTO password_resets (id, user_id, created_at, expires_at, created_by) VALUES (?, ?, ?, ?, 'self')").bind(await sha256Hex(token), u.id, now(), now() + 3600_000).run();
  await sendEmail(c.env, { to: u.email, subject: "Reset your password", text: `Use this link within 1 hour to set a new password:\n\n${baseUrl(c)}/reset-password?token=${token}\n\nIf you didn't ask for this, ignore this email.` });
  return c.json(generic);
});

auth.post("/reset", async (c) => {
  const body = z.object({ token: z.string().min(20).max(100), password: Password }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Invalid request.");
  await enforceRate(c.env, `reset:${await ipHash(c)}`, 10, 3600);
  const id = await sha256Hex(body.data.token);
  const r = await c.env.DB.prepare("SELECT user_id, expires_at, used_at FROM password_resets WHERE id = ?").bind(id).first<{ user_id: string; expires_at: number; used_at: number | null }>();
  if (!r || r.used_at || r.expires_at < now()) throw new HttpError(400, "This reset link is invalid or has expired.");
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await hashPassword(body.data.password), now(), r.user_id),
    c.env.DB.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").bind(now(), id),
    c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(r.user_id),
  ]);
  await audit(c.env, r.user_id, "auth.password_reset", "user", r.user_id);
  return c.json({ ok: true });
});

// ───── Account self-service ─────
export const account = new Hono<HonoEnv>();

account.patch("/", async (c) => {
  const u = requireUser(c);
  const body = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Enter your name.");
  await c.env.DB.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?").bind(body.data.name, now(), u.id).run();
  return c.json({ ok: true });
});

account.post("/password", async (c) => {
  const u = requireUser(c);
  const body = z.object({ current: z.string().max(200).optional(), next: Password }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, body.error.issues[0]?.message || "Invalid request.");
  const row = await c.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(u.id).first<{ password_hash: string | null }>();
  if (row?.password_hash && !(await verifyPassword(body.data.current || "", row.password_hash))) throw new HttpError(400, "Your current password is incorrect.");
  await c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await hashPassword(body.data.next), now(), u.id).run();
  await audit(c.env, u.id, "auth.password_changed", "user", u.id);
  return c.json({ ok: true });
});

account.get("/export", async (c) => {
  const u = requireUser(c);
  const [user, projects, payments, tickets] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT id, email, name, email_verified, created_at FROM users WHERE id = ?").bind(u.id),
    c.env.DB.prepare("SELECT id, name, site_type, slug, status, template_id, draft_json, created_at, updated_at FROM projects WHERE owner_id = ? AND deleted_at IS NULL").bind(u.id),
    c.env.DB.prepare("SELECT provider, mode, amount_cents, currency, status, created_at FROM payments WHERE user_id = ?").bind(u.id),
    c.env.DB.prepare("SELECT category, subject, status, created_at FROM support_tickets WHERE user_id = ?").bind(u.id),
  ]);
  c.header("content-disposition", `attachment; filename="my-data-${new Date().toISOString().slice(0, 10)}.json"`);
  return c.json({ exportedAt: new Date().toISOString(), user: user.results[0], projects: projects.results, payments: payments.results, supportTickets: tickets.results });
});

account.post("/delete-request", async (c) => {
  const u = requireUser(c);
  const t = now();
  await c.env.DB.prepare("INSERT INTO support_tickets (id, user_id, category, name, email, subject, message, status, created_at, updated_at) VALUES (?, ?, 'privacy', ?, ?, 'Account deletion request', 'The account holder requested deletion of their account and personal data via the dashboard.', 'open', ?, ?)")
    .bind(newId("tkt"), u.id, u.name || u.email, u.email, t, t).run();
  await audit(c.env, u.id, "account.delete_requested", "user", u.id);
  return c.json({ ok: true, message: "Your deletion request has been recorded. Published sites will be taken down and your data deleted after we confirm the request." });
});
