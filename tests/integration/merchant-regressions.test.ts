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
      title: "Woven basket", priceMinor: 10000, editId: `adj${run}`, variants: [{ id: ids.variant, stock: 12, stockBase: 5 }],
    } });
    expect(adj.json.product.variants[0].stock).toBe(10);
  });
});

// ── Follow-up review cases (reproduced by the reviewer against the first fix) ──

async function order(storeId: string, variantId: string, qty: number, key: string) {
  return shopper.req(`/api/public/store/${storeId}/orders`, { body: {
    items: [{ variantId, quantity: qty }], fulfillmentId: "pick1", paymentMethodId: "cod1",
    customer: { name: "Test Buyer", phone: "+256700000002", email: "" }, consent: true, idempotencyKey: key, t: old(),
  } });
}

describe("review: a live store keeps one currency across catalogue and checkout", () => {
  const ids: Record<string, string> = {};
  it("prices new products in the live currency even after the setup currency changes", async () => {
    ids.store = await newStore("Live USD shop", "USD");
    const first = await merchant.req(`/api/projects/${ids.store}/products`, { body: { title: "Cap", priceMinor: 1500, variants: [{ stock: 4 }] } });
    expect((await publish(ids.store)).status).toBe(200);
    expect((await merchant.req(`/api/projects/${ids.store}/intake`, { method: "PUT", body: { step: 1, answers: STORE("UGX") } })).status).toBe(200);
    expect((await merchant.req(`/api/projects/${ids.store}/products`)).json.currency).toBe("USD");
    // A form that still shows UGX is refused instead of silently charging USD 100.00
    const ugx = await merchant.req(`/api/projects/${ids.store}/products`, { body: { title: "Scarf", currency: "UGX", priceMinor: 10000, variants: [{ stock: 2 }] } });
    expect(ugx.status).toBe(409);
    expect(ugx.json.code).toBe("currency_mismatch");
    const usd = await merchant.req(`/api/projects/${ids.store}/products`, { body: { title: "Scarf", currency: "USD", priceMinor: 2500, variants: [{ stock: 2 }] } });
    expect(usd.json.product.currency).toBe("USD");
    const quote = await shopper.req(`/api/public/store/${ids.store}/quote`, { body: { items: [{ variantId: usd.json.product.variants[0].id, quantity: 1 }] } });
    expect(quote.json).toMatchObject({ currency: "USD", subtotalMinor: 2500 });
    ids.cap = first.json.product.id;
    ids.capVariant = first.json.product.variants[0].id;
  });

  it("never quotes, sells or lists a product priced in another currency", async () => {
    sql(`UPDATE products SET currency='UGX', price_cents=10000 WHERE id='${ids.cap}'`); // e.g. data written before this fix
    const quote = await shopper.req(`/api/public/store/${ids.store}/quote`, { body: { items: [{ variantId: ids.capVariant, quantity: 1 }] } });
    expect(quote.json.subtotalMinor).toBe(0);
    expect(quote.json.lines[0]).toMatchObject({ missing: true, quantity: 0 });
    const o = await order(ids.store, ids.capVariant, 1, `mix${run}`);
    expect(o.status).toBe(409);
    const slug = (await merchant.req(`/api/projects/${ids.store}`)).json.project.slug;
    const shop = await shopper.req(`/s/${slug}/shop`, { raw: true });
    expect(shop.text).toContain("Scarf");
    expect(shop.text).not.toContain(">Cap<");
  });
});

describe("review: retrying the same stock edit applies it once", () => {
  it("dedupes a replayed save, keeps sales made in between and applies later changes in the same edit", async () => {
    const id = await newStore("Retry shop", "USD");
    const prod = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Ball", priceMinor: 900, variants: [{ stock: 5 }] } });
    const pid = prod.json.product.id, vid = prod.json.product.variants[0].id;
    expect((await publish(id)).status).toBe(200);
    const save = (stock: number) => merchant.req(`/api/projects/${id}/products/${pid}`, { method: "PUT", body: { title: "Ball", priceMinor: 900, editId: `retry${run}`, variants: [{ id: vid, stock, stockBase: 5 }] } });
    expect((await save(7)).json.product.variants[0].stock).toBe(7);
    expect((await save(7)).json.product.variants[0].stock).toBe(7); // retry after a lost response
    expect((await order(id, vid, 1, `ret${run}`)).status).toBe(200); // a sale: 6
    expect((await save(7)).json.product.variants[0].stock).toBe(6); // another retry keeps the sale
    expect((await save(9)).json.product.variants[0].stock).toBe(8); // same form, 7 → 9 adds only 2
    const noId = await merchant.req(`/api/projects/${id}/products/${pid}`, { method: "PUT", body: { title: "Ball", priceMinor: 900, variants: [{ id: vid, stock: 20, stockBase: 8 }] } });
    expect(noId.status).toBe(400);
    expect(noId.json.code).toBe("edit_id_required");
  });
});

describe("review: CSV rows must identify exactly one variant", () => {
  it("rejects an option value shared by several variants before changing stock", async () => {
    const id = await newStore("Shirts", "USD");
    const sku = `SH-${run}`;
    const created = await merchant.req(`/api/projects/${id}/products`, { body: {
      title: "Shirt", priceMinor: 2000, sku, option1Name: "Size", option2Name: "Colour",
      variants: [{ option1: "Medium", option2: "Red", stock: 2 }, { option1: "Medium", option2: "Blue", stock: 3 }],
    } });
    expect(created.status).toBe(200);
    const stocks = async () => Object.fromEntries((await merchant.req(`/api/projects/${id}/products`)).json.products[0].variants.map((v: any) => [`${v.option1}/${v.option2}`, v.stock]));
    const amb = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Shirt", price: "20", sku, option1: "Medium", stock: "9" }] } });
    expect(amb.json.failed).toBe(1);
    expect(amb.json.errors[0].error).toMatch(/Several variants/);
    expect(await stocks()).toEqual({ "Medium/Red": 2, "Medium/Blue": 3 });
    const one = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Shirt", price: "20", sku, option1: "Medium", option2: "Blue", stock: "9" }] } });
    expect(one.json.failed).toBe(0);
    expect(await stocks()).toEqual({ "Medium/Red": 2, "Medium/Blue": 9 });
    const missing2 = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Shirt", price: "20", sku, option1: "Large", stock: "1" }] } });
    expect(missing2.json.failed).toBe(1);
    expect(missing2.json.errors[0].error).toMatch(/two options/);
    expect(Object.keys(await stocks())).toHaveLength(2);
  });
});

// ── Release audit 6a1cc2c (docs/release-audit-6a1cc2c.md) ──

describe("audit 6a1cc2c: replaying a save never undoes a sale", () => {
  it("keeps a variant created in the edit, its id, the post-sale stock and the order reference", async () => {
    const id = await newStore("Scarves", "USD");
    const made = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Scarf", priceMinor: 1500, option1Name: "Colour", variants: [{ option1: "Blue", stock: 3 }] } });
    const pid = made.json.product.id, blue = made.json.product.variants[0].id;
    expect((await publish(id)).status).toBe(200);
    const save = () => merchant.req(`/api/projects/${id}/products/${pid}`, { method: "PUT", body: { title: "Scarf", priceMinor: 1500, option1Name: "Colour", editId: `green${run}`,
      variants: [{ id: blue, option1: "Blue", stock: 3, stockBase: 3 }, { option1: "Green", stock: 7 }] } });
    const first = await save();
    const green = first.json.product.variants.find((v: any) => v.option1 === "Green");
    expect(green.stock).toBe(7);
    const o = await order(id, green.id, 2, `grn${run}`);
    expect(o.status).toBe(200);
    const replay = await save(); // the identical request again, e.g. after a lost response
    const after = Object.fromEntries(replay.json.product.variants.map((v: any) => [v.option1, v]));
    expect(after.Green.id).toBe(green.id);
    expect(after.Green.stock).toBe(5);
    expect(after.Blue.stock).toBe(3);
    // Cancelling the order restocks that same variant
    const oid = o.json.orderUrl.match(/order\/(ord_[a-z0-9]+)/)[1];
    expect((await merchant.req(`/api/projects/${id}/orders/${oid}`, { method: "PATCH", body: { status: "cancelled" } })).status).toBe(200);
    const final = (await merchant.req(`/api/projects/${id}/products`)).json.products.find((x: any) => x.id === pid);
    expect(final.variants.find((v: any) => v.id === green.id).stock).toBe(7);
  });

  it("treats a replayed product create as the same product", async () => {
    const id = await newStore("Replay create", "USD");
    const body = { title: "Mug", priceMinor: 900, editId: `mug${run}`, variants: [{ stock: 4 }] };
    const a = await merchant.req(`/api/projects/${id}/products`, { body });
    const b = await merchant.req(`/api/projects/${id}/products`, { body });
    expect(b.json.product.id).toBe(a.json.product.id);
    expect(b.json.product.variants[0].id).toBe(a.json.product.variants[0].id);
    expect(b.json.product.variants[0].stock).toBe(4);
    expect((await merchant.req(`/api/projects/${id}/products`)).json.products).toHaveLength(1);
  });
});

describe("audit 6a1cc2c: CSV prices are parsed strictly", () => {
  it("reads 19,95 as €19.95 and rejects ambiguous or invalid prices", async () => {
    const id = await newStore("Euro shop", "EUR");
    const imp = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [
      { title: "Comma", price: "19,95", compareAt: "24,95" },
      { title: "Grouped", price: "1.234,50" },
      { title: "Ambiguous", price: "1,234" },
      { title: "Words", price: "nineteen" },
    ] } });
    expect(imp.json).toMatchObject({ created: 2, failed: 2 });
    const errs = imp.json.errors.map((e: any) => e.error).join(" | ");
    expect(errs).toMatch(/ambiguous/);
    expect(errs).toMatch(/isn't a valid price/);
    const prices = Object.fromEntries((await merchant.req(`/api/projects/${id}/products`)).json.products.map((p: any) => [p.title, [p.priceMinor, p.compareAtMinor]]));
    expect(prices).toEqual({ Comma: [1995, 2495], Grouped: [123450, null] });
  });
});

describe("audit 6a1cc2c: a variant SKU row changes only that variant", () => {
  it("prices Red alone and leaves Blue's inherited price untouched", async () => {
    const id = await newStore("Colours", "EUR");
    const made = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Tee", priceMinor: 1000, option1Name: "Colour",
      variants: [{ option1: "Red", sku: `RED-${run}`, priceMinor: 1100, stock: 5 }, { option1: "Blue", sku: `BLUE-${run}`, stock: 5 }] } });
    expect(made.status).toBe(200);
    const v = Object.fromEntries(made.json.product.variants.map((x: any) => [x.option1, x.id]));
    expect((await publish(id)).status).toBe(200);
    const imp = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Tee", price: "22", sku: `RED-${run}` }] } });
    expect(imp.json).toMatchObject({ updated: 1, failed: 0 });
    const quote = await shopper.req(`/api/public/store/${id}/quote`, { body: { items: [{ variantId: v.Red, quantity: 1 }, { variantId: v.Blue, quantity: 1 }] } });
    const unit = Object.fromEntries(quote.json.lines.map((l: any) => [l.variantId, l.unitMinor]));
    expect(unit[v.Red]).toBe(2200);
    expect(unit[v.Blue]).toBe(1000);
    const cmp = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Tee", price: "22", compareAt: "30", sku: `RED-${run}` }] } });
    expect(cmp.json.failed).toBe(1);
    expect(cmp.json.errors[0].error).toMatch(/whole product/);
  });
});

describe("audit 6a1cc2c: SKUs identify exactly one variant", () => {
  it("refuses duplicate variant SKUs and import rows that match more than one target", async () => {
    const id = await newStore("Dupes", "USD");
    const dup = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Cap", priceMinor: 900, option1Name: "Colour",
      variants: [{ option1: "Black", sku: `CAP-${run}`, stock: 2 }, { option1: "White", sku: `CAP-${run}`, stock: 4 }] } });
    expect(dup.status).toBe(409);
    expect(dup.json.code).toBe("duplicate_sku");
    const one = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Cap", priceMinor: 900, option1Name: "Colour",
      variants: [{ option1: "Black", sku: `CAPB-${run}`, stock: 2 }, { option1: "White", sku: `CAPW-${run}`, stock: 4 }] } });
    expect(one.status).toBe(200);
    const other = await merchant.req(`/api/projects/${id}/products`, { body: { title: "Visor", priceMinor: 700, variants: [{ sku: `CAPB-${run}`, stock: 1 }] } });
    expect(other.status).toBe(409);
    // A product SKU equal to another product's variant SKU is ambiguous for imports: reject the row, change nothing.
    expect((await merchant.req(`/api/projects/${id}/products`, { body: { title: "Bag", priceMinor: 2000, sku: `CAPW-${run}`, variants: [{ stock: 1 }] } })).status).toBe(200);
    const imp = await merchant.req(`/api/projects/${id}/products/import`, { body: { rows: [{ title: "Cap", price: "9", sku: `CAPW-${run}`, stock: "9" }] } });
    expect(imp.json.failed).toBe(1);
    expect(imp.json.errors[0].error).toMatch(/different product/);
    const cap = (await merchant.req(`/api/projects/${id}/products`)).json.products.find((p: any) => p.title === "Cap");
    expect(Object.fromEntries(cap.variants.map((x: any) => [x.option1, x.stock]))).toEqual({ Black: 2, White: 4 });
  });
});
