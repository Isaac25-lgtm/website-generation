import type { Section } from "../schema";
import type { ProductView } from "./types";
import type { SCtx } from "./sections";
import { img, imageSrc, pageUrl } from "./sections";
import { esc, formatMoney, paragraphs, whatsappLink } from "../util";
import { LAYOUT_DEFAULTS } from "./layouts";

export function productUrl(s: SCtx, p: ProductView): string {
  return `${s.ctx.basePath}/product/${encodeURIComponent(p.handle)}`;
}

function productAvailable(p: ProductView): boolean {
  return p.variants.some((v) => v.available);
}

function minPrice(p: ProductView): number {
  return p.variants.length ? Math.min(...p.variants.map((v) => v.priceMinor)) : p.priceMinor;
}

function layoutDefault(s: SCtx) {
  return s.tpl.layout ? (LAYOUT_DEFAULTS as Record<string, (typeof LAYOUT_DEFAULTS)[keyof typeof LAYOUT_DEFAULTS] | undefined>)[s.tpl.layout] : undefined;
}

function collectionName(s: SCtx, p: ProductView): string {
  const h = p.collections[0];
  return (h && s.ctx.store?.collections.find((c) => c.handle === h)?.name) || "";
}

const CARD_SIZE: Record<string, [number, number]> = { tall: [600, 800], quiet: [640, 800], room: [800, 600], large: [640, 800], life: [640, 800] };

export function productCard(s: SCtx, p: ProductView, variant = ""): string {
  const avail = productAvailable(p);
  const [w, h] = CARD_SIZE[variant] ?? [700, 700];
  const second = variant === "jewel" && p.images[1] ? `<span class="alt-img" aria-hidden="true">${img(s, p.images[1], { w, h, alt: "" })}</span>` : "";
  const meta = collectionName(s, p);
  const price = minPrice(p);
  const multi = new Set(p.variants.map((v) => v.priceMinor)).size > 1;
  const onSale = p.compareAtMinor !== null && p.compareAtMinor > price;
  return `<a class="product-card" href="${esc(productUrl(s, p))}"><div class="ph">${img(s, p.images[0], { w, h, fallbackSeed: p.title, alt: p.images[0]?.alt || p.title })}${second}${!avail ? `<span class="badge sold">Sold out</span>` : onSale ? `<span class="badge">Sale</span>` : ""}</div><div class="info">${meta ? `<span class="p-meta" hidden>${esc(meta)}</span>` : ""}<span class="p-title">${esc(p.title)}</span><span><span class="price">${multi ? "From " : ""}${esc(formatMoney(price, p.currency))}</span>${onSale ? `<span class="compare">${esc(formatMoney(p.compareAtMinor!, p.currency))}</span>` : ""}</span></div></a>`;
}

function emptyStore(s: SCtx): string {
  return `<div class="form-card"><p style="margin:0">${s.ctx.mode === "published" ? "New products are coming soon." : "No products yet. Add products in your dashboard and they will appear here."}</p></div>`;
}

export function renderProductsSection(s: SCtx, sec: Extract<Section, { kind: "products" }>, alt: boolean): string {
  const d = sec.data;
  const store = s.ctx.store;
  const variant = sec.variant || s.tpl.variants.products || layoutDefault(s)?.products || "grid";
  const cls = ["large", "compact", "tall", "quiet", "jewel", "room", "object", "life", "hair"].includes(variant) ? `products-${variant}` : "";
  let products = (store?.products ?? []).slice();
  let tools = "";
  if (d.mode === "all") {
    const q = (s.ctx.query?.get("q") || "").trim().slice(0, 80);
    const c = (s.ctx.query?.get("c") || "").trim().slice(0, 60);
    const sort = s.ctx.query?.get("sort") || "featured";
    if (q) {
      const needle = q.toLowerCase();
      products = products.filter((p) => `${p.title} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(needle));
    }
    if (c) products = products.filter((p) => p.collections.includes(c));
    if (sort === "price-asc") products.sort((a, b) => minPrice(a) - minPrice(b));
    else if (sort === "price-desc") products.sort((a, b) => minPrice(b) - minPrice(a));
    else if (sort === "new") products.sort((a, b) => b.createdAt - a.createdAt);
    else products.sort((a, b) => Number(b.featured) - Number(a.featured));
    const cols = store?.collections ?? [];
    tools = `<form class="shop-tools" method="get" role="search" aria-label="Search and filter products"><label>Search<input type="search" name="q" value="${esc(q)}" placeholder="Search products" maxlength="80"></label>${cols.length ? `<label>Category<select name="c"><option value="">All categories</option>${cols.map((x) => `<option value="${esc(x.handle)}"${x.handle === c ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}<label>Sort<select name="sort">${[["featured", "Featured"], ["new", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]].map(([k, l]) => `<option value="${k}"${k === sort ? " selected" : ""}>${l}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Apply</button>${q || c ? `<a class="btn btn-ghost" href="${esc(pageUrl(s.ctx, s.page.slug))}">Clear</a>` : ""}</form><p class="muted" aria-live="polite">${products.length} product${products.length === 1 ? "" : "s"}${q ? ` matching “${esc(q)}”` : ""}</p>`;
  } else if (d.mode === "collection" && d.collectionHandle) {
    products = products.filter((p) => p.collections.includes(d.collectionHandle));
  } else {
    const featured = products.filter((p) => p.featured);
    products = (featured.length ? featured : products).slice(0, d.limit);
  }
  const grid = products.length ? `<div class="grid ${cls}" style="${cls ? "" : "--min:240px"}">${products.map((p) => productCard(s, p, variant)).join("")}</div>` : d.mode === "all" && (s.ctx.query?.get("q") || s.ctx.query?.get("c")) ? `<p>No products match your search.</p>` : emptyStore(s);
  const more = d.mode !== "all" && s.doc.pages.some((p) => p.slug === "shop") && s.page.slug !== "shop" ? `<div class="actions"><a class="btn btn-ghost" href="${esc(pageUrl(s.ctx, "shop"))}">View all products</a></div>` : "";
  return `<section id="${esc(sec.id)}" class="sec products${alt ? " alt" : ""}"><div class="wrap rv">${d.heading || d.intro ? `<div class="sec-head">${d.heading ? `<h2>${esc(d.heading)}</h2>` : ""}${d.intro ? `<p class="lead">${esc(d.intro)}</p>` : ""}</div>` : ""}${tools}${grid}${more}</div></section>`;
}

export function renderCollectionsSection(s: SCtx, sec: Extract<Section, { kind: "collections" }>, alt: boolean): string {
  const cols = s.ctx.store?.collections ?? [];
  if (!cols.length) return "";
  const variant = sec.variant || s.tpl.variants.collections || "tiles";
  const shop = pageUrl(s.ctx, "shop");
  const inner = variant === "chips"
    ? `<div class="chips">${cols.map((c) => `<a class="chip" href="${esc(shop)}?c=${encodeURIComponent(c.handle)}">${esc(c.name)}</a>`).join("")}</div>`
    : `<div class="tiles">${cols.map((c) => {
        const first = s.ctx.store?.products.find((p) => p.collections.includes(c.handle) && p.images[0]);
        return `<a class="tile" href="${esc(shop)}?c=${encodeURIComponent(c.handle)}">${img(s, first?.images[0], { w: 800, h: 600, fallbackSeed: c.name, alt: "" })}<span>${esc(c.name)}</span></a>`;
      }).join("")}</div>`;
  return `<section id="${esc(sec.id)}" class="sec collections${alt ? " alt" : ""}"><div class="wrap rv">${sec.data.heading ? `<div class="sec-head"><h2>${esc(sec.data.heading)}</h2>${sec.data.intro ? `<p class="lead">${esc(sec.data.intro)}</p>` : ""}</div>` : ""}${inner}</div></section>`;
}

export function productPage(s: SCtx, p: ProductView): string {
  const store = s.doc.store;
  const first = p.variants.find((v) => v.available) ?? p.variants[0];
  const opts1 = [...new Set(p.variants.map((v) => v.option1).filter(Boolean))] as string[];
  const opts2 = [...new Set(p.variants.map((v) => v.option2).filter(Boolean))] as string[];
  const select = (name: string, label: string | null, opts: string[], cur: string | null) =>
    opts.length ? `<label>${esc(label || "Option")}<select name="${name}">${opts.map((o) => `<option${o === cur ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>` : "";
  const images = p.images.length ? p.images : [{ art: p.title, alt: p.title, caption: "" }];
  const mainImg = img(s, images[0], { w: 1000, h: 1000, eager: true, alt: images[0].alt || p.title });
  const thumbs = images.length > 1 ? `<div class="thumbs" style="margin-top:.75rem">${images.map((im, i) => {
    const src = imageSrc(s, im);
    return src ? `<button type="button" data-src="${esc(src)}" data-alt="${esc(im.alt || p.title)}" aria-pressed="${i === 0}" aria-label="Show image ${i + 1}">${img(s, im, { w: 168, h: 128 })}</button>` : "";
  }).join("")}</div>` : "";
  const productJson = JSON.stringify({ variants: p.variants, currency: p.currency, maxPerOrder: p.maxPerOrder }).replace(/</g, "\\u003c");
  const onSale = p.compareAtMinor !== null && p.compareAtMinor > (first?.priceMinor ?? p.priceMinor);
  const fulfil = (store?.fulfillment ?? []).map((f) => `<li>${esc(f.label)} — ${f.priceMinor ? esc(formatMoney(f.priceMinor, store!.currency)) : "free"}${f.details ? `<br><span class="muted">${esc(f.details)}</span>` : ""}</li>`).join("");
  const pays = (store?.paymentMethods ?? []).map((m) => `<li>${esc(m.label)}</li>`).join("");
  const stacked = layoutDefault(s)?.pdp === "stacked";
  const media = stacked
    ? `<div class="gallery-stack">${images.map((im, i) => img(s, im, { w: 960, h: 1200, eager: i === 0, alt: im.alt || p.title })).join("")}</div>`
    : `<div class="main-img">${mainImg}</div>${thumbs}`;
  const cat = p.collections[0] ? s.ctx.store?.collections.find((c) => c.handle === p.collections[0]) : undefined;
  // Same category first, then the rest of the shop, so small categories still get a full row.
  const others = (s.ctx.store?.products ?? []).filter((x) => x.id !== p.id);
  const sameCat = cat ? others.filter((x) => x.collections.includes(cat.handle)) : [];
  const related = [...sameCat, ...others.filter((x) => !sameCat.includes(x))].slice(0, 4);
  const relVariant = s.tpl.variants.products || layoutDefault(s)?.products || "grid";
  const relCls = ["large", "compact", "tall", "quiet", "jewel", "room", "object", "life", "hair"].includes(relVariant) ? `products-${relVariant}` : "";
  const relatedHtml = related.length ? `<section class="sec related" aria-labelledby="rel-h"><div class="wrap"><div class="sec-head"><h2 id="rel-h">${cat && sameCat.length >= 2 ? `More from ${esc(cat.name)}` : "You may also like"}</h2></div><div class="grid ${relCls}"${relCls ? "" : ' style="--min:220px"'}>${related.map((x) => productCard(s, x, relVariant)).join("")}</div></div></section>` : "";
  return `<section class="sec"><div class="wrap"><nav aria-label="Breadcrumb" class="meta" style="margin-bottom:1.5rem"><a href="${esc(pageUrl(s.ctx, ""))}">Home</a> / <a href="${esc(pageUrl(s.ctx, "shop"))}">Shop</a>${cat ? ` / <a href="${esc(pageUrl(s.ctx, "shop"))}?c=${encodeURIComponent(cat.handle)}">${esc(cat.name)}</a>` : ""} / <span aria-current="page">${esc(p.title)}</span></nav>
<div class="pdp${stacked ? " stacked" : ""}"><div>${media}</div>
<div class="details"><h1 style="font-size:clamp(1.9rem,3.6vw,2.8rem)">${esc(p.title)}</h1><p class="p-price"><span class="price" data-price>${esc(formatMoney(first?.priceMinor ?? p.priceMinor, p.currency))}</span>${onSale ? `<span class="compare">${esc(formatMoney(p.compareAtMinor!, p.currency))}</span>` : ""}</p>
<form class="f" data-add><input type="hidden" name="variant" value="${esc(first?.id ?? "")}">${select("option1", p.option1Name, opts1, first?.option1 ?? null)}${select("option2", p.option2Name, opts2, first?.option2 ?? null)}
<label>Quantity<input class="qty" type="number" name="qty" min="1" max="${p.maxPerOrder}" value="1" inputmode="numeric"></label>
<p class="stock" data-stock aria-live="polite"></p><div><button class="btn btn-primary" type="submit" style="min-width:220px">Add to cart</button></div><p class="form-status" role="status" aria-live="polite"></p></form>
<div style="margin-top:1.5rem">${paragraphs(p.description)}</div>
<div class="info-list">${fulfil ? `<details><summary>Delivery &amp; pickup</summary><ul>${fulfil}</ul></details>` : ""}${pays ? `<details><summary>Ways to pay</summary><ul>${pays}</ul></details>` : ""}${store?.returnsPolicy ? `<details><summary>Returns</summary>${paragraphs(store.returnsPolicy)}</details>` : ""}</div>
</div></div></div></section>${relatedHtml}<script type="application/json" id="is-product">${productJson}</script>`;
}

export function cartPage(s: SCtx): string {
  return `<section class="sec"><div class="wrap"><h1 style="font-size:clamp(2rem,4vw,3rem)">Your cart</h1><div data-cart-root><noscript><p>Please enable JavaScript to use the cart.</p></noscript></div></div></section>`;
}

export function storeReady(s: SCtx): boolean {
  const st = s.doc.store;
  return !!st && st.paymentMethods.length > 0 && st.fulfillment.length > 0;
}

export function checkoutPage(s: SCtx): string {
  const st = s.doc.store;
  if (!st || !storeReady(s)) {
    return `<section class="sec"><div class="wrap"><h1>Checkout</h1><div class="form-card"><p>This store is not accepting orders yet. Please contact the seller directly.</p></div></div></section>`;
  }
  const fulfil = st.fulfillment.map((f, i) => `<label class="opt"><input type="radio" name="fulfillmentId" value="${esc(f.id)}" data-kind="${f.kind}" data-price="${f.priceMinor}"${i === 0 ? " checked" : ""} required><span><strong>${esc(f.label)}</strong> — ${f.priceMinor ? esc(formatMoney(f.priceMinor, st.currency)) : "Free"}${f.details ? `<br><span class="muted">${esc(f.details)}</span>` : ""}</span></label>`).join("");
  const pays = st.paymentMethods.map((m, i) => `<label class="opt"><input type="radio" name="paymentMethodId" value="${esc(m.id)}"${i === 0 ? " checked" : ""} required><span><strong>${esc(m.label)}</strong>${m.instructions ? `<br><span class="muted">${esc(m.instructions)}</span>` : ""}</span></label>`).join("");
  const privacyHref = `${s.ctx.basePath}/policies/privacy`;
  return `<section class="sec"><div class="wrap"><h1 style="font-size:clamp(2rem,4vw,3rem)">Checkout</h1>
<p class="muted" style="max-width:720px">Online card payment is not enabled for this store. You choose how to pay below, and the seller confirms your order and payment directly with you.</p>
<div class="checkout-grid"><form class="f" data-checkout novalidate>
<fieldset><legend>Your details</legend><div style="display:grid;gap:1rem"><label>Full name<input name="name" required maxlength="80" autocomplete="name"></label><div class="row2"><label>Phone${st.requirePhone ? "" : " (optional)"}<input name="phone" type="tel" maxlength="40" autocomplete="tel"${st.requirePhone ? " required" : ""}></label><label>Email${st.requireEmail ? "" : " (optional)"}<input name="email" type="email" maxlength="200" autocomplete="email"${st.requireEmail ? " required" : ""}></label></div></div></fieldset>
<fieldset><legend>Delivery or pickup</legend>${fulfil}</fieldset>
<fieldset data-address><legend>Delivery address</legend><div style="display:grid;gap:1rem"><label>Street address<input name="line1" maxlength="200" autocomplete="street-address" data-req></label><div class="row2"><label>Town / city<input name="city" maxlength="80" autocomplete="address-level2" data-req></label><label>Region / district (optional)<input name="region" maxlength="80" autocomplete="address-level1"></label></div><label>Country<input name="country" maxlength="80" autocomplete="country-name" value="${esc(s.doc.contact.country)}"></label><label>Directions for the courier (optional)<textarea name="addressNotes" maxlength="500" style="min-height:80px"></textarea></label></div></fieldset>
<fieldset><legend>Payment</legend>${pays}</fieldset>
<label>Order notes (optional)<textarea name="notes" maxlength="1000" style="min-height:90px"></textarea></label>
${st.checkoutNote ? `<p class="muted">${esc(st.checkoutNote)}</p>` : ""}${st.taxNote ? `<p class="muted">${esc(st.taxNote)}</p>` : ""}
<div class="hp" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
<label class="check"><input type="checkbox" name="consent" required> <span>I agree that ${esc(s.doc.brand.name)} may use my details to process this order, as described in the <a href="${esc(privacyHref)}">privacy notice</a>.</span></label>
<div><button class="btn btn-primary" type="submit" style="min-width:240px">Place order</button></div><p class="form-status" role="status" aria-live="polite"></p></form>
<aside class="summary" aria-label="Order summary"><h2 style="font-size:1.25rem;margin:0">Order summary</h2><div data-summary style="display:grid;gap:.6rem"><span class="muted">Loading…</span></div></aside></div></div></section>`;
}

export function orderPage(s: SCtx): string {
  const o = s.ctx.order;
  if (!o) return `<section class="sec"><div class="wrap"><h1>Order not found</h1><p>Check the link from your confirmation.</p></div></section>`;
  const st = s.doc.store;
  const pm = st?.paymentMethods.find((m) => m.kind === o.paymentMethod || m.id === o.paymentMethod);
  const lines = o.items.map((i) => `<div class="row"><span>${esc(i.title)}${i.variantTitle ? ` · ${esc(i.variantTitle)}` : ""} × ${i.quantity}</span><span>${esc(formatMoney(i.lineMinor, o.currency))}</span></div>`).join("");
  const waText = `Hello ${s.doc.brand.name}, I placed order #${o.number} (${formatMoney(o.totalMinor, o.currency)}) on your website.`;
  const wa = whatsappLink(s.doc.contact.whatsapp, waText);
  return `<section class="sec"><div class="wrap" style="max-width:820px">
${o.isDemo ? `<div class="notice" style="border-radius:8px;margin-bottom:1.5rem">This is a demonstration store. This test order will not be fulfilled and no payment is due.</div>` : ""}
<span class="eyebrow">Order #${o.number}</span><h1 style="font-size:clamp(2rem,4vw,3rem)">Thank you, ${esc(o.customerName.split(" ")[0])}.</h1>
<p class="lead">Your order has been received. Status: <span class="status-pill">${esc(o.status.replace(/_/g, " "))}</span> · Payment: <span class="status-pill">${esc(o.paymentStatus)}</span></p>
${pm?.instructions ? `<div class="form-card" style="margin:1.5rem 0"><h2 style="font-size:1.2rem">How to pay: ${esc(pm.label)}</h2>${paragraphs(pm.instructions)}</div>` : ""}
<div class="summary">${lines}<div class="row"><span>Subtotal</span><span>${esc(formatMoney(o.subtotalMinor, o.currency))}</span></div><div class="row"><span>${esc(o.fulfillmentLabel)}</span><span>${o.shippingMinor ? esc(formatMoney(o.shippingMinor, o.currency)) : "Free"}</span></div><div class="row total"><span>Total</span><span>${esc(formatMoney(o.totalMinor, o.currency))}</span></div></div>
<div class="actions">${wa ? `<a class="btn btn-primary" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Message the seller on WhatsApp</a>` : ""}<a class="btn btn-ghost" href="${esc(pageUrl(s.ctx, "shop"))}">Continue shopping</a></div>
<p class="muted" style="margin-top:1.5rem">Keep this page's link to check your order status later.</p></div></section>`;
}

export function policyPage(s: SCtx, which: string): string | null {
  const st = s.doc.store;
  const map: Record<string, [string, string | undefined]> = {
    returns: ["Returns & refunds", st?.returnsPolicy],
    shipping: ["Delivery & shipping", st?.shippingPolicy],
    privacy: ["Privacy notice", st?.privacyNote],
  };
  const entry = map[which];
  if (!entry) return null;
  const [title, body] = entry;
  return `<section class="sec"><div class="wrap" style="max-width:820px"><h1 style="font-size:clamp(2rem,4vw,3rem)">${esc(title)}</h1>${body ? paragraphs(body) : `<p>The seller has not published this policy yet. Please contact them before ordering.</p>`}<p class="muted" style="margin-top:2rem">This policy is published by ${esc(s.doc.brand.name)}, the seller operating this store.</p></div></section>`;
}
