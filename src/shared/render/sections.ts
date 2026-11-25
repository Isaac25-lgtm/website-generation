import type { ImageRef, Link, Page, Section, SiteDoc } from "../schema";
import type { TemplateDef } from "../templates";
import type { RenderCtx } from "./types";
import { artDataUri } from "../art";
import { esc, formatMoney, isExternal, paragraphs, safeHref, whatsappLink } from "../util";
import { renderProductsSection, renderCollectionsSection } from "./store";
import { personalHero } from "./personal-heroes";
import { businessHero } from "./business-heroes";
import { premiumHero } from "./premium-heroes";

export interface SCtx {
  doc: SiteDoc;
  tpl: TemplateDef;
  ctx: RenderCtx;
  page: Page;
}

export function pageUrl(ctx: RenderCtx, slug: string): string {
  return slug ? `${ctx.basePath}/${slug}` : `${ctx.basePath}/`;
}

/** Resolve a link from the SiteDoc: internal "/slug" paths are prefixed with the site base path. */
export function linkHref(ctx: RenderCtx, href: string | undefined): string | null {
  const h = safeHref(href);
  if (!h) return null;
  if (h.startsWith("/")) return h === "/" ? `${ctx.basePath}/` : `${ctx.basePath}${h}`;
  return h;
}

export function linkAttrs(href: string): string {
  return isExternal(href) ? ` href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : ` href="${esc(href)}"`;
}

/** URL of a platform-hosted CC0 stock photo (absolute in static exports). */
export function stockUrl(ctx: RenderCtx, name: string): string {
  return `${ctx.mode === "export" ? ctx.platformUrl.replace(/\/$/, "") : ""}/stock/${name}.webp`;
}

export function imageSrc(s: SCtx, ref: ImageRef | undefined): string {
  if (ref?.assetId) return s.ctx.assetUrl(ref.assetId);
  if (ref?.stock && /^[a-z0-9-]{1,48}$/.test(ref.stock)) return stockUrl(s.ctx, ref.stock);
  return "";
}

export function img(s: SCtx, ref: ImageRef | undefined, opts: { w?: number; h?: number; cls?: string; eager?: boolean; fallbackSeed?: string; alt?: string } = {}): string {
  const { w = 1200, h = 800 } = opts;
  let src: string | null = null;
  let alt = ref?.alt || opts.alt || "";
  if (ref?.assetId) {
    src = s.ctx.assetUrl(ref.assetId);
    if (!alt) alt = s.ctx.assets?.[ref.assetId]?.alt || "";
  } else if (ref?.stock && /^[a-z0-9-]{1,48}$/.test(ref.stock)) {
    src = stockUrl(s.ctx, ref.stock);
  } else if (ref?.art || opts.fallbackSeed) {
    src = artDataUri(ref?.art || opts.fallbackSeed!, s.tpl.art, s.doc.theme.colors, w, h);
    // decorative artwork: empty alt unless an explicit description exists
    alt = ref?.alt || "";
  }
  if (!src) return "";
  return `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}"${opts.cls ? ` class="${opts.cls}"` : ""} ${opts.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function btn(s: SCtx, l: Link | undefined, cls: string): string {
  if (!l?.label) return "";
  const href = linkHref(s.ctx, l.href);
  if (!href) return "";
  return `<a class="btn ${cls}"${linkAttrs(href)}>${esc(l.label)}</a>`;
}

function head(heading: string, intro?: string, opts: { center?: boolean; eyebrow?: string; level?: number } = {}): string {
  if (!heading && !intro) return "";
  const lvl = opts.level ?? 2;
  return `<div class="sec-head${opts.center ? " center" : ""}">${opts.eyebrow ? `<span class="eyebrow">${esc(opts.eyebrow)}</span>` : ""}${heading ? `<h${lvl}>${esc(heading)}</h${lvl}>` : ""}${intro ? `<p class="lead">${esc(intro)}</p>` : ""}</div>`;
}

function v(s: SCtx, sec: Section): string {
  return sec.variant || s.tpl.variants[sec.kind] || "";
}

function wrapSec(sec: Section, inner: string, cls = "", alt = false): string {
  return `<section id="${esc(sec.id)}" class="sec ${sec.kind}${cls ? " " + cls : ""}${alt ? " alt" : ""}"><div class="wrap rv">${inner}</div></section>`;
}

// ─────────────────────────────── sections ───────────────────────────────

export function renderSection(s: SCtx, sec: Section, index: number): string {
  if (sec.hidden) return "";
  const alt = index % 2 === 1 && !["hero", "banner", "cta"].includes(sec.kind);
  switch (sec.kind) {
    case "hero": return hero(s, sec);
    case "about": {
      const d = sec.data, variant = v(s, sec) || "split";
      const media = img(s, d.image, { w: 900, h: 1100 });
      const hl = d.highlights.filter(Boolean).length ? `<ul class="highlights">${d.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : "";
      if (variant === "card") return wrapSec(sec, `<div class="inner">${head(d.heading)}${paragraphs(d.body)}${hl}</div>`, "card", alt);
      if (variant === "columns" || !media) return wrapSec(sec, `${head(d.heading)}<div class="body">${paragraphs(d.body)}</div>${hl}`, "columns", alt);
      return `<section id="${esc(sec.id)}" class="sec about split${alt ? " alt" : ""}"><div class="wrap rv"><div class="media">${media}</div><div>${head(d.heading)}${paragraphs(d.body)}${hl}</div></div></section>`;
    }
    case "text": return wrapSec(sec, `${head(sec.data.heading)}<div style="max-width:760px">${paragraphs(sec.data.body)}</div>`, "", alt);
    case "services": return services(s, sec, alt);
    case "projects": return projects(s, sec, alt);
    case "experience": {
      const d = sec.data; if (!d.items.length) return "";
      const variant = v(s, sec) || "timeline";
      const items = d.items.map((x) =>
        variant === "table"
          ? `<article><div class="meta">${esc(x.period)}${x.location ? `<br>${esc(x.location)}` : ""}</div><div><h3>${esc(x.role)}${x.org ? ` · <span class="muted">${esc(x.org)}</span>` : ""}</h3>${paragraphs(x.description)}</div></article>`
          : `<article><div class="meta">${esc([x.period, x.location].filter(Boolean).join(" · "))}</div><h3>${esc(x.role)}</h3>${x.org ? `<div class="muted" style="margin:-.3rem 0 .6rem">${esc(x.org)}</div>` : ""}${paragraphs(x.description)}</article>`,
      ).join("");
      return wrapSec(sec, `${head(d.heading)}<div class="${variant === "table" ? "xp-table" : "timeline"}">${items}</div>`, "", alt);
    }
    case "education": {
      const d = sec.data; if (!d.items.length) return "";
      return wrapSec(sec, `${head(d.heading)}<div class="grid" style="--min:260px">${d.items.map((x) => `<article class="card"><div class="meta">${esc(x.period)}</div><h3>${esc(x.title)}</h3><div class="muted">${esc(x.org)}</div>${x.description ? `<p style="margin-top:.6rem">${esc(x.description)}</p>` : ""}</article>`).join("")}</div>`, "", alt);
    }
    case "achievements": {
      const d = sec.data; if (!d.items.length) return "";
      if (v(s, sec) === "fame") return wrapSec(sec, `${head(d.heading)}<div class="fame">${d.items.map((x) => `<article>${x.year ? `<span class="yr">${esc(x.year)}</span>` : ""}<h3>${esc(x.title)}</h3>${x.detail ? `<p class="muted" style="margin:0">${esc(x.detail)}</p>` : ""}</article>`).join("")}</div>`, "", alt);
      if (v(s, sec) === "table") return wrapSec(sec, `${head(d.heading)}<table class="awards"><thead><tr><th scope="col">Recognition</th><th scope="col">Detail</th><th scope="col">Year</th></tr></thead><tbody>${d.items.map((x) => {
        const href = linkHref(s.ctx, x.link);
        return `<tr><td class="t">${href ? `<a${linkAttrs(href)}>${esc(x.title)}</a>` : esc(x.title)}</td><td class="muted">${esc(x.detail || "")}</td><td>${esc(x.year || "")}</td></tr>`;
      }).join("")}</tbody></table>`, "", alt);
      return wrapSec(sec, `${head(d.heading)}<ul class="list-plain">${d.items.map((x) => {
        const href = linkHref(s.ctx, x.link);
        return `<li><strong>${href ? `<a${linkAttrs(href)}>${esc(x.title)}</a>` : esc(x.title)}</strong>${x.year ? ` <span class="meta">· ${esc(x.year)}</span>` : ""}${x.detail ? `<div class="muted">${esc(x.detail)}</div>` : ""}</li>`;
      }).join("")}</ul>`, "", alt);
    }
    case "skills": {
      const d = sec.data; const groups = d.groups.filter((g) => g.items.length); if (!groups.length) return "";
      return wrapSec(sec, `${head(d.heading)}<div class="skill-groups">${groups.map((g) => `<div>${g.name ? `<h3>${esc(g.name)}</h3>` : ""}<ul class="tags">${g.items.map((i) => `<li class="tag">${esc(i)}</li>`).join("")}</ul></div>`).join("")}</div>`, "", alt);
    }
    case "gallery": {
      const d = sec.data; if (!d.images.length) return "";
      const variant = v(s, sec) || "grid";
      const cls = variant === "masonry" ? "masonry" : variant === "strip" ? "strip" : "grid-g";
      const figs = d.images.map((im, i) => `<figure>${img(s, im, { w: 800, h: variant === "masonry" ? [1000, 700, 900, 800][i % 4] : 800 })}${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ""}</figure>`).join("");
      return wrapSec(sec, `${head(d.heading, d.intro)}<div class="gallery ${cls}">${figs}</div>`, "", alt);
    }
    case "testimonials": {
      const d = sec.data; const items = d.items.filter((x) => x.quote); if (!items.length) return "";
      const variant = v(s, sec) || "cards";
      if (variant === "big") return wrapSec(sec, `${head(d.heading, undefined, { center: true })}<div class="t-big">${items.map((x) => `<figure style="margin:0"><blockquote>“${esc(x.quote)}”</blockquote><figcaption class="cite"><strong>${esc(x.name)}</strong>${x.role ? ` · ${esc(x.role)}` : ""}</figcaption></figure>`).join("")}</div>`, "", alt);
      return wrapSec(sec, `${head(d.heading)}<div class="grid">${items.map((x) => `<figure class="card" style="margin:0"><blockquote>“${esc(x.quote)}”</blockquote><figcaption class="cite"><strong>${esc(x.name)}</strong>${x.role ? `<br>${esc(x.role)}` : ""}</figcaption></figure>`).join("")}</div>`, "", alt);
    }
    case "team": {
      const d = sec.data; if (!d.members.length) return "";
      return wrapSec(sec, `${head(d.heading)}<div class="grid" style="--min:220px">${d.members.map((m) => `<article class="member">${m.image ? `<div class="ph">${img(s, m.image, { w: 600, h: 600, alt: m.name })}</div>` : ""}<h3>${esc(m.name)}</h3><div class="muted">${esc(m.role)}</div>${m.bio ? `<p style="margin-top:.5rem">${esc(m.bio)}</p>` : ""}</article>`).join("")}</div>`, "", alt);
    }
    case "faq": {
      const d = sec.data; if (!d.items.length) return "";
      return wrapSec(sec, `${head(d.heading, undefined, { center: true })}<div class="faq">${d.items.map((x) => `<details><summary>${esc(x.q)}</summary>${paragraphs(x.a)}</details>`).join("")}</div>`, "", alt);
    }
    case "hours": {
      const d = sec.data; if (!d.rows.length) return "";
      const table = `<table class="hours-t"><caption class="sr-only">${esc(d.heading || "Opening hours")}</caption><tbody>${d.rows.map((r) => `<tr><th scope="row">${esc(r.days)}</th><td>${esc(r.hours)}</td></tr>`).join("")}</tbody></table>${d.note ? `<p class="muted" style="margin-top:1rem">${esc(d.note)}</p>` : ""}`;
      return wrapSec(sec, `${head(d.heading)}${v(s, sec) === "card" ? `<div class="form-card" style="max-width:620px">${table}</div>` : table}`, "", alt);
    }
    case "contact": return contact(s, sec, alt);
    case "quote": return quote(s, sec, alt);
    case "cta": {
      const d = sec.data;
      return `<section id="${esc(sec.id)}" class="sec cta"><div class="wrap rv"><div class="cta-band"><h2>${esc(d.heading)}</h2>${d.body ? `<p>${esc(d.body)}</p>` : ""}${d.cta ? `<div class="actions" style="justify-content:center">${btn(s, d.cta, "")}</div>` : ""}</div></div></section>`;
    }
    case "resume": {
      const d = sec.data;
      if (!d.assetId) return "";
      const href = s.ctx.assetUrl(d.assetId) + "?download=1";
      return wrapSec(sec, `<div class="form-card" style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center;justify-content:space-between"><div style="max-width:620px">${d.heading ? `<h2 style="font-size:1.6rem">${esc(d.heading)}</h2>` : ""}${d.body ? `<p class="muted" style="margin:0">${esc(d.body)}</p>` : ""}</div><a class="btn btn-primary" href="${esc(href)}" download>${esc(d.label || "Download CV")}</a></div>`, "", alt);
    }
    case "video": {
      const d = sec.data; if (!d.videoId) return "";
      const src = d.provider === "vimeo" ? `https://player.vimeo.com/video/${encodeURIComponent(d.videoId)}?dnt=1` : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(d.videoId)}`;
      return wrapSec(sec, `${head(d.heading)}<div class="video"><iframe src="${esc(src)}" title="${esc(d.heading || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${d.caption ? `<p class="muted" style="margin-top:.8rem">${esc(d.caption)}</p>` : ""}`, "", alt);
    }
    case "products": return renderProductsSection(s, sec, alt);
    case "collections": return renderCollectionsSection(s, sec, alt);
    case "banner": {
      const d = sec.data; if (!d.text) return "";
      const href = d.link ? linkHref(s.ctx, d.link.href) : null;
      return `<div class="banner" id="${esc(sec.id)}">${esc(d.text)}${href && d.link?.label ? ` <a${linkAttrs(href)}>${esc(d.link.label)}</a>` : ""}</div>`;
    }
  }
  return "";
}

function hero(s: SCtx, sec: Extract<Section, { kind: "hero" }>): string {
  const d = sec.data;
  const variant = v(s, sec) || "split";
  const seed = s.doc.brand.name || "hero";
  const actions = `<div class="actions">${btn(s, d.primaryCta, "btn-primary")}${btn(s, d.secondaryCta, "btn-ghost")}</div>`;
  const eyebrow = d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : "";
  const h1 = `<h1>${esc(d.heading)}</h1>`;
  const sub = d.subheading ? `<p class="sub">${esc(d.subheading)}</p>` : "";
  const text = `${eyebrow}${h1}${sub}${actions}`;
  const id = esc(sec.id);
  const personal = personalHero(s, sec, variant, actions) ?? businessHero(s, sec, variant, actions) ?? premiumHero(s, sec, variant, actions);
  if (personal) return personal;
  switch (variant) {
    case "centered":
      return `<section id="${id}" class="hero centered"><div class="wrap">${text}${d.image ? `<div class="hero-media">${img(s, d.image, { w: 1600, h: 800, eager: true })}</div>` : ""}</div></section>`;
    case "editorial":
      return `<section id="${id}" class="hero editorial"><div class="wrap"><div>${text}</div><div class="hero-media">${img(s, d.image, { w: 900, h: 1200, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "fullbleed":
      return `<section id="${id}" class="hero fullbleed"><div class="bgimg">${img(s, d.image, { w: 1920, h: 1080, eager: true, fallbackSeed: seed })}</div><div class="wrap">${text}</div></section>`;
    case "terminal":
      return `<section id="${id}" class="hero terminal"><div class="wrap"><div class="term"><div class="term-bar" aria-hidden="true"><i></i><i></i><i></i></div><div class="term-body"><div class="prompt" aria-hidden="true">$ whoami</div>${eyebrow}<h1>${esc(d.heading)}<span class="cursor" aria-hidden="true"></span></h1>${sub}${actions}</div></div></div></section>`;
    case "mosaic": {
      const imgs = collectImages(s.doc).slice(0, 4);
      while (imgs.length < 4) imgs.push({ art: `${seed}-${imgs.length}`, alt: "", caption: "" });
      if (d.image) imgs[0] = d.image;
      return `<section id="${id}" class="hero mosaic"><div class="wrap"><div>${text}</div><div class="mosaic-grid">${imgs.map((im, i) => `<figure>${img(s, im, { w: 700, h: 700, eager: i === 0 })}</figure>`).join("")}</div></div></section>`;
    }
    case "stacked":
      return `<section id="${id}" class="hero stacked"><div class="wrap">${text}<div class="hero-media">${img(s, d.image, { w: 2100, h: 800, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "poster":
      return `<section id="${id}" class="hero poster"><div class="wrap"><div>${text}</div><div class="hero-media">${img(s, d.image, { w: 900, h: 900, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "intro": {
      const pic = d.image ? `<span class="pic">${img(s, d.image, { w: 160, h: 160, eager: true })}</span>` : "";
      return `<section id="${id}" class="hero intro"><div class="wrap"><div class="who">${pic}${eyebrow}</div>${h1}${sub}${actions}</div></section>`;
    }
    case "nameplate": {
      const chips = (d.eyebrow || "").split("·").map((x) => x.trim()).filter(Boolean).map((x) => `<span class="chip-s">${esc(x)}</span>`).join("");
      return `<section id="${id}" class="hero nameplate"><div class="wrap">${chips ? `<div class="np-meta">${chips}</div>` : ""}<h1>${esc(s.doc.brand.name || d.heading)}</h1><div class="np-row"><div class="np-photo">${img(s, d.image, { w: 920, h: 1150, eager: true, fallbackSeed: seed })}</div><div><p class="np-line">${esc(d.heading)}</p>${actions}</div></div></div></section>`;
    }
    case "cvhead":
      return `<section id="${id}" class="hero cvhead"><div class="wrap"><div><h1>${esc(s.doc.brand.name || d.heading)}</h1>${d.eyebrow ? `<p class="role">${esc(d.eyebrow)}</p>` : ""}</div><div><p class="statement">${esc(d.heading)}</p>${actions}</div></div></section>`;
    case "panelcard":
      return `<section id="${id}" class="hero panelcard"><div class="wrap"><div class="frame"><div class="pc-copy"><div>${eyebrow}<h1>${esc(s.doc.brand.name || d.heading)}</h1></div><p class="pc-line">${esc(d.heading)}</p>${actions}</div><div class="pc-photo">${img(s, d.image, { w: 800, h: 1000, eager: true, fallbackSeed: seed })}</div></div></div></section>`;
    case "firm":
      return `<section id="${id}" class="hero firm"><div class="firm-grid"><div class="copy"><div>${text}</div></div><div class="media">${img(s, d.image, { w: 1200, h: 1400, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "promise":
      return `<section id="${id}" class="hero promise"><div class="wrap">${text}${d.image ? `<div class="hero-media">${img(s, d.image, { w: 2100, h: 900, eager: true })}</div>` : ""}</div></section>`;
    case "calm":
      return `<section id="${id}" class="hero calm"><div class="wrap">${text}</div>${d.image ? `<div class="calm-media">${img(s, d.image, { w: 2100, h: 900, eager: true })}</div>` : ""}</section>`;
    case "objecthero":
      return `<section id="${id}" class="hero objecthero"><div class="oh-grid"><div class="oh-copy">${text}</div><div class="oh-stage">${img(s, d.image, { w: 900, h: 900, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "sunlit":
      return `<section id="${id}" class="hero sunlit"><div class="sl-img">${img(s, d.image, { w: 1920, h: 1100, eager: true, fallbackSeed: seed })}</div><div class="sl-card">${text}</div></section>`;
    case "wordgrid": {
      const items = (s.ctx.store?.products ?? []).slice(0, 4).map((p) => `<a href="${esc(`${s.ctx.basePath}/product/${encodeURIComponent(p.handle)}`)}">${img(s, p.images[0], { w: 500, h: 500, fallbackSeed: p.title, alt: p.title })}<span>${esc(p.title)}</span></a>`).join("");
      const word = s.doc.brand.name || d.heading;
      // Size the wordmark so its longest word always fits the screen width.
      const longest = Math.max(...word.split(/\s+/).map((w) => w.length), 1);
      return `<section id="${id}" class="hero wordgrid"><div class="wrap"><p class="wg-word" aria-hidden="true" style="font-size:min(14.5vw,${(128 / longest).toFixed(2)}vw,14rem)">${esc(word)}</p><div class="wg-row">${h1}${actions}</div>${items ? `<div class="wg-items">${items}</div>` : ""}</div></section>`;
    }
    case "popstack": {
      const tags = (s.ctx.store?.collections ?? []).slice(0, 4).map((c) => `<span>${esc(c.name)}</span>`).join("");
      return `<section id="${id}" class="hero popstack"><div class="wrap ps-grid"><div>${eyebrow}${h1}${sub}${actions}</div><div class="ps-media">${img(s, d.image, { w: 900, h: 900, eager: true, fallbackSeed: seed })}</div></div>${tags ? `<div class="ps-strip" aria-hidden="true">${tags}</div>` : ""}</section>`;
    }
    case "action": {
      const specs = (s.ctx.store?.collections ?? []).slice(0, 4).map((c) => `<li>${esc(c.name)}</li>`).join("");
      return `<section id="${id}" class="hero action"><div class="ac-img">${img(s, d.image, { w: 1920, h: 1100, eager: true, fallbackSeed: seed })}</div><div class="wrap ac-copy">${eyebrow}${h1}${sub}${actions}</div>${specs ? `<ul class="ac-specs" aria-label="Collections">${specs}</ul>` : ""}</section>`;
    }
    case "tablescape": {
      const menu = (s.ctx.store?.products ?? []).slice(0, 3).map((p) => `<li><a href="${esc(`${s.ctx.basePath}/product/${encodeURIComponent(p.handle)}`)}">${esc(p.title)}</a><span class="ts-dots" aria-hidden="true"></span><span>${esc(formatMoney(p.variants.length ? Math.min(...p.variants.map((v) => v.priceMinor)) : p.priceMinor, p.currency))}</span></li>`).join("");
      return `<section id="${id}" class="hero tablescape"><div class="ts-grid"><div class="ts-media">${img(s, d.image, { w: 1200, h: 1400, eager: true, fallbackSeed: seed })}</div><div class="ts-copy">${eyebrow}${h1}${sub}${menu ? `<ul class="ts-menu">${menu}</ul>` : ""}${actions}</div></div></section>`;
    }
    case "workbench": {
      const pics: (ImageRef | undefined)[] = [d.image, ...(s.ctx.store?.products ?? []).slice(0, 2).map((p) => p.images[0])];
      return `<section id="${id}" class="hero workbench"><div class="wrap wb-grid"><div>${eyebrow}${h1}${sub}${actions}<p class="wb-note"><strong>Made to order</strong>Ask about a commission: sizes, finishes and lead times to suit you.</p></div><div class="wb-pics">${pics.map((im, i) => `<figure class="wb-p${i}">${img(s, im, { w: i ? 600 : 900, h: i ? 600 : 1100, eager: i === 0, fallbackSeed: `${seed}-${i}` })}</figure>`).join("")}</div></div></section>`;
    }
    case "lookbook":
      return `<section id="${id}" class="hero lookbook"><div class="bgimg">${img(s, d.image, { w: 1920, h: 1200, eager: true, fallbackSeed: seed })}</div><div class="wrap">${text}</div></section>`;
    case "statement":
      return `<section id="${id}" class="hero statement"><div class="wrap"><div>${text}</div>${d.image ? `<div class="hero-media">${img(s, d.image, { w: 1400, h: 960, eager: true })}</div>` : ""}</div></section>`;
    case "panel":
      return `<section id="${id}" class="hero panel"><div class="grid2"><div class="media">${img(s, d.image, { w: 1200, h: 1400, eager: true, fallbackSeed: seed })}</div><div class="copy">${text}</div></div></section>`;
    case "room":
      return `<section id="${id}" class="hero room"><div class="wrap"><div class="head"><div>${eyebrow}${h1}</div><div>${sub}${actions}</div></div><div class="hero-media">${img(s, d.image, { w: 2100, h: 900, eager: true, fallbackSeed: seed })}</div></div></section>`;
    case "minimal":
      return `<section id="${id}" class="hero minimal"><div class="wrap">${d.image ? `<div class="avatar">${img(s, d.image, { w: 400, h: 400, eager: true })}</div>` : ""}<div>${text}</div></div></section>`;
    default:
      return `<section id="${id}" class="hero split"><div class="wrap"><div>${text}</div><div class="hero-media">${img(s, d.image, { w: 1100, h: 900, eager: true, fallbackSeed: seed })}</div></div></section>`;
  }
}

function collectImages(doc: SiteDoc): ImageRef[] {
  const out: ImageRef[] = [];
  for (const p of doc.pages) for (const sec of p.sections) {
    if (sec.kind === "gallery") out.push(...sec.data.images);
    if (sec.kind === "projects") for (const it of sec.data.items) out.push(...it.images);
    if (sec.kind === "services") for (const it of sec.data.items) if (it.image) out.push(it.image);
  }
  return out.filter((i) => i.assetId || i.art || i.stock);
}

function services(s: SCtx, sec: Extract<Section, { kind: "services" }>, alt: boolean): string {
  const d = sec.data; if (!d.items.length) return "";
  const variant = v(s, sec) || "grid";
  let body = "";
  if (variant === "list") {
    body = `<div class="services-list">${d.items.map((x) => `<article class="item">${x.image ? img(s, x.image, { w: 144, h: 144, alt: x.title }) : ""}<div><h3 style="margin-bottom:.3rem">${esc(x.title)}</h3><p class="muted" style="margin:0">${esc(x.description)}</p></div>${x.price ? `<div class="price">${esc(x.price)}</div>` : "<div></div>"}</article>`).join("")}</div>`;
  } else if (variant === "numbered") {
    body = `<div class="numbered">${d.items.map((x) => `<article class="row"><h3>${esc(x.title)}</h3><div><p class="muted" style="margin:0">${esc(x.description)}</p>${x.price ? `<p class="price" style="margin-top:.6rem">${esc(x.price)}</p>` : ""}</div></article>`).join("")}</div>`;
  } else if (variant === "menu") {
    body = `<div class="menu">${d.items.map((x) => `<article class="row"><div class="line"><span class="title">${esc(x.title)}</span><span class="dots" aria-hidden="true"></span>${x.price ? `<span class="price">${esc(x.price)}</span>` : ""}</div>${x.description ? `<p class="muted" style="margin:.3rem 0 0">${esc(x.description)}</p>` : ""}</article>`).join("")}</div>`;
  } else {
    body = `<div class="grid">${d.items.map((x) => `<article class="card">${x.image ? `<div class="card-media">${img(s, x.image, { w: 800, h: 500, alt: x.title })}</div>` : ""}<h3>${esc(x.title)}</h3><p class="muted" style="margin:0">${esc(x.description)}</p>${x.price ? `<p class="price" style="margin:.9rem 0 0">${esc(x.price)}</p>` : ""}</article>`).join("")}</div>`;
  }
  return wrapSec(sec, head(d.heading, d.intro, { center: variant === "menu" }) + body, "", alt);
}

function projects(s: SCtx, sec: Extract<Section, { kind: "projects" }>, alt: boolean): string {
  const d = sec.data; if (!d.items.length) return "";
  const variant = v(s, sec) || "cards";
  const tags = (t: string[]) => (t.length ? `<ul class="tags">${t.map((x) => `<li class="tag">${esc(x)}</li>`).join("")}</ul>` : "");
  const linkOf = (x: { link?: string }) => { const h = linkHref(s.ctx, x.link); return h ? `<a class="btn btn-ghost" style="margin-top:1rem"${linkAttrs(h)}>View project<span class="sr-only"> (opens in new tab)</span></a>` : ""; };
  const thumbs = (ims: ImageRef[]) => (ims.length > 1 ? `<div class="thumbs">${ims.slice(1, 6).map((im) => img(s, im, { w: 168, h: 128 })).join("")}</div>` : "");
  let body = "";
  if (variant === "alternating") {
    body = `<div class="proj-alt">${d.items.map((x) => `<article><div class="media">${img(s, x.images[0], { w: 1200, h: 900, fallbackSeed: x.title, alt: x.title })}</div><div><div class="meta">${esc([x.role, x.period].filter(Boolean).join(" · "))}</div><h3 style="font-size:1.6rem">${esc(x.title)}</h3>${paragraphs(x.description)}${tags(x.tags)}${thumbs(x.images)}${linkOf(x)}</div></article>`).join("")}</div>`;
  } else if (variant === "index") {
    body = `<div class="proj-index">${d.items.map((x) => `<article><div><h3 style="margin:0">${esc(x.title)}</h3><div class="meta">${esc([x.role, x.period].filter(Boolean).join(" · "))}</div></div><div>${paragraphs(x.description)}${tags(x.tags)}${x.images.length ? `<div class="thumbs">${x.images.slice(0, 5).map((im) => img(s, im, { w: 168, h: 128 })).join("")}</div>` : ""}</div><div>${linkOf(x)}</div></article>`).join("")}</div>`;
  } else {
    body = `<div class="grid" style="--min:300px">${d.items.map((x) => `<article class="card"><div class="card-media">${img(s, x.images[0], { w: 900, h: 560, fallbackSeed: x.title, alt: x.title })}</div><div class="meta">${esc([x.role, x.period].filter(Boolean).join(" · "))}</div><h3>${esc(x.title)}</h3>${paragraphs(x.description)}${tags(x.tags)}${thumbs(x.images)}${linkOf(x)}</article>`).join("")}</div>`;
  }
  return wrapSec(sec, head(d.heading, d.intro) + body, "", alt);
}

export function mapEmbed(query: string): string {
  if (!query.trim()) return "";
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query.trim())}&output=embed`;
  return `<div class="map"><iframe src="${esc(src)}" title="Map showing ${esc(query)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`;
}

function contactList(s: SCtx): string {
  const c = s.doc.contact;
  const items: string[] = [];
  if (c.phone) items.push(`<li><div><span class="k">Phone</span><a href="tel:${esc(c.phone.replace(/[^+0-9]/g, ""))}">${esc(c.phone)}</a></div></li>`);
  const wa = whatsappLink(c.whatsapp);
  if (wa) items.push(`<li><div><span class="k">WhatsApp</span><a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${esc(c.whatsapp)}</a></div></li>`);
  if (c.email) items.push(`<li><div><span class="k">Email</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div></li>`);
  const addr = [c.address, c.city, c.country].filter(Boolean).join(", ");
  if (addr) items.push(`<li><div><span class="k">Address</span>${esc(addr)}</div></li>`);
  return items.length ? `<ul class="contact-list">${items.join("")}</ul>` : "";
}

function formShell(s: SCtx, kind: "contact" | "quote", fields: string): string {
  return `<form class="f form-card" data-lead="${kind}" novalidate>${fields}<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><label class="check"><input type="checkbox" name="consent" required> <span>I agree that ${esc(s.doc.brand.name || "the site owner")} may use these details to respond to my enquiry.</span></label><div><button class="btn btn-primary" type="submit">${kind === "quote" ? "Request a quote" : "Send message"}</button></div><p class="form-status" role="status" aria-live="polite"></p></form>`;
}

function contact(s: SCtx, sec: Extract<Section, { kind: "contact" }>, alt: boolean): string {
  const d = sec.data;
  const mapQ = s.doc.contact.mapQuery || [s.doc.contact.address, s.doc.contact.city, s.doc.contact.country].filter(Boolean).join(", ");
  const left = `${head(d.heading, d.intro)}${contactList(s)}${socials(s)}${d.showMap ? mapEmbed(mapQ) : ""}`;
  if (!d.showForm) return wrapSec(sec, left, "", alt);
  const fields = `<div class="row2"><label>Your name<input name="name" required maxlength="80" autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="200" autocomplete="email"></label></div><label>Phone (optional)<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>Message<textarea name="message" required maxlength="4000"></textarea></label>`;
  return wrapSec(sec, `<div class="contact-grid"><div>${left}</div>${formShell(s, "contact", fields)}</div>`, "", alt);
}

function quote(s: SCtx, sec: Extract<Section, { kind: "quote" }>, alt: boolean): string {
  const d = sec.data;
  const opts = d.services.filter(Boolean);
  const fields = `<div class="row2"><label>Your name<input name="name" required maxlength="80" autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="200" autocomplete="email"></label></div><div class="row2"><label>Phone<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label>${opts.length ? `<label>Service<select name="service"><option value="">Choose a service</option>${opts.map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>` : `<label>Service needed<input name="service" maxlength="80"></label>`}</div><div class="row2"><label>Budget (optional)<input name="budget" maxlength="60"></label><label>Timeline (optional)<input name="timeline" maxlength="60"></label></div><label>Project details<textarea name="details" required maxlength="4000"></textarea></label>`;
  return wrapSec(sec, `<div class="contact-grid"><div>${head(d.heading, d.intro)}${contactList(s)}</div>${formShell(s, "quote", fields)}</div>`, "", alt);
}

export function socials(s: SCtx): string {
  const list = s.doc.contact.socials
    .map((x) => ({ n: x.network, h: safeHref(x.url) }))
    .filter((x) => x.h && isExternal(x.h));
  if (!list.length) return "";
  return `<div class="socials">${list.map((x) => `<a href="${esc(x.h!)}" target="_blank" rel="noopener noreferrer me">${esc(x.n || new URL(x.h!).hostname)}</a>`).join("")}</div>`;
}
