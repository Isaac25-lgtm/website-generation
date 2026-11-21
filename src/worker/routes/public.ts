import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv, Ctx, HonoEnv } from "../env";
import { HttpError, baseUrl, now } from "../env";
import { enforceRate, ipHash } from "../lib/auth";
import { newId, sha256Hex, timingSafeEqual } from "../lib/crypto";
import { orderToken } from "../lib/site";
import { emailConfigured, sendEmail } from "../lib/email";
import { parseSiteDoc, type SiteDoc } from "../../shared/schema";
import { formatMoney } from "../../shared/util";

export const publicApi = new Hono<HonoEnv>();

// Public endpoints may be called from exported static sites on other origins (no cookies involved).
publicApi.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type, x-requested-with", "access-control-max-age": "86400" } });
  }
  await next();
  c.res.headers.set("access-control-allow-origin", "*");
});

interface LiveSite { projectId: string; slug: string; doc: SiteDoc; isDemo: boolean; ownerEmail: string }

async function liveSite(env: AppEnv, projectId: string): Promise<LiveSite> {
  if (!/^prj_[a-z0-9]{10,30}$/.test(projectId)) throw new HttpError(404, "Site not found.");
  const r = await env.DB.prepare(
    `SELECT p.id, p.slug, p.is_demo, sv.doc_json, u.email FROM published_sites ps
       JOIN projects p ON p.id = ps.project_id JOIN site_versions sv ON sv.id = ps.current_version_id JOIN users u ON u.id = p.owner_id
      WHERE ps.project_id = ? AND ps.status = 'live' AND p.deleted_at IS NULL AND p.status != 'suspended'`,
  ).bind(projectId).first<{ id: string; slug: string; is_demo: number; doc_json: string; email: string }>();
  if (!r) throw new HttpError(404, "This site isn't published.");
  const parsed = parseSiteDoc(JSON.parse(r.doc_json));
  if (!parsed.ok) throw new HttpError(500, "Site data error.");
  return { projectId: r.id, slug: r.slug, doc: parsed.doc, isDemo: !!r.is_demo, ownerEmail: r.email };
}

function botCheck(hp: unknown, t: unknown, elapsed?: unknown) {
  if (typeof hp === "string" && hp.trim()) throw new HttpError(400, "Submission rejected.", "spam");
  // Prefer client-measured elapsed time (immune to clock skew); fall back to a server-issued render timestamp.
  const el = Number(elapsed);
  if (elapsed !== undefined && Number.isFinite(el)) {
    if (el < 2500) throw new HttpError(400, "That was quick! Please wait a moment and submit again.", "too_fast");
    return;
  }
  const ts = Number(t);
  if (Number.isFinite(ts) && ts > 0 && now() - ts < 2500) throw new HttpError(400, "That was quick! Please wait a moment and submit again.", "too_fast");
}

const optEmail = z.string().trim().max(200).optional().transform((v) => v || "").refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Enter a valid email address.");

publicApi.post("/sites/:pid/leads", async (c) => {
  const site = await liveSite(c.env, c.req.param("pid"));
  const raw = await c.req.json().catch(() => ({}));
  botCheck(raw.website, raw.t);
  const ip = await ipHash(c);
  await enforceRate(c.env, `lead:${ip}`, 8, 600, "Too many messages. Please try again in a few minutes.");
  await enforceRate(c.env, `lead-site:${site.projectId}`, 300, 86400, "This site has received many messages today. Please try again tomorrow.");
  const base = z.object({ kind: z.enum(["contact", "quote"]), name: z.string().trim().min(1, "Please enter your name.").max(80), email: optEmail, phone: z.string().trim().max(40).optional().default(""), consent: z.literal("on", { message: "Please tick the consent box." }), page: z.string().max(200).optional() });
  const b = base.safeParse(raw);
  if (!b.success) throw new HttpError(400, b.error.issues[0]?.message || "Please check the form.");
  if (!b.data.email && !b.data.phone) throw new HttpError(400, "Please give an email address or phone number so we can reply.");
  const t = now();
  if (b.data.kind === "quote") {
    const q = z.object({ service: z.string().max(80).optional().default(""), budget: z.string().max(60).optional().default(""), timeline: z.string().max(60).optional().default(""), details: z.string().trim().min(5, "Please describe what you need.").max(4000) }).safeParse(raw);
    if (!q.success) throw new HttpError(400, q.error.issues[0]?.message || "Please check the form.");
    await c.env.DB.prepare("INSERT INTO quote_requests (id, project_id, name, email, phone, service, budget, timeline, details, ip_hash, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .bind(newId("quo"), site.projectId, b.data.name, b.data.email, b.data.phone, q.data.service, q.data.budget, q.data.timeline, q.data.details, ip, t).run();
  } else {
    const m = z.object({ message: z.string().trim().min(2, "Please write a message.").max(4000) }).safeParse(raw);
    if (!m.success) throw new HttpError(400, m.error.issues[0]?.message || "Please write a message.");
    await c.env.DB.prepare("INSERT INTO contact_leads (id, project_id, name, email, phone, message, page, ip_hash, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(newId("led"), site.projectId, b.data.name, b.data.email, b.data.phone, m.data.message, b.data.page ?? null, ip, t).run();
  }
  if (emailConfigured(c.env) && !site.isDemo) {
    c.executionCtx.waitUntil(sendEmail(c.env, { to: site.ownerEmail, subject: `New ${b.data.kind === "quote" ? "quote request" : "message"} from your website`, text: `${b.data.name} sent a ${b.data.kind} via ${site.doc.brand.name}.\nView it in your dashboard: ${baseUrl(c)}/dashboard` }));
  }
  return c.json({ ok: true, message: site.isDemo ? "Thanks! (This is a demo site: your message was recorded for demonstration only.)" : "Thank you, your message has been sent." });
});

// ───── Storefront ─────
const Items = z.array(z.object({ variantId: z.string().regex(/^var_[a-z0-9]+$/), quantity: z.number().int().min(0).max(999) })).max(50);

async function priceItems(env: AppEnv, site: LiveSite, items: z.infer<typeof Items>) {
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.variantId, Math.min(999, (merged.get(i.variantId) ?? 0) + i.quantity));
  const ids = [...merged.keys()];
  if (!ids.length) return { lines: [], subtotal: 0 };
  const rows = await env.DB.prepare(
    `SELECT v.id, v.title AS vtitle, v.price_cents AS vprice, v.stock, v.track_inventory, v.allow_backorder, v.sku AS vsku,
            p.id AS pid, p.title, p.handle, p.price_cents, p.images_json, p.max_per_order, p.status, p.sku, p.currency
       FROM product_variants v JOIN products p ON p.id = v.product_id
      WHERE v.project_id = ? AND v.id IN (${ids.map(() => "?").join(",")})`,
  ).bind(site.projectId, ...ids).all<any>();
  const lines = ids.map((id) => {
    const r = rows.results.find((x) => x.id === id);
    const want = merged.get(id)!;
    if (!r || r.status !== "active") return { variantId: id, missing: true, quantity: 0, title: "Item no longer available", note: "This item was removed from the store." };
    // A price in another currency is never charged as the store currency (audit #1 follow-up).
    if (r.currency !== site.doc.store?.currency) return { variantId: id, missing: true, requested: want, quantity: 0, lineMinor: 0, title: r.title, note: "Price unavailable while the seller updates this item" };
    const unit = r.vprice ?? r.price_cents;
    const cap = r.track_inventory && !r.allow_backorder ? Math.max(0, Math.min(r.max_per_order, r.stock)) : r.max_per_order;
    const qty = Math.min(want, cap);
    let img = "";
    try { const a = JSON.parse(r.images_json || "[]")[0]; if (a?.assetId) img = `/media/${a.assetId}`; } catch { /* none */ }
    return {
      variantId: id, productId: r.pid, title: r.title, variantTitle: r.vtitle !== "Default" ? r.vtitle : "", sku: r.vsku || r.sku,
      unitMinor: unit, quantity: qty, requested: want, lineMinor: unit * qty, maxQty: cap, image: img, url: `/s/${site.slug}/product/${r.handle}`,
      note: qty < want ? (cap === 0 ? "Sold out" : `Only ${cap} available`) : "",
    };
  });
  return { lines, subtotal: lines.reduce((a, l: any) => a + (l.lineMinor || 0), 0) };
}

publicApi.post("/store/:pid/quote", async (c) => {
  const site = await liveSite(c.env, c.req.param("pid"));
  if (site.doc.type !== "ecommerce") throw new HttpError(404, "Not a store.");
  await enforceRate(c.env, `quote:${await ipHash(c)}`, 120, 600);
  const body = z.object({ items: Items }).safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw new HttpError(400, "Invalid cart.");
  const { lines, subtotal } = await priceItems(c.env, site, body.data.items);
  return c.json({ currency: site.doc.store!.currency, lines: lines.filter((l: any) => !l.missing || l.requested), subtotalMinor: subtotal });
});

const OrderBody = z.object({
  items: Items.min(1, "Your cart is empty."),
  fulfillmentId: z.string().max(40), paymentMethodId: z.string().max(40),
  customer: z.object({ name: z.string().trim().min(2, "Please enter your full name.").max(80), email: optEmail, phone: z.string().trim().max(40).default("") }),
  address: z.object({ line1: z.string().trim().max(200).default(""), city: z.string().trim().max(80).default(""), region: z.string().trim().max(80).default(""), country: z.string().trim().max(80).default(""), notes: z.string().trim().max(500).default("") }).default({ line1: "", city: "", region: "", country: "", notes: "" }),
  notes: z.string().trim().max(1000).default(""),
  consent: z.literal(true, { message: "Please agree to the use of your details for this order." }),
  idempotencyKey: z.string().regex(/^[a-z0-9]{8,64}$/),
  /** The total the shopper was shown. If prices or fees changed since, the order is not placed (409 price_changed). */
  expectedTotalMinor: z.number().int().min(0).optional(),
  hp: z.string().optional(), t: z.number().optional(),
});

publicApi.post("/store/:pid/orders", async (c) => {
  const site = await liveSite(c.env, c.req.param("pid"));
  const st = site.doc.store;
  if (site.doc.type !== "ecommerce" || !st || !st.paymentMethods.length || !st.fulfillment.length) throw new HttpError(400, "This store isn't accepting orders yet.");
  const raw = await c.req.json().catch(() => ({}));
  botCheck(raw.hp, raw.t);
  const ip = await ipHash(c);
  await enforceRate(c.env, `order:${ip}`, 10, 600, "Too many orders from your connection. Please wait a few minutes.");
  await enforceRate(c.env, `order-site:${site.projectId}`, 1000, 86400);
  const parsed = OrderBody.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message || "Please check your details.");
  const b = parsed.data;
  const fulfil = st.fulfillment.find((f) => f.id === b.fulfillmentId);
  const pay = st.paymentMethods.find((m) => m.id === b.paymentMethodId);
  if (!fulfil) throw new HttpError(400, "Choose a delivery or pickup option.");
  if (!pay) throw new HttpError(400, "Choose a payment method.");
  if (st.requirePhone && b.customer.phone.replace(/[^0-9]/g, "").length < 7) throw new HttpError(400, "Please enter a valid phone number.");
  if (st.requireEmail && !b.customer.email) throw new HttpError(400, "Please enter your email address.");
  if (!b.customer.phone && !b.customer.email) throw new HttpError(400, "Please give a phone number or email so the seller can contact you.");
  if (fulfil.kind === "delivery" && (!b.address.line1 || !b.address.city)) throw new HttpError(400, "Please enter your delivery address and town.");

  const existing = await c.env.DB.prepare("SELECT id FROM orders WHERE project_id = ? AND idempotency_key = ?").bind(site.projectId, b.idempotencyKey).first<{ id: string }>();
  if (existing) return c.json({ ok: true, orderUrl: `/s/${site.slug}/order/${existing.id}?k=${await orderToken(c.env, existing.id)}`, duplicate: true });

  const { lines, subtotal } = await priceItems(c.env, site, b.items.filter((i) => i.quantity > 0));
  const problems = (lines as any[]).filter((l) => l.missing || l.quantity < l.requested);
  if (problems.length) throw new HttpError(409, `Some items changed: ${problems.map((l) => `${l.title} (${l.note || "unavailable"})`).join(", ")}. Please review your cart.`, "stock_changed");
  if (!lines.length) throw new HttpError(400, "Your cart is empty.");
  const shipping = fulfil.priceMinor;
  const total = subtotal + shipping;
  if (b.expectedTotalMinor !== undefined && b.expectedTotalMinor !== total) {
    // Never charge a total the shopper didn't see: return the revised quote and place nothing.
    return c.json({ error: "Prices changed since you opened checkout. Please check the new total and place your order again.", code: "price_changed",
      quote: { currency: st.currency, lines, subtotalMinor: subtotal, shippingMinor: shipping, totalMinor: total } }, 409);
  }
  const id = newId("ord");
  const token = await orderToken(c.env, id);
  const t = now();
  const contactId = newId("cus");
  const stmts: D1PreparedStatement[] = [
    c.env.DB.prepare("INSERT INTO customer_contacts (id, project_id, name, email, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(contactId, site.projectId, b.customer.name, b.customer.email || null, b.customer.phone || null, t),
    c.env.DB.prepare(`INSERT INTO orders (id, project_id, number, status, payment_status, payment_method, fulfillment_method, fulfillment_label, customer_contact_id, customer_name, customer_email, customer_phone, address_json, notes, currency, subtotal_cents, shipping_cents, total_cents, access_token_hash, is_demo, idempotency_key, created_at, updated_at)
      SELECT ?, ?, COALESCE(MAX(number), 1000) + 1, 'pending', 'unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM orders WHERE project_id = ?`)
      .bind(id, site.projectId, pay.kind, fulfil.kind, fulfil.label, contactId, b.customer.name, b.customer.email || null, b.customer.phone || null,
        fulfil.kind === "delivery" ? JSON.stringify(b.address) : null, b.notes || null, st.currency, subtotal, shipping, total, await sha256Hex(token), site.isDemo ? 1 : 0, b.idempotencyKey, t, t, site.projectId),
    c.env.DB.prepare("INSERT INTO order_status_history (id, order_id, to_status, payment_status, note, actor, created_at) VALUES (?, ?, 'pending', 'unpaid', 'Order placed by customer', 'customer', ?)").bind(newId("osh"), id, t),
    c.env.DB.prepare("INSERT INTO consents (id, project_id, kind, version, created_at) VALUES (?, ?, 'checkout_data', ?, ?)").bind(newId("cns"), site.projectId, id, t),
  ];
  for (const l of lines as any[]) {
    stmts.push(c.env.DB.prepare("INSERT INTO order_items (id, order_id, product_id, variant_id, title, variant_title, sku, unit_price_cents, quantity, line_total_cents) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .bind(newId("oit"), id, l.productId, l.variantId, l.title, l.variantTitle || null, l.sku || null, l.unitMinor, l.quantity, l.lineMinor));
    if (!site.isDemo) {
      // Atomic stock decrement: the oversell trigger aborts the whole batch if stock would go negative.
      stmts.push(c.env.DB.prepare("UPDATE product_variants SET stock = stock - ? WHERE id = ? AND project_id = ? AND track_inventory = 1").bind(l.quantity, l.variantId, site.projectId));
      // Record the debit only if stock was really taken (tracked variants), so cancellation gives back the same amount.
      stmts.push(c.env.DB.prepare("INSERT INTO inventory_movements (id, project_id, variant_id, delta, reason, order_id, actor, created_at) SELECT ?, ?, ?, ?, 'order', ?, 'customer', ? WHERE changes() = 1").bind(newId("inv"), site.projectId, l.variantId, -l.quantity, id, t));
    }
  }
  try { await c.env.DB.batch(stmts); }
  catch (e) {
    const m = String((e as Error).message);
    if (m.includes("OUT_OF_STOCK")) throw new HttpError(409, "Sorry, an item in your cart just sold out. Please review your cart.", "out_of_stock");
    if (m.includes("UNIQUE") && m.includes("idempotency")) {
      // A concurrent retry won the race: return the receipt link for the order that was actually created.
      const won = await c.env.DB.prepare("SELECT id FROM orders WHERE project_id = ? AND idempotency_key = ?").bind(site.projectId, b.idempotencyKey).first<{ id: string }>();
      if (won) return c.json({ ok: true, orderUrl: `/s/${site.slug}/order/${won.id}?k=${await orderToken(c.env, won.id)}`, duplicate: true });
    }
    throw e;
  }
  const notify = st.notifyEmail || site.ownerEmail;
  if (emailConfigured(c.env) && !site.isDemo) {
    c.executionCtx.waitUntil(sendEmail(c.env, { to: notify, subject: `New order on ${site.doc.brand.name}: ${formatMoney(total, st.currency)}`, text: `You have a new order from ${b.customer.name} (${formatMoney(total, st.currency)}, ${pay.label}, ${fulfil.label}).\nManage it in your dashboard: ${baseUrl(c)}/dashboard` }));
    if (b.customer.email) c.executionCtx.waitUntil(sendEmail(c.env, { to: b.customer.email, subject: `Your order from ${site.doc.brand.name}`, text: `Thank you for your order (${formatMoney(total, st.currency)}).\nView its status: ${baseUrl(c)}/s/${site.slug}/order/${id}?k=${token}` }));
  }
  return c.json({ ok: true, orderUrl: `/s/${site.slug}/order/${id}?k=${token}` });
});

// ───── Platform support & reports (the ImprintSites contact form) ─────
export const support = new Hono<HonoEnv>();

support.post("/", async (c) => {
  const raw = await c.req.json().catch(() => ({}));
  botCheck(raw.website, undefined, raw.elapsed);
  const ip = await ipHash(c);
  await enforceRate(c.env, `support:${ip}`, 6, 3600, "You've sent several messages. Please wait before sending more.");
  const b = z.object({
    category: z.enum(["general", "sales", "billing", "technical", "ip_report", "abuse_report", "privacy"]).default("general"),
    name: z.string().trim().min(1, "Please enter your name.").max(80),
    email: z.string().trim().email("Please enter a valid email so we can reply.").max(200),
    subject: z.string().trim().min(2, "Please add a subject.").max(160),
    message: z.string().trim().min(10, "Please write at least a sentence.").max(5000),
    referenceUrl: z.string().trim().max(600).optional().default(""),
  }).safeParse(raw);
  if (!b.success) throw new HttpError(400, b.error.issues[0]?.message || "Please check the form.");
  const t = now();
  const id = newId("tkt");
  await c.env.DB.prepare("INSERT INTO support_tickets (id, user_id, category, name, email, subject, message, reference_url, ip_hash, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, c.get("user")?.id ?? null, b.data.category, b.data.name, b.data.email, b.data.subject, b.data.message, b.data.referenceUrl || null, ip, t, t).run();
  const admins = (c.env.ADMIN_EMAILS || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (emailConfigured(c.env) && admins[0]) c.executionCtx.waitUntil(sendEmail(c.env, { to: admins[0], subject: `[Support] ${b.data.subject}`, text: `New ${b.data.category} ticket ${id} from ${b.data.name}. Open the admin dashboard to reply.` }));
  return c.json({ ok: true, reference: id.slice(-8).toUpperCase(), message: "Thanks, your message has been received. We aim to reply within 2 business days." });
});

export async function routeOrderView(env: AppEnv, projectId: string, orderId: string, token: string | undefined) {
  if (!token || !/^ord_[a-z0-9]+$/.test(orderId)) return null;
  const o = await env.DB.prepare("SELECT * FROM orders WHERE id = ? AND project_id = ?").bind(orderId, projectId).first<any>();
  if (!o) return null;
  const expected = await orderToken(env, o.id);
  if (!timingSafeEqual(token, expected)) return null;
  const items = await env.DB.prepare("SELECT title, variant_title, quantity, unit_price_cents, line_total_cents FROM order_items WHERE order_id = ?").bind(o.id).all<any>();
  return {
    id: o.id, number: o.number, status: o.status, paymentStatus: o.payment_status, paymentMethod: o.payment_method, fulfillmentMethod: o.fulfillment_method,
    fulfillmentLabel: o.fulfillment_label, customerName: o.customer_name, currency: o.currency, subtotalMinor: o.subtotal_cents, shippingMinor: o.shipping_cents,
    totalMinor: o.total_cents, createdAt: o.created_at, isDemo: !!o.is_demo,
    items: items.results.map((i) => ({ title: i.title, variantTitle: i.variant_title, quantity: i.quantity, unitMinor: i.unit_price_cents, lineMinor: i.line_total_cents })),
  };
}

export type { Ctx };
