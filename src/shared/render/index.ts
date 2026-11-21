import type { Page, SiteDoc } from "../schema";
import type { TemplateDef } from "../templates";
import type { RenderCtx, RenderResult } from "./types";
import { BASE_CSS, themeVars } from "./css";
import { googleFontsHref } from "../fonts";
import { esc, whatsappLink } from "../util";
import { img, linkAttrs, pageUrl, renderSection, socials, type SCtx } from "./sections";
import { cartPage, checkoutPage, orderPage, policyPage, productPage } from "./store";
import { SITE_RUNTIME } from "./runtime";

export type { RenderCtx, RenderResult, ProductView, CollectionView, OrderView, VariantView, AssetMeta } from "./types";

const WA_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.2-.4-.3Z"/></svg>`;

interface Route {
  kind: "page" | "product" | "cart" | "checkout" | "order" | "policy" | "notfound";
  page?: Page;
  handle?: string;
  policy?: string;
}

export function resolveRoute(doc: SiteDoc, path: string): Route {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const parts = clean ? clean.split("/") : [];
  const isStore = doc.type === "ecommerce";
  if (parts.length === 0) return { kind: "page", page: doc.pages.find((p) => p.slug === "") };
  if (parts.length === 1) {
    const page = doc.pages.find((p) => p.slug === parts[0]);
    if (page) return { kind: "page", page };
    if (isStore && parts[0] === "cart") return { kind: "cart" };
    if (isStore && parts[0] === "checkout") return { kind: "checkout" };
  }
  if (parts.length === 2) {
    if (isStore && parts[0] === "product") return { kind: "product", handle: decodeURIComponent(parts[1]) };
    if (isStore && parts[0] === "order") return { kind: "order" };
    if (isStore && parts[0] === "policies") return { kind: "policy", policy: parts[1] };
  }
  return { kind: "notfound" };
}

function header(s: SCtx, current: string): string {
  const { doc, ctx } = s;
  const navPages = doc.pages.filter((p) => p.inNav);
  const style = doc.theme.headerStyle;
  const links = navPages.map((p) => `<li><a href="${esc(pageUrl(ctx, p.slug))}"${p.slug === current ? ' aria-current="page"' : ""}>${esc(p.title)}</a></li>`).join("");
  const logo = doc.brand.logo?.assetId ? img(s, doc.brand.logo, { w: 160, h: 80, eager: true, alt: "" }) : "";
  const brand = `<a class="brand" href="${esc(pageUrl(ctx, ""))}">${logo}<span>${esc(doc.brand.name)}</span></a>`;
  let actions = "";
  if (doc.type === "ecommerce") {
    actions = `<a class="btn btn-primary cart-link" href="${esc(ctx.basePath)}/cart">Cart<span class="cart-count" data-cart-count hidden>0</span></a>`;
  } else {
    const wa = whatsappLink(doc.contact.whatsapp);
    if (wa) actions = `<a class="btn btn-primary hide-sm" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`;
    else if (doc.contact.phone) actions = `<a class="btn btn-primary hide-sm" href="tel:${esc(doc.contact.phone.replace(/[^+0-9]/g, ""))}">Call ${esc(doc.contact.phone)}</a>`;
  }
  const menuBtn = `<button class="menu-btn" type="button" data-menu-btn aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><span></span><span></span><span></span></button>`;
  const topbar = style === "split" && (doc.contact.phone || doc.contact.email || doc.contact.city)
    ? `<div class="topbar"><div class="wrap"><span>${esc([doc.contact.city, doc.contact.country].filter(Boolean).join(", "))}</span><span>${doc.contact.phone ? `<a href="tel:${esc(doc.contact.phone.replace(/[^+0-9]/g, ""))}">${esc(doc.contact.phone)}</a>` : ""}${doc.contact.phone && doc.contact.email ? " · " : ""}${doc.contact.email ? `<a href="mailto:${esc(doc.contact.email)}">${esc(doc.contact.email)}</a>` : ""}</span></div></div>`
    : "";
  const sidebarExtra = style === "sidebar" ? `<div class="hide-sm" style="margin-top:auto;font-size:.88rem" >${socials(s)}</div>` : "";
  return `${topbar}<header class="site-header ${style}"><div class="wrap bar">${brand}<nav id="site-nav" class="nav" aria-label="Main">${links ? `<ul>${links}</ul>` : ""}</nav><div class="head-actions">${actions}${menuBtn}</div>${sidebarExtra}</div></header>`;
}

function footer(s: SCtx): string {
  const { doc, ctx } = s;
  const year = new Date(ctx.renderedAt ?? Date.now()).getFullYear();
  const variant = s.tpl.variants.footer || "simple";
  const nav = doc.pages.filter((p) => p.inNav).map((p) => `<li><a href="${esc(pageUrl(ctx, p.slug))}">${esc(p.title)}</a></li>`).join("");
  const policies = doc.type === "ecommerce" ? ["returns", "shipping", "privacy"].map((k) => `<li><a href="${esc(ctx.basePath)}/policies/${k}">${k === "returns" ? "Returns & refunds" : k === "shipping" ? "Delivery & shipping" : "Privacy"}</a></li>`).join("") : "";
  const contact = [
    doc.contact.email ? `<li><a href="mailto:${esc(doc.contact.email)}">${esc(doc.contact.email)}</a></li>` : "",
    doc.contact.phone ? `<li><a href="tel:${esc(doc.contact.phone.replace(/[^+0-9]/g, ""))}">${esc(doc.contact.phone)}</a></li>` : "",
    doc.contact.address || doc.contact.city ? `<li>${esc([doc.contact.address, doc.contact.city, doc.contact.country].filter(Boolean).join(", "))}</li>` : "",
  ].join("");
  const credits = Object.values(ctx.assets ?? {}).map((a) => a.attribution).filter(Boolean) as string[];
  const creditLine = credits.length ? `<p class="muted" style="font-size:.8rem;margin-top:1rem">Image credits: ${credits.map(esc).join("; ")}</p>` : "";
  const platform = `<a href="${esc(ctx.platformUrl)}" target="_blank" rel="noopener">Built with ${esc(ctx.platformName)}</a>`;
  const bottom = `<div class="bottom"><span>© ${year} ${esc(doc.brand.name)}${doc.footer.text ? ` · ${esc(doc.footer.text)}` : ""}</span><span>${platform}</span></div>`;
  if (variant === "simple") {
    return `<footer class="site-footer"><div class="wrap">${socials(s)}${policies ? `<ul style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem">${policies}</ul>` : ""}${creditLine}${bottom}</div></footer>`;
  }
  return `<footer class="site-footer ${variant}"><div class="wrap">${variant === "big" ? `<div class="huge">${esc(doc.brand.name)}</div>` : ""}<div class="cols"><div><strong style="font-family:var(--font-h);font-size:1.15rem">${esc(doc.brand.name)}</strong>${doc.brand.tagline ? `<p class="muted" style="margin-top:.5rem;max-width:360px">${esc(doc.brand.tagline)}</p>` : ""}${socials(s)}</div><div><h2 class="eyebrow" style="font-size:.78rem">Explore</h2><ul>${nav}${policies}</ul></div><div><h2 class="eyebrow" style="font-size:.78rem">Contact</h2><ul>${contact}</ul></div></div>${creditLine}${bottom}</div></footer>`;
}

function notFound(s: SCtx): string {
  return `<section class="sec"><div class="wrap"><h1>Page not found</h1><p>The page you are looking for does not exist.</p><a class="btn btn-primary" href="${esc(pageUrl(s.ctx, ""))}">Go to the home page</a></div></section>`;
}

export function renderSite(doc: SiteDoc, tpl: TemplateDef, ctx: RenderCtx, path: string): RenderResult {
  const route = resolveRoute(doc, path);
  const home = doc.pages.find((p) => p.slug === "") ?? doc.pages[0];
  const s: SCtx = { doc, tpl, ctx, page: route.page ?? home };
  let main = "";
  let status = 200;
  let title = doc.seo.title || doc.brand.name;
  let current = route.page?.slug ?? "__";

  switch (route.kind) {
    case "page": {
      const page = route.page!;
      const firstVisible = page.sections.find((x) => !x.hidden && x.kind !== "banner");
      const pageHead = firstVisible?.kind === "hero" ? "" : `<section class="page-head"><div class="wrap"><h1>${esc(page.slug ? page.title : doc.brand.name)}</h1></div></section>`;
      // Avoid a doubled title ("Services" / "Services", "Contact" / "Contact us"): drop the first section's heading
      // when it repeats the page <h1>, ignoring case, punctuation and filler words such as "us" or "our".
      const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !["us", "our", "the", "with"].includes(w)).join(" ");
      const headText = norm(page.slug ? page.title : doc.brand.name);
      const sections = page.sections.map((sec) => {
        const h = (sec.data as { heading?: string }).heading;
        return pageHead && sec === firstVisible && typeof h === "string" && headText !== "" && norm(h) === headText
          ? ({ ...sec, data: { ...sec.data, heading: "" } } as typeof sec)
          : sec;
      });
      main = pageHead + sections.map((sec, i) => renderSection(s, sec, i)).join("");
      if (page.slug) title = `${page.title} · ${doc.brand.name}`;
      break;
    }
    case "product": {
      const p = ctx.store?.products.find((x) => x.handle === route.handle);
      if (p) { main = productPage(s, p); title = `${p.title} · ${doc.brand.name}`; }
      else { main = notFound(s); status = 404; }
      break;
    }
    case "cart": main = cartPage(s); title = `Cart · ${doc.brand.name}`; break;
    case "checkout": main = checkoutPage(s); title = `Checkout · ${doc.brand.name}`; break;
    case "order": {
      main = orderPage(s); title = `Your order · ${doc.brand.name}`;
      if (!ctx.order) status = 404;
      break;
    }
    case "policy": {
      const html = policyPage(s, route.policy!);
      if (html) main = html; else { main = notFound(s); status = 404; }
      break;
    }
    default: main = notFound(s); status = 404;
  }

  const t = doc.theme;
  const fonts = googleFontsHref([t.fontHeading, t.fontBody]);
  const noindex = ctx.mode !== "published";
  const bodyCls = [
    `t-${tpl.id}`, `hs-${t.headerStyle}`, `cs-${t.cardStyle}`, `orn-${t.ornament}`, `anim-${t.animation}`, `mode-${t.mode}`,
  ].join(" ");
  const cfg = JSON.stringify({
    pid: ctx.projectId, api: ctx.apiBase, base: ctx.basePath, mode: ctx.mode, store: doc.type === "ecommerce",
    low: doc.store?.lowStockThreshold ?? 3, t: ctx.renderedAt ?? Date.now(),
  }).replace(/</g, "\\u003c");
  const notices = [
    ctx.isDemo ? `<div class="notice" role="note">Demonstration site with fictional content, built with ${esc(ctx.platformName)}.${doc.type === "ecommerce" ? " Orders placed here are test orders: nothing is shipped and no payment is collected." : ""} <a href="${esc(ctx.platformUrl)}">Create your own</a></div>` : "",
    ctx.mode === "preview" ? `<div class="notice" role="note">Private preview: not published. Forms and checkout are switched off.</div>` : "",
  ].join("");
  const ribbon = ctx.mode === "preview" ? `<div class="ribbon" aria-hidden="true">PREVIEW · NOT PUBLISHED</div>` : ctx.mode === "template" ? `<div class="ribbon" aria-hidden="true">TEMPLATE PREVIEW · SAMPLE CONTENT</div>` : "";
  const wa = doc.type !== "ecommerce" ? whatsappLink(doc.contact.whatsapp) : null;
  const waFloat = wa && ctx.mode !== "template" ? `<a class="wa-float" href="${esc(wa)}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">${WA_ICON}</a>` : "";
  const nonceAttr = ctx.nonce ? ` nonce="${esc(ctx.nonce)}"` : "";
  const canonical = ctx.mode === "published" ? `<link rel="canonical" href="${esc(ctx.platformUrl.replace(/\/$/, ""))}${esc(pageUrl(ctx, route.page?.slug ?? ""))}">` : "";
  const description = doc.seo.description || doc.brand.tagline;

  const html = `<!doctype html>
<html lang="${esc(doc.seo.lang)}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ""}
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
${canonical}
<meta property="og:title" content="${esc(title)}">
${description ? `<meta property="og:description" content="${esc(description)}">` : ""}
<meta property="og:type" content="website">
<meta name="theme-color" content="${esc(t.colors.bg)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fonts)}">
<style>${themeVars(t)}${BASE_CSS}${tpl.css}</style>
</head>
<body class="${bodyCls}">
<a class="skip" href="#main">Skip to content</a>
${notices}
<div class="layout">${header(s, current)}<div><main id="main">${main}</main>${footer(s)}</div></div>
${waFloat}${ribbon}
${ctx.staticMode ? "" : `<script type="application/json" id="is-cfg">${cfg}</script>
<script${nonceAttr}>${SITE_RUNTIME}</script>`}
</body>
</html>`;
  return { status, html };
}

export { linkAttrs };
