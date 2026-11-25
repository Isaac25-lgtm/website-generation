// Production smoke test. Usage: node scripts/smoke-prod.mjs https://<your-worker>.workers.dev
// Creates a temporary account + project, exercises the real bindings, then deletes the project.
const BASE = (process.argv[2] || "").replace(/\/$/, "");
if (!BASE.startsWith("https://")) { console.error("Pass the https:// production URL"); process.exit(1); }
const run = Date.now().toString(36);
let cookie = "";
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`); };

/** fetch with retries: reads retry on any network error; writes only when the connection never opened (not sent). */
async function send(url, init) {
  const write = init.method && !["GET", "HEAD"].includes(init.method);
  for (let attempt = 0; ; attempt++) {
    try { return await fetch(url, init); }
    catch (e) {
      const notSent = e?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" || e?.cause?.code === "ECONNREFUSED" || e?.cause?.code === "ENOTFOUND" || e?.cause?.code === "EAI_AGAIN";
      if (attempt < 3 && (!write || notSent)) { await new Promise((r) => setTimeout(r, 2000)); continue; }
      throw e;
    }
  }
}

async function req(path, { method, body, form, raw } = {}) {
  const headers = { "x-requested-with": "smoke" };
  if (cookie) headers.cookie = cookie;
  let b;
  if (form) b = form; else if (body !== undefined) { headers["content-type"] = "application/json"; b = JSON.stringify(body); }
  const t0 = Date.now();
  const init = { method: method ?? (b ? "POST" : "GET"), headers, body: b, redirect: "manual" };
  const res = await send(BASE + path, init);
  const sc = res.headers.get("set-cookie"); const m = sc?.match(/is_session=([^;]*)/); if (m) cookie = `is_session=${m[1]}`;
  const ms = Date.now() - t0;
  if (raw) return { status: res.status, text: await res.text(), res, ms };
  return { status: res.status, json: await res.json().catch(() => ({})), res, ms };
}

const old = () => Date.now() - 10_000;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

const home = await req("/", { raw: true });
check("HTTPS homepage", home.status === 200 && home.text.includes("ImprintSites AI"), `${home.status} ${home.ms}ms`);
const asset = home.text.match(/\/assets\/index-[^"]+\.js/)?.[0];
const a = await req(asset, { raw: true });
check("JS bundle served", a.status === 200 && a.res.headers.get("content-type")?.includes("javascript"), asset);
for (const p of ["/pricing", "/templates", "/examples", "/how-it-works", "/contact", "/terms", "/privacy", "/refunds", "/login", "/signup", "/dashboard"]) {
  const r = await req(p, { raw: true }); check(`route ${p}`, r.status === 200, `${r.status}`);
}
const cfg = (await req("/api/config")).json;
check("prices 20/25/100 USD", JSON.stringify(cfg.prices?.map((p) => p.priceCents)) === "[2000,2500,10000]");
check("bindings reported", cfg.ai?.available === true && cfg.browserRun?.bound === true, `ai=${cfg.ai?.available} browser=${cfg.browserRun?.bound} storage=${cfg.storage} payments=${cfg.payments?.configured} google=${cfg.google?.enabled}`);
const tpl = (await req("/api/templates")).json;
check("templates listed, Signature first-class, member ones locked", tpl.templates?.length >= 43 && tpl.templates.filter((t) => t.rank === "signature").length >= 25 && tpl.templates.filter((t) => t.locked).length === tpl.templates.filter((t) => t.tier === "member").length);
for (const s of ["demo-portfolio", "demo-business", "demo-store"]) {
  const r = await req(`/s/${s}/`, { raw: true });
  check(`demo /s/${s}/`, r.status === 200 && r.text.includes("Demonstration site"), `${r.status} ${r.ms}ms`);
}
const shop = await req("/s/demo-store/shop?q=dress", { raw: true });
check("demo store search", shop.text.includes("Floral wrap dress"));
check("robots + sitemap", (await req("/robots.txt", { raw: true })).status === 200 && (await req("/sitemap.xml", { raw: true })).text.includes("/s/demo-store/"));
check("health", (await req("/healthz")).json.ok === true);

// Authenticated flow. Every synthetic record is tracked by exact id; cleanup runs even if a step throws.
const created = { run, email: `smoke-${run}@smoke.invalid`, projectId: null, orderId: null };
try {
const su = await req("/api/auth/signup", { body: { name: "Smoke Test", email: created.email, password: "Smoke-Test-Pass-123", acceptTerms: true } });
check("signup", su.status === 200, `${su.status} ${su.ms}ms (PBKDF2 100k)`);
const p = await req("/api/projects", { body: { type: "business", name: `Smoke ${run}` } });
const pid = p.json.id;
created.projectId = pid ?? null;
check("create project", p.status === 200);
await req(`/api/projects/${pid}/intake`, { method: "PUT", body: { step: 1, answers: { businessName: "Smoke Bakery", tagline: "Fresh bread daily", description: "A small bakery in Lisbon baking sourdough and pastries.", about: "We bake every morning using local flour.", services: [{ title: "Sourdough", description: "Slow-fermented loaves" }] } } });
const g = await req(`/api/projects/${pid}/generate`, { body: { useAi: true } });
check("generate (+AI copy)", g.status === 200, `ai used=${g.json.ai?.used} ${g.json.ai?.error ?? ""} ${g.ms}ms`);
const pv = await req(`/preview/${pid}/`, { raw: true });
check("private preview", pv.status === 200 && pv.text.includes("Smoke Bakery"));
const rf = await req(`/api/projects/${pid}/refine`, { body: { request: "make it more elegant with a dark background" } });
check("refine via Workers AI", rf.status === 200, `engine=${rf.json.engine} — ${rf.json.explanation ?? rf.json.error} ${rf.ms}ms`);
const ins = await req(`/api/projects/${pid}/inspiration`, { body: { url: "https://example.com" } });
check("inspiration analysis", ins.status === 200, `method=${ins.json.brief?.method} mood=${ins.json.brief?.mood?.join(",")} ${ins.ms}ms ${ins.json.error ?? ""}`);
// Provider execution: a rules-based fallback also returns 200 above, so these must show the real provider ran.
check("provider: Workers AI wrote copy", g.json.ai?.used === true, `used=${g.json.ai?.used}`);
check("provider: Workers AI refined design", rf.json.engine === "ai", `engine=${rf.json.engine}`);
check("provider: Browser Run analysed inspiration", ins.json.brief?.method === "browser", `method=${ins.json.brief?.method}`);
const ssrf = await req(`/api/projects/${pid}/inspiration`, { body: { url: "http://169.254.169.254/latest/meta-data" } });
check("SSRF blocked", ssrf.status === 400);
const fd = new FormData(); fd.append("file", new Blob([PNG], { type: "image/png" }), "smoke.png");
const up = await req(`/api/projects/${pid}/assets`, { form: fd });
check("upload + serve media", up.status === 200 && (await req(`/media/${up.json.asset?.id}`, { raw: true })).status === 200, `storage=${cfg.storage}`);
const pub = await req(`/api/projects/${pid}/publish`, { body: { contentRightsAck: true } });
check("publish blocked without payment", pub.status === 402);
const co = await req(`/api/billing/projects/${pid}/checkout`, { body: {} });
check("checkout truthful status", co.status === 503 || co.status === 200, `${co.status} ${co.json.code ?? ""}`);
const csrf = await send(BASE + "/api/projects", { method: "POST", headers: { "content-type": "application/json", cookie }, body: "{}" });
check("CSRF header enforced", csrf.status === 403);

// Real order on the demo store (labelled demo; no stock change, no payment)
const prodPage = await req("/s/demo-store/product/spiral-brass-earrings", { raw: true });
const variant = prodPage.text.match(/"id":"(var_[a-z0-9]+)"/)?.[1];
const demoPid = prodPage.text.match(/"pid":"(prj_[a-z0-9]+)"/)?.[1];
const ord = await req(`/api/public/store/${demoPid}/orders`, { body: { items: [{ variantId: variant, quantity: 1 }], fulfillmentId: "pickup", paymentMethodId: "cod", customer: { name: "Smoke Buyer", phone: "+33 1 99 00 00 09", email: "" }, consent: true, idempotencyKey: `smoke${run}`, t: old() } });
created.orderId = ord.json.orderUrl?.match(/order\/(ord_[a-z0-9]+)/)?.[1] ?? null;
check("demo store checkout creates order", ord.status === 200 && !!ord.json.orderUrl, `${ord.status} ${ord.json.error ?? ""}`);
if (ord.json.orderUrl) check("order confirmation page", (await req(ord.json.orderUrl, { raw: true })).text.includes("Thank you, Smoke"));

} catch (e) {
  check("smoke run completed without a network error", false, String(e?.cause?.code ?? e?.message ?? e));
} finally {
  // Best effort through the API, then a record with exact-id SQL for whatever the API can't remove
  // (the account, the demo order, its contact and checkout consent). Nothing is matched by pattern.
  if (created.projectId) {
    const del = await req(`/api/projects/${created.projectId}`, { method: "DELETE" }).catch(() => ({ status: 0 }));
    check("cleanup: delete smoke project", del.status === 200);
  }
  const { mkdirSync, writeFileSync } = await import("node:fs");
  mkdirSync("scripts/smoke-runs", { recursive: true });
  const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
  const user = `(SELECT id FROM users WHERE email = ${q(created.email)})`;
  const sql = [
    `-- Exact cleanup for smoke run ${run} (${new Date().toISOString()}). Review, then run:`,
    `--   npx wrangler d1 execute DB --remote --file scripts/smoke-runs/${run}.sql`,
    ...(created.orderId ? [
      `DELETE FROM consents WHERE kind = 'checkout_data' AND version = ${q(created.orderId)};`,
      `DELETE FROM customer_contacts WHERE id IN (SELECT customer_contact_id FROM orders WHERE id = ${q(created.orderId)});`,
      `DELETE FROM orders WHERE id = ${q(created.orderId)} AND is_demo = 1;`,
    ] : []),
    `DELETE FROM asset_blobs WHERE asset_id IN (SELECT storage_key FROM site_assets WHERE owner_id = ${user});`,
    `DELETE FROM site_assets WHERE owner_id = ${user};`,
    `DELETE FROM generation_jobs WHERE user_id = ${user};`,
    `DELETE FROM consents WHERE user_id = ${user};`,
    `DELETE FROM sessions WHERE user_id = ${user};`,
    `DELETE FROM projects WHERE owner_id = ${user};`,
    `DELETE FROM users WHERE email = ${q(created.email)};`,
  ].join("\n") + "\n";
  writeFileSync(`scripts/smoke-runs/${run}.sql`, sql);
  writeFileSync(`scripts/smoke-runs/${run}.json`, JSON.stringify(created, null, 2));
  console.log(`\nSynthetic records: ${JSON.stringify(created)}\nExact cleanup SQL: scripts/smoke-runs/${run}.sql`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
