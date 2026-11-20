import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { HttpError, baseUrl, now } from "../env";
import { audit, enforceRate, requireUser } from "../lib/auth";
import { newId, sha256Hex } from "../lib/crypto";
import { activeEntitlement, ownedProject } from "../lib/site";
import { createCheckout, dodoConfigured, getPayment, paymentsMode, productIdFor, verifyWebhook } from "../lib/dodo";
import { PLANS, priceFor, type SiteType } from "../../shared/pricing";

export const billing = new Hono<HonoEnv>();

billing.get("/status", (c) => c.json({
  provider: "dodo", configured: dodoConfigured(c.env), mode: paymentsMode(c.env),
  message: dodoConfigured(c.env)
    ? paymentsMode(c.env) === "test" ? "Payments are in TEST mode: use Dodo test cards only. No real money is charged." : "Live payments are enabled."
    : "Online payment is not available yet. You can build and preview your site for free; publishing unlocks once checkout opens.",
}));

billing.post("/projects/:id/checkout", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  if (await activeEntitlement(c.env, p.id)) throw new HttpError(409, "This site is already paid for. You can publish it.", "already_paid");
  if (!dodoConfigured(c.env)) throw new HttpError(503, "Online payment isn't available yet. Your draft is saved; you'll be able to pay and publish as soon as checkout opens.", "payments_unavailable");
  await enforceRate(c.env, `checkout:${u.id}`, 10, 3600);
  const type = p.site_type as SiteType;
  const amount = priceFor(type); // server-side, never from the client
  const sid = newId("chk");
  const t = now();
  await c.env.DB.prepare("INSERT INTO builder_checkout_sessions (id, project_id, user_id, site_type, amount_cents, currency, provider, mode, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'USD', 'dodo', ?, 'created', ?, ?)")
    .bind(sid, p.id, u.id, type, amount, paymentsMode(c.env), t, t).run();
  try {
    const session = await createCheckout(c.env, {
      productId: productIdFor(c.env, type)!, email: u.email, name: u.name,
      returnUrl: `${baseUrl(c)}/projects/${p.id}/publish?checkout=${sid}`,
      metadata: { checkout_id: sid, project_id: p.id, user_id: u.id, site_type: type },
    });
    await c.env.DB.prepare("UPDATE builder_checkout_sessions SET provider_session_id = ?, status = 'redirected', updated_at = ? WHERE id = ?").bind(session.sessionId, now(), sid).run();
    return c.json({ checkoutUrl: session.checkoutUrl, mode: paymentsMode(c.env) });
  } catch (e) {
    await c.env.DB.prepare("UPDATE builder_checkout_sessions SET status = 'failed', updated_at = ? WHERE id = ?").bind(now(), sid).run();
    console.log("checkout error", (e as Error).message);
    throw new HttpError(502, "The payment provider couldn't start checkout. Please try again shortly.");
  }
});

billing.get("/projects/:id/payments", async (c) => {
  const u = requireUser(c);
  const p = await ownedProject(c, u, c.req.param("id"));
  const [pay, ents, sessions] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT provider, mode, amount_cents, currency, status, created_at FROM payments WHERE project_id = ? ORDER BY created_at DESC").bind(p.id),
    c.env.DB.prepare("SELECT source, status, reason, created_at, revoked_at FROM entitlements WHERE project_id = ? ORDER BY created_at DESC").bind(p.id),
    c.env.DB.prepare("SELECT id, status, mode, created_at FROM builder_checkout_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 10").bind(p.id),
  ]);
  return c.json({ payments: pay.results, entitlements: ents.results, checkouts: sessions.results, price: PLANS[p.site_type].priceCents });
});

// ───── Webhook (Standard Webhooks signature, idempotent by webhook-id) ─────
export const webhooks = new Hono<HonoEnv>();

webhooks.post("/dodo", async (c) => {
  if (!c.env.DODO_WEBHOOK_SECRET || !c.env.DODO_API_KEY) return c.json({ error: "not configured" }, 503);
  const raw = await c.req.text();
  if (raw.length > 256_000) return c.json({ error: "too large" }, 413);
  const headers = { id: c.req.header("webhook-id") ?? null, timestamp: c.req.header("webhook-timestamp") ?? null, signature: c.req.header("webhook-signature") ?? null };
  if (!(await verifyWebhook(c.env.DODO_WEBHOOK_SECRET, headers, raw))) {
    console.log("dodo webhook: bad signature");
    return c.json({ error: "invalid signature" }, 401);
  }
  const eventId = headers.id!;
  let evt: { type?: string; data?: Record<string, any> };
  try { evt = JSON.parse(raw); } catch { return c.json({ error: "bad json" }, 400); }
  const type = String(evt.type || "");
  const ins = await c.env.DB.prepare("INSERT INTO webhook_events (id, provider, event_type, received_at, status, payload_digest) VALUES (?, 'dodo', ?, ?, 'received', ?) ON CONFLICT(id) DO NOTHING")
    .bind(eventId, type.slice(0, 60), now(), await sha256Hex(raw)).run();
  if (!ins.meta.changes) {
    const prev = await c.env.DB.prepare("SELECT status FROM webhook_events WHERE id = ?").bind(eventId).first<{ status: string }>();
    if (prev?.status !== "failed") return c.json({ ok: true, duplicate: true });
  }
  try {
    const result = await processEvent(c.env, type, evt.data ?? {});
    await c.env.DB.prepare("UPDATE webhook_events SET status = ?, processed_at = ?, error = NULL WHERE id = ?").bind(result, now(), eventId).run();
    return c.json({ ok: true, result });
  } catch (e) {
    await c.env.DB.prepare("UPDATE webhook_events SET status = 'failed', error = ? WHERE id = ?").bind(String((e as Error).message).slice(0, 300), eventId).run();
    return c.json({ error: "processing failed" }, 500); // provider retries
  }
});

async function processEvent(env: HonoEnv["Bindings"], type: string, data: Record<string, any>): Promise<"processed" | "ignored"> {
  const paymentId = String(data.payment_id || "");
  if (!paymentId) return "ignored";
  const mode = paymentsMode(env);
  if (type === "payment.succeeded" || type === "payment.failed" || type === "payment.cancelled" || type === "payment.processing") {
    // Never trust the webhook body for money: re-fetch the payment from the provider API.
    const pay = await getPayment(env, paymentId);
    const meta = (pay.metadata ?? {}) as Record<string, string>;
    const sess = await env.DB.prepare("SELECT * FROM builder_checkout_sessions WHERE id = ?").bind(String(meta.checkout_id || "")).first<any>();
    if (!sess || sess.project_id !== meta.project_id || sess.mode !== mode) return "ignored";
    const status = pay.status === "succeeded" ? "succeeded" : pay.status === "failed" ? "failed" : pay.status === "cancelled" ? "cancelled" : "processing";
    const t = now();
    const payRowId = newId("pay");
    await env.DB.prepare(`INSERT INTO payments (id, provider, provider_payment_id, mode, checkout_session_id, project_id, user_id, amount_cents, currency, status, raw_status, created_at, updated_at)
      VALUES (?, 'dodo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(provider, provider_payment_id) DO UPDATE SET status = excluded.status, raw_status = excluded.raw_status, updated_at = excluded.updated_at`)
      .bind(payRowId, paymentId, mode, sess.id, sess.project_id, sess.user_id, pay.total_amount, pay.currency, status, pay.status, t, t).run();
    if (status !== "succeeded") {
      await env.DB.prepare("UPDATE builder_checkout_sessions SET status = 'failed', updated_at = ? WHERE id = ? AND status != 'completed'").bind(t, sess.id).run();
      return "processed";
    }
    const expected = priceFor(sess.site_type);
    // total_amount includes any tax; it must be at least the locked price, in USD.
    if (String(pay.currency).toUpperCase() !== "USD" || Number(pay.total_amount) < expected) {
      await audit(env, null, "billing.amount_mismatch", "payment", paymentId, { expected, got: pay.total_amount, currency: pay.currency });
      return "ignored";
    }
    const payRow = await env.DB.prepare("SELECT id FROM payments WHERE provider = 'dodo' AND provider_payment_id = ?").bind(paymentId).first<{ id: string }>();
    const existing = await env.DB.prepare("SELECT 1 FROM entitlements WHERE payment_id = ?").bind(payRow!.id).first();
    if (!existing) {
      await env.DB.batch([
        env.DB.prepare("INSERT INTO entitlements (id, project_id, user_id, site_type, source, payment_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)")
          .bind(newId("ent"), sess.project_id, sess.user_id, sess.site_type, mode === "live" ? "payment_live" : "payment_test", payRow!.id, t),
        env.DB.prepare("UPDATE builder_checkout_sessions SET status = 'completed', updated_at = ? WHERE id = ?").bind(t, sess.id),
      ]);
      await audit(env, sess.user_id, "billing.entitlement_granted", "project", sess.project_id, { paymentId, mode });
    }
    return "processed";
  }
  if (type === "refund.succeeded") {
    const payRow = await env.DB.prepare("SELECT id, project_id FROM payments WHERE provider = 'dodo' AND provider_payment_id = ?").bind(paymentId).first<{ id: string; project_id: string }>();
    if (!payRow) return "ignored";
    const t = now();
    await env.DB.batch([
      env.DB.prepare("UPDATE payments SET status = 'refunded', updated_at = ? WHERE id = ?").bind(t, payRow.id),
      env.DB.prepare("UPDATE entitlements SET status = 'revoked', revoked_at = ? WHERE payment_id = ? AND status = 'active'").bind(t, payRow.id),
      env.DB.prepare("UPDATE published_sites SET status = 'unpublished' WHERE project_id = ? AND NOT EXISTS (SELECT 1 FROM entitlements WHERE project_id = ? AND status = 'active')").bind(payRow.project_id, payRow.project_id),
      env.DB.prepare("UPDATE projects SET status = 'preview_ready' WHERE id = ? AND NOT EXISTS (SELECT 1 FROM entitlements WHERE project_id = ? AND status = 'active')").bind(payRow.project_id, payRow.project_id),
    ]);
    await audit(env, null, "billing.refunded", "project", payRow.project_id, { paymentId });
    return "processed";
  }
  return "ignored";
}
