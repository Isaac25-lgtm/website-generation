// Business-site heroes, one per five-star business reference (structure only; nothing copied).
import type { Section, SiteDoc } from "../schema";
import type { SCtx } from "./sections";
import { img, pageUrl } from "./sections";
import { esc } from "../util";

type Hero = Extract<Section, { kind: "hero" }>;

function first<K extends Section["kind"]>(doc: SiteDoc, k: K): Extract<Section, { kind: K }> | undefined {
  for (const p of doc.pages) for (const x of p.sections) if (x.kind === k && !x.hidden) return x as Extract<Section, { kind: K }>;
  return undefined;
}

export function businessHero(s: SCtx, sec: Hero, variant: string, actions: string): string | null {
  const d = sec.data;
  const id = esc(sec.id);
  const brand = s.doc.brand.name || d.heading;
  const parts = (d.eyebrow || "").split("·").map((x) => x.trim()).filter(Boolean);
  const services = first(s.doc, "services")?.data.items ?? [];
  const highlights = first(s.doc, "about")?.data.highlights ?? [];
  const c = s.doc.contact;
  const photo = (w: number, h: number) => img(s, d.image, { w, h, eager: true, fallbackSeed: brand });
  const head = (cls: string, inner: string) => `<section id="${id}" class="hero ${cls}">${inner}</section>`;
  const words = d.heading.split(/\s+/);
  const half = Math.ceil(words.length / 2);

  switch (variant) {
    case "skyline": {
      const stats = highlights.slice(0, 5).map((h, i) => `<li><span class="n">${String(i + 1).padStart(2, "0")}</span><span>${esc(h)}</span></li>`).join("");
      return head("skyline", `<div class="bgimg">${photo(1920, 1200)}</div><div class="wrap">${parts[0] ? `<span class="eyebrow">${esc(parts[0])}</span>` : ""}<h1>${esc(words.slice(0, half).join(" "))}<span class="faint"> ${esc(words.slice(half).join(" "))}</span></h1><p class="sub">${esc(d.subheading)}</p>${actions}${c.city ? `<p class="place"><span>${esc(c.country || "")}</span>${esc(c.city)}</p>` : ""}</div>${stats ? `<ul class="stats wrap">${stats}</ul>` : ""}`);
    }
    case "continent":
      return head("continent", `<div class="lines" aria-hidden="true"></div><div class="wrap"><p class="label"><svg viewBox="0 0 120 24" aria-hidden="true"><path d="M2 18C30 4 70 2 118 10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>${esc(parts[0] || brand)}</p><h1>${esc(d.heading)} <span class="grey">${esc(d.subheading)}</span></h1>${actions}</div>`);
    case "coordinates":
      return head("coordinates", `<div class="wrap"><div class="cap"><div><span class="small">${esc(parts[0] || "")}</span><h1>${esc(d.heading)}</h1></div><div class="r"><span class="small">${esc([c.city, c.country].filter(Boolean).join(", "))}</span><strong>${esc(brand)}</strong></div></div><div class="frame">${photo(1920, 1080)}</div><div class="foot"><p>${esc(d.subheading)}</p>${actions}</div></div>`);
    case "studiodark":
      return head("studiodark", `<div class="wrap"><p class="lead">${esc(d.subheading || d.heading)}</p><h1>${words.map(esc).join("<br>")}</h1><div class="row">${actions}<span class="scroll">Scroll to explore</span></div></div>`);
    case "lettering":
      return head("lettering", `<div class="wrap"><p class="mark" aria-hidden="true">${esc(brand)}</p><h1>${esc(d.heading)}</h1>${c.email ? `<p class="reach">Get in touch:</p><a class="mailpill" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}${actions}</div>`);
    case "catalogue": {
      const pills = services.slice(0, 5).map((x) => `<a class="pill" href="${esc(pageUrl(s.ctx, "services"))}">${esc(x.title)}</a>`).join("");
      return head("catalogue", `<div class="wrap"><p class="kicker">${esc(brand)}</p><h1>${esc(d.heading)}</h1>${pills ? `<nav class="pills" aria-label="Services">${pills}</nav>` : ""}</div><div class="wide">${photo(2000, 900)}<div class="cat-card"><strong>${esc(brand)}</strong><p>${esc(d.subheading)}</p>${actions}</div></div>`);
    }
    case "monolith":
      return head("monolith", `<div class="wrap"><p class="word" aria-hidden="true">${esc(brand)}</p><div class="stage"><p class="l">${esc(parts.join(" · "))}</p><div class="obj">${photo(900, 900)}</div><div class="r"><h1>${esc(d.heading)}</h1>${actions}</div></div></div>`);
    case "canal":
      return head("canal", `<div class="split"><div class="copy">${parts[0] ? `<span class="eyebrow">${esc(parts[0])}</span>` : ""}<h1>${esc(d.heading)}</h1><p class="sub">${esc(d.subheading)}</p>${actions}</div><div class="media">${photo(1100, 1400)}</div></div>`);
    case "realwork": {
      const lastN = words.length > 3 ? 2 : 1;
      return head("realwork", `<div class="bgimg">${photo(1920, 1200)}</div><div class="wrap"><h1>${esc(words.slice(0, -lastN).join(" "))}<br><span class="hot">${esc(words.slice(-lastN).join(" "))}</span></h1><div class="panel"><span class="rule" aria-hidden="true"></span><strong>We are ${esc(brand)}</strong><p>${esc(d.subheading)}</p>${actions}</div></div>`);
    }
    case "colorword": {
      const letters = [...brand].map((ch, i) => ch === " " ? " " : `<span class="cw-${i % 5}">${esc(ch)}</span>`).join("");
      return head("colorword", `<div class="wrap"><p class="cw-word" aria-hidden="true">${letters}</p><h1>${esc(d.heading)}</h1>${actions}</div>`);
    }
    case "blueprint": {
      const lines = Array.from({ length: 7 }, (_, i) => `<rect x="${60 + i * 28}" y="${40 + i * 18}" width="${520 - i * 56}" height="${300 - i * 36}" />`).join("");
      return head("blueprint", `<div class="wrap"><div><span class="eyebrow">${esc(d.eyebrow || "")}</span><h1>${esc(d.heading)}</h1><p class="sub">${esc(d.subheading)}</p>${actions}</div><svg class="bp-art" viewBox="0 0 640 380" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">${lines}<path d="M60 340L580 40M60 40l520 300"/><circle cx="320" cy="190" r="120"/></g></svg></div>`);
    }
    case "typeintro": {
      const w = d.heading.split(/\s+/).map((x, i) => `<span style="animation-delay:${(i * 0.12).toFixed(2)}s">${esc(x)}</span>`).join(" ");
      return head("typeintro", `<div class="wrap"><h1>${w}</h1><p class="ti-by">${esc(brand)}</p>${actions}</div>`);
    }
    case "marquee": {
      const run = Array.from({ length: 4 }, () => `<span>${esc(brand)}</span>`).join("");
      const rows = services.slice(0, 6).map((x) => `<tr><th scope="row">${esc(x.title)}</th><td>${esc(x.description)}</td><td>${esc(x.price || "")}</td></tr>`).join("");
      return head("marquee", `<div class="mq-band" aria-hidden="true"><div class="mq-run">${run}${run}</div></div><div class="wrap"><h1>${esc(d.heading)}</h1>${rows ? `<table class="mq-table"><thead><tr><th scope="col">Service</th><th scope="col">What it covers</th><th scope="col">From</th></tr></thead><tbody>${rows}</tbody></table>` : ""}${actions}</div>`);
    }
    case "pixel":
      return head("pixel", `<div class="wrap"><p class="px-word" aria-hidden="true">${esc(brand)}</p><h1>${esc(d.heading)}</h1><p class="sub">${esc(d.subheading)}</p>${actions}</div>`);
    case "contractor":
      return head("contractor", `<div class="bgimg">${photo(1920, 1080)}</div><div class="wrap"><h1>${esc(d.heading)}</h1><p class="sub">${esc(d.subheading)}</p>${actions}</div>`);
  }
  return null;
}
