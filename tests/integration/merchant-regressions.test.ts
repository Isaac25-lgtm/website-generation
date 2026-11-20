import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";

// Regression tests for merchant defects reproduced in the production audit (docs/production-audit.md):
//  #1 store currency diverges during onboarding, #2 CSV updates delete variants, #3 product edits reverse sales.
const BASE = (process.env.TEST_BASE_URL || "http://localhost:8788").replace(/\/$/, "");
const LOCAL = /localhost|127\.0\.0\.1/.test(BASE);
const run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const old = () => Date.now() - 10_000;

class Client {
  cookie = "";
  async req(path: string, opts: { method?: string; body?: unknown; raw?: boolean } = {}) {
    const headers: Record<string, string> = { "x-requested-with": "test" };
    if (this.cookie) headers.cookie = this.cookie;
    let body: string | undefined;
    if (opts.body !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.body); }
    const init = { method: opts.method ?? (body ? "POST" : "GET"), headers, body, redirect: "manual" as const };
    let res: Response;
    try { res = await fetch(BASE + path, init); } catch { await new Promise((r) => setTimeout(r, 800)); res = await fetch(BASE + path, init); }
    const m = res.headers.get("set-cookie")?.match(/is_session=([^;]*)/);
    if (m) this.cookie = `is_session=${m[1]}`;
    if (opts.raw) return { status: res.status, text: await res.text(), json: {} as any };
    return { status: res.status, json: await res.json().catch(() => ({})), text: "" };
  }
}

function sql(q: string) {
  if (LOCAL) execSync(`npx wrangler d1 execute DB --local --command "${q.replace(/"/g, '\\"')}"`, { stdio: "ignore" });
}

const merchant = new Client();
const admin = new Client();
const shopper = new Client();

const STORE = (currency: string) => ({
  storeName: `Duka ${run}`, currency,
  store: {
    paymentMethods: [{ id: "cod1", kind: "cod", label: "Cash on delivery", instructions: "Pay on delivery." }],
    fulfillment: [{ id: "pick1", kind: "pickup", label: "Pickup", priceMinor: 0, details: "" }],
    returnsPolicy: "Returns within 7 days.", shippingPolicy: "Pickup only.", privacyNote: "Details used for the order only.", prohibitedAck: true, requirePhone: true,
  },
});

async function newStore(name: string, currency: string) {
  const r = await merchant.req("/api/projects", { body: { type: "ecommerce", name: `${name} ${run}` } });
  expect(r.status).toBe(200);
  expect((await merchant.req(`/api/projects/${r.json.id}/intake`, { method: "PUT", body: { step: 1, answers: STORE(currency) } })).status).toBe(200);
  return r.json.id as string;
}

async function publish(id: string) {
  expect((await merchant.req(`/api/projects/${id}/generate`, { body: {} })).status).toBe(200);
  await admin.req(`/api/admin/projects/${id}/entitlement`, { body: { reason: "Merchant regression test" } });
  return merchant.req(`/api/projects/${id}/publish`, { body: { contentRightsAck: true } });
}

beforeAll(async () => {
  sql("DELETE FROM rate_limits");
  for (const [c, who] of [[merchant, "merchant"], [admin, "admin"], [shopper, "shopper"]] as const) {
    expect((await c.req("/api/auth/signup", { body: { name: who, email: `${who}-${run}@test.example`, password: "Sup3r-Secret-Pass", acceptTerms: true } })).status).toBe(200);
  }
  sql(`UPDATE users SET role='admin' WHERE email='admin-${run}@test.example'`);
}, 180_000);

describe("audit #1: the store currency chosen during setup is used everywhere", () => {
  const ids: Record<string, string> = {};
  it("prices manual and CSV products in UGX before the site is generated", async () => {
    ids.store = await newStore("UGX shop", "UGX");
    const prod = await merchant.req(`/api/projects/${ids.store}/products`, { body: { title: "Basket", priceMinor: 10000, variants: [{ stock: 5 }] } });
    expect(prod.status).toBe(200);
    expect(prod.json.product.currency).toBe("UGX");
    ids.product = prod.json.product.id;
    ids.variant = prod.json.product.variants[0].id;
    expect((await merchant.req(`/api/projects/${ids.store}/products`)).json.currency).toBe("UGX");

    const imp = await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows: [{ title: "Mug", price: "25000", sku: `MUG-${run}`, stock: "4" }] } });
    expect(imp.json).toMatchObject({ created: 1, failed: 0 });
    const mug = (await merchant.req(`/api/projects/${ids.store}/products`)).json.products.find((p: any) => p.title === "Mug");
    expect(mug.priceMinor).toBe(25000); // zero-decimal currency: not multiplied by 100
    expect(mug.currency).toBe("UGX");
  });

  it("shows the same UGX price on the product page, the cart quote and the order", async () => {
    const pub = await publish(ids.store);
    expect(pub.status, JSON.stringify(pub.json)).toBe(200);
    const slug = pub.json.url.match(/\/s\/([^/]+)\//)[1];
    const page = await shopper.req(`/s/${slug}/product/basket`, { raw: true });
    expect(page.text).toContain("UGX");
    expect(page.text).toContain("10,000");
    expect(page.text).not.toContain("$100");
    const quote = await shopper.req(`/api/public/store/${ids.store}/quote`, { body: { items: [{ variantId: ids.variant, quantity: 2 }] } });
    expect(quote.json.currency).toBe("UGX");
    expect(quote.json.subtotalMinor).toBe(20000);
    const order = await shopper.req(`/api/public/store/${ids.store}/orders`, { body: {
      items: [{ variantId: ids.variant, quantity: 2 }], fulfillmentId: "pick1", paymentMethodId: "cod1",
      customer: { name: "Test Buyer", phone: "+256700000001", email: "" }, consent: true, idempotencyKey: `cur${run}`, t: old(),
    } });
    expect(order.status, JSON.stringify(order.json)).toBe(200);
    const receipt = await shopper.req(order.json.orderUrl, { raw: true });
    expect(receipt.text).toContain("UGX");
    expect(receipt.text).toContain("20,000");
    const orders = (await merchant.req(`/api/projects/${ids.store}/orders`)).json.orders;
    expect(orders[0]).toMatchObject({ currency: "UGX", total_cents: 20000 });
  });

  it("refuses to publish a store whose products are priced in a different currency", async () => {
    const id = await newStore("Mixed shop", "USD");
    expect((await merchant.req(`/api/projects/${id}/products`, { body: { title: "Lamp", priceMinor: 2500, variants: [{ stock: 1 }] } })).json.product.currency).toBe("USD");
    expect((await merchant.req(`/api/projects/${id}/intake`, { method: "PUT", body: { step: 1, answers: STORE("UGX") } })).status).toBe(200);
    const pub = await publish(id);
    expect(pub.status).toBe(422);
    expect(JSON.stringify(pub.json.problems)).toMatch(/currency/i);
  });

  // keep for the stock test below
  it("exposes ids for the next suite", () => { expect(ids.variant).toBeTruthy(); (globalThis as any).__ugx = ids; });
});

describe("audit #2: re-importing a product by SKU never deletes its variants", () => {
  const ids: Record<string, any> = {};
  it("updates product fields and keeps both variants, their ids, stock and description", async () => {
    ids.store = await newStore("Stationery", "USD");
    const sku = `NB-${run}`;
    const created = await merchant.req(`/api/projects/${ids.store}/products`, { body: {
      title: "Notebook", description: "Dotted pages", priceMinor: 1000, sku, option1Name: "Size",
      variants: [{ option1: "A5", stock: 3 }, { option1: "A4", stock: 4 }],
    } });
    expect(created.status).toBe(200);
    ids.product = created.json.product.id;
    ids.variants = created.json.product.variants.map((v: any) => v.id).sort();

    const imp = await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows: [{ title: "Notebook v2", price: "12", sku }] } });
    expect(imp.json).toMatchObject({ created: 0, updated: 1, failed: 0 });
    const p = (await merchant.req(`/api/projects/${ids.store}/products`)).json.products.find((x: any) => x.id === ids.product);
    expect(p.title).toBe("Notebook v2");
    expect(p.priceMinor).toBe(1200);
    expect(p.description).toBe("Dotted pages");
    expect(p.variants.map((v: any) => v.id).sort()).toEqual(ids.variants);
    expect(Object.fromEntries(p.variants.map((v: any) => [v.option1, v.stock]))).toEqual({ A5: 3, A4: 4 });
  });

  it("re-importing the same file twice is stable", async () => {
    const rows = [{ title: "Notebook v2", price: "12", sku: `NB-${run}` }];
    await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows } });
    const p = (await merchant.req(`/api/projects/${ids.store}/products`)).json.products.find((x: any) => x.id === ids.product);
    expect(p.variants.map((v: any) => v.id).sort()).toEqual(ids.variants);
  });

  it("updates one variant's stock by option value and adds new option values without removing others", async () => {
    const sku = `NB-${run}`;
    expect((await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows: [{ title: "Notebook v2", price: "12", sku, option1: "A4", stock: "9" }] } })).json.failed).toBe(0);
    expect((await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows: [{ title: "Notebook v2", price: "12", sku, option1: "A3", stock: "2" }] } })).json.failed).toBe(0);
    const p = (await merchant.req(`/api/projects/${ids.store}/products`)).json.products.find((x: any) => x.id === ids.product);
    expect(Object.fromEntries(p.variants.map((v: any) => [v.option1, v.stock]))).toEqual({ A5: 3, A4: 9, A3: 2 });
  });

  it("reports a row error instead of guessing which variant a bare stock value belongs to", async () => {
    const imp = await merchant.req(`/api/projects/${ids.store}/products/import`, { body: { rows: [{ title: "Notebook v2", price: "12", sku: `NB-${run}`, stock: "7" }] } });
    expect(imp.json.failed).toBe(1);
    expect(imp.json.errors[0].error).toMatch(/option/i);
  });
});

describe("audit #3: editing a product after a sale keeps the post-sale stock", () => {
  it("applies only the merchant's change to stock, never the stale form value", async () => {
    const ids = (globalThis as any).__ugx as Record<string, string>;
    const before = (await merchant.req(`/api/projects/${ids.store}/products`)).json.products.find((x: any) => x.id === ids.product);
    expect(before.variants[0].stock).toBe(3); // 5 created, 2 sold
    // The merchant opened the edit form before the sale (stock 5) and only changed the title.
    const edit = await merchant.req(`/api/projects/${ids.store}/products/${ids.product}`, { method: "PUT", body: {
      title: "Woven basket", priceMinor: 10000, variants: [{ id: ids.variant, stock: 5, stockBase: 5 }],
    } });
    expect(edit.status, JSON.stringify(edit.json)).toBe(200);
    expect(edit.json.product.variants[0].stock).toBe(3);
    // A deliberate +7 adjustment made from the same stale form applies as a change, not an overwrite.
    const adj = await merchant.req(`/api/projects/${ids.store}/products/${ids.product}`, { method: "PUT", body: {
      title: "Woven basket", priceMinor: 10000, variants: [{ id: ids.variant, stock: 12, stockBase: 5 }],
    } });
    expect(adj.json.product.variants[0].stock).toBe(10);
  });
});
