// Personal-site heroes, one per five-star reference site (structure only; no source text, images or code).
// Each hero reads only the customer's own content: name, role, location, tagline, photo, projects, skills, experience.
import type { ImageRef, Section, SiteDoc } from "../schema";
import type { SCtx } from "./sections";
import { img, pageUrl, sectionHref, workHref } from "./sections";
import { esc } from "../util";

type Hero = Extract<Section, { kind: "hero" }>;
type Of<K extends Section["kind"]> = Extract<Section, { kind: K }>;

function secOf<K extends Section["kind"]>(doc: SiteDoc, k: K): Of<K> | undefined {
  for (const p of doc.pages) for (const x of p.sections) if (x.kind === k && !x.hidden) return x as Of<K>;
  return undefined;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const ICONS = [
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c-3 4-3 7 0 10s3 6 0 10M2 12c4-3 7-3 10 0s6 3 10 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h13l-4-5M16 12l-4 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="12" r="2" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z" fill="currentColor"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 7V5h6v2" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
];

/** Renders a personal hero variant, or null when the variant is not one of these. */
export function personalHero(s: SCtx, sec: Hero, variant: string, actions: string): string | null {
  const d = sec.data;
  const id = esc(sec.id);
  const name = s.doc.brand.name || d.heading;
  const plain = name.replace(/^(Dr|Prof)\.?\s+/i, "");
  const [first, ...restParts] = plain.split(/\s+/);
  const last = restParts.join(" ");
  const parts = (d.eyebrow || "").split("·").map((x) => x.trim()).filter(Boolean);
  const role = parts[0] || "";
  const place = parts[1] || "";
  const about = secOf(s.doc, "about");
  const bio = about?.data.body.split(/\n\s*\n/)[0] || "";
  // Business sites have services instead of projects: use them so project-led heroes work for both.
  const work = workHref(s);
  const projects = (secOf(s.doc, "projects")?.data.items ?? []).length ? secOf(s.doc, "projects")!.data.items : (secOf(s.doc, "services")?.data.items ?? []).map((x) => ({ title: x.title, description: x.description, role: x.price, period: "", tags: [] as string[], images: x.image ? [x.image] : [], link: undefined as string | undefined }));
  const skills = (secOf(s.doc, "skills")?.data.groups ?? []).flatMap((g) => g.items).concat((secOf(s.doc, "about")?.data.highlights ?? []));
  const exp = secOf(s.doc, "experience")?.data.items ?? [];
  const gallery = secOf(s.doc, "gallery")?.data.images ?? [];
  const pics: ImageRef[] = [...projects.flatMap((p) => p.images.slice(0, 1)), ...gallery].filter((i) => i.stock || i.assetId);
  const photo = (w: number, h: number, ref: ImageRef | undefined = d.image) => img(s, ref, { w, h, eager: true, fallbackSeed: name });
  const navPages = s.doc.pages.filter((p) => p.inNav);
  const link = (slug: string) => pageUrl(s.ctx, slug);
  const contactHref = navPages.some((p) => p.slug === "contact") ? link("contact") : "#";
  const head = (cls: string, inner: string) => `<section id="${id}" class="hero ${cls}">${inner}</section>`;

  switch (variant) {
    case "sentence":
      return head("sentence", `<div class="wrap"><h1>${esc(d.heading)}</h1>${actions}</div>`);

    case "essay": {
      const row = pics.slice(0, 4).map((im) => `<figure>${img(s, im, { w: 520, h: 650 })}${im.alt ? `<figcaption>${esc(im.alt.toLowerCase())}</figcaption>` : ""}</figure>`).join("");
      return head("essay", `<div class="wrap"><div class="essay-grid"><h1>${esc(name)}</h1><div><p class="lede">${esc(d.heading)}</p>${bio ? `<p class="body">${esc(bio)}</p>` : ""}${parts.length ? `<p class="where"><span class="dot"></span>${esc(parts.join(" · "))}</p>` : ""}${actions}</div></div>${row ? `<div class="snaps">${row}</div>` : ""}</div>`);
    }

    case "chapters": {
      const home = s.doc.pages.find((p) => p.slug === "");
      const entries: string[] = [];
      let n = 0;
      let r = 0;
      for (const x of home?.sections ?? []) {
        if (x.hidden || x.kind === "hero" || x.kind === "cta" || x.kind === "banner") continue;
        const h = (x.data as { heading?: string }).heading;
        if (!h) continue;
        entries.push(`<li><a href="#${esc(x.id)}"><span class="r">${ROMAN[r++] ?? r}.</span><span class="t">${esc(h)}</span><span class="pg">${++n}</span></a></li>`);
        if (x.kind === "projects") for (const it of x.data.items.slice(0, 6)) entries.push(`<li class="sub"><a href="#${esc(x.id)}"><span class="t">${esc(it.title)}</span><span class="pg">${++n}</span></a></li>`);
      }
      for (const p of s.doc.pages.filter((p) => p.slug && p.inNav)) entries.push(`<li><a href="${esc(link(p.slug))}"><span class="r">${ROMAN[r++] ?? r}.</span><span class="t">${esc(p.title)}</span><span class="pg">${++n}</span></a></li>`);
      return head("chapters", `<div class="wrap">${place ? `<p class="kicker">${esc(place)}</p>` : ""}<h1>${esc(name)}</h1>${role ? `<p class="alias">or, ${esc(role)}</p>` : ""}<p class="being">${esc(d.heading)}</p>${d.image ? `<figure class="plate">${photo(560, 680)}</figure>` : ""}${entries.length ? `<ol class="toc">${entries.join("")}</ol>` : ""}${actions}</div>`);
    }

    case "tiles": {
      const t: [string, string][] = [];
      if (about) t.push(["Intro", sectionHref(s, ["about"])]);
      if (projects.length) t.push(["Work", work]);
      for (const p of navPages) if (p.slug && p.slug !== "contact") t.push([p.title, link(p.slug)]);
      if (skills.length) t.push(["Skills", link("experience")]);
      t.push(["Contact", contactHref]);
      const tiles = t.slice(0, 6).map(([l, h], i) => `<a class="hubtile" href="${esc(h)}"><span class="no">0${i + 1}</span>${ICONS[i % ICONS.length]}<span class="lbl">${esc(l)}</span></a>`).join("");
      return head("tilehub", `<div class="wrap"><div class="tgrid"><div class="who">${d.image ? `<div class="pic">${photo(400, 400)}</div>` : ""}<div><h1>${esc(name)}</h1>${role ? `<p>${esc(role)}${place ? ` · ${esc(place)}` : ""}</p>` : ""}</div><p class="tline">${esc(d.heading)}</p></div>${tiles}</div></div>`);
    }

    case "warmbento": {
      const quote = `<div class="card quote"><p>${esc(d.heading)}</p></div>`;
      return head("warmbento", `<div class="wrap"><h1>${esc(plain.toLowerCase())}.</h1><div class="cards"><div class="card bio"><p>${esc(bio || d.subheading)}</p>${actions}</div>${d.image ? `<div class="card pic">${photo(700, 900)}</div>` : ""}${quote}${skills.length ? `<div class="card skills"><span>What I do</span><ul>${skills.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div></div>`);
    }

    case "growth": {
      const words = d.heading.split(/\s+/);
      const swoosh = `<svg class="sw" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15C80 6 170 4 297 9M40 20c70-5 140-6 210-4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
      const h1 = `<span class="first">${esc(words[0] || "")}${swoosh}</span> ${esc(words.slice(1).join(" "))}`;
      return head("growth", `<div class="wrap"><div><h1>${h1}</h1><p class="sub">${esc(bio || d.subheading)}</p>${actions}</div><div class="cut">${photo(800, 960)}</div></div>`);
    }

    case "hello":
      return head("hello", `<div class="wrap"><h1><span class="hi">Hey, I'm ${esc(first)}.</span><span class="line">${esc(d.heading)}</span></h1>${parts.length ? `<p class="now">${esc(parts.join(" · "))}</p>` : ""}${actions}</div>`);

    case "contour": {
      const rings = Array.from({ length: 11 }, (_, i) => `<ellipse cx="${560 + i * 6}" cy="${300 - i * 4}" rx="${70 + i * 46}" ry="${44 + i * 31}" transform="rotate(${-12 + i * 2} 560 300)"/>`).join("");
      return head("contour", `<svg class="topo" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1">${rings}</g></svg><div class="wrap">${parts.length ? `<div class="meta">${parts.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}<div class="grid"><div><h1><span>Hey, I'm</span><span class="accent">${esc(first)}.</span></h1><p class="sub">${esc(d.heading)}</p>${actions}</div>${d.image ? `<div class="cut">${photo(700, 840)}</div>` : ""}</div></div>`);
    }

    case "keynote":
      return head("keynote", `<div class="wrap"><div><h1>Hi, I'm<br><mark>${esc(first)}.</mark></h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="speaker"><div class="pic">${photo(760, 900)}</div><div class="spk"><span class="strap" aria-hidden="true"></span>${role ? `<span class="spk-tag">${esc(role)}</span>` : ""}<strong>${esc(name)}</strong>${place ? `<span class="mono">${esc(place)}</span>` : ""}</div></div></div>`);

    case "creator": {
      const w = d.heading.split(/\s+/);
      const h1 = w.map((x, i) => (i === 0 || (w.length > 3 && i === w.length - 2) ? `<em>${esc(x)}</em>` : esc(x))).join(" ");
      return head("creator", `<div class="wrap"><div><h1>${h1}</h1><p class="sub">${esc(bio || d.subheading)}</p>${actions}</div>${d.image ? `<div class="pic">${photo(760, 900)}</div>` : ""}</div>`);
    }

    case "shapes": {
      const shapes = (pics.length ? pics : d.image ? [d.image] : []).slice(0, 3).map((im, i) => `<div class="sh sh${i}">${img(s, im, { w: 640, h: 640 })}</div>`).join("");
      return head("shapes", `<div class="wrap"><div class="top"><span class="nm">${esc(name)}</span><span class="glyphs" aria-hidden="true"><i class="g0"></i><i class="g1"></i><i class="g2"></i><i class="g3"></i></span></div><h1>${esc(role || name)}</h1><p class="sub">${esc(d.heading)}</p>${shapes ? `<div class="shape-row">${shapes}</div>` : ""}${actions}</div>`);
    }

    case "iconline": {
      const w = d.heading.split(/\s+/);
      const at = new Set([2, 6, 11, 16]);
      let k = 0;
      const h1 = w.map((x, i) => `${esc(x)}${at.has(i) && i < w.length - 1 ? ` <span class="ic">${ICONS[k++ % ICONS.length]}</span>` : ""}`).join(" ");
      return head("iconline", `<div class="wrap">${d.image ? `<div class="pic">${photo(240, 240)}</div>` : ""}<h1>${h1}</h1>${actions}</div>`);
    }

    case "author":
      return head("author", `<div class="wrap"><h1>${esc(d.heading)}</h1><div class="obj">${photo(900, 900)}</div><div class="card">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}<p><strong>${esc(name)}</strong>${d.subheading && d.subheading !== name ? ` — ${esc(d.subheading.replace(`${name}, `, ""))}` : ""}</p>${actions}</div></div>`);

    case "splitname": {
      const corners = navPages.slice(0, 4).map((p, i) => `<a href="${esc(link(p.slug))}"><strong>${esc(p.title)}</strong><span>0${i + 1}</span></a>`).join("");
      return head("splitname", `<div class="wrap"><nav class="corners" aria-label="Sections">${corners}</nav><h1 class="sr-only">${esc(name)}</h1><div class="stage" aria-hidden="true"><span class="n1">${esc(first)}</span><div class="pic">${photo(700, 900)}</div><span class="n2">${esc(last || first)}</span></div><div class="foot"><p>${esc(d.heading)}</p>${actions}</div></div>`);
    }

    case "prologue":
      return head("prologue", `<div class="split"><div class="copy"><span class="label">( ${esc(parts[0] || "Now showing")} )</span><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="media">${photo(1000, 1100)}</div></div>`);

    case "library": {
      const rows = exp.slice(0, 5).map((x) => `<tr><td class="stamp">${esc(x.period)}</td><td>${esc(x.org || x.role)}</td></tr>`);
      while (rows.length < 6) rows.push(`<tr><td></td><td></td></tr>`);
      return head("library", `<div class="wrap"><div class="card"><div class="card-head"><span>This website belongs to</span><strong class="type">${esc(name)}</strong>${role ? `<span>${esc(role)}</span>` : ""}</div><table><thead><tr><th scope="col">Date</th><th scope="col">Issued to</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><div class="copy"><h1>${esc(d.heading)}</h1>${actions}</div></div>`);
    }

    case "poem": {
      const lines = d.heading.split(/(?<=[,.;])\s+/).map(esc).join("<br>");
      return head("poem", `<div class="wrap"><div class="verse"><h1>${lines}</h1><p class="sig">${esc(name)}${role ? `, ${esc(role)}` : ""}</p>${actions}</div><div class="pic">${photo(800, 1000)}</div></div>`);
    }

    case "cinema": {
      const frames = projects.slice(0, 6).map((p, i) => `<a class="frame" href="${esc(work)}">${img(s, p.images[0], { w: 360, h: 240, fallbackSeed: p.title })}<span>0${i + 1} ${esc(p.title)}</span></a>`).join("");
      return head("cinema", `<div class="bgimg">${photo(1920, 1080)}</div><div class="wrap"><div class="title">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}<h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p></div>${frames ? `<div class="strip">${frames}</div>` : ""}</div>`);
    }

    case "gazette": {
      const issue = projects.slice(0, 6).map((p) => `<li>${esc(p.title)}</li>`).join("");
      return head("gazette", `<div class="wrap"><div class="mast"><span>${esc(place || "Portfolio")}</span><h1>${esc(name)}</h1><span>Portfolio edition</span></div><div class="cols"><article class="lead"><h2>${esc(d.heading)}</h2>${role ? `<p class="dek">${esc(role)}</p>` : ""}${bio ? `<p class="body">${esc(bio)}</p>` : ""}${actions}</article>${d.image ? `<figure>${photo(700, 860)}<figcaption>${esc(name)}${place ? `, ${esc(place)}` : ""}</figcaption></figure>` : ""}${issue ? `<aside><h3>In this issue</h3><ol>${issue}</ol></aside>` : ""}</div></div>`);
    }

    case "boarding": {
      const code = (place || "HOME").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
      return head("boarding", `<div class="wrap"><div class="copy"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="pass" role="img" aria-label="${esc(`Boarding pass for ${name}`)}"><div class="main"><span class="lbl">Passenger</span><strong>${esc(name)}</strong><div class="route"><div><span class="lbl">From</span><b>${esc(code)}</b><span>${esc(place)}</span></div><span class="plane" aria-hidden="true">${ICONS[1]}</span><div><span class="lbl">To</span><b>NXT</b><span>Your project</span></div></div><div class="row"><div><span class="lbl">Role</span>${esc(role)}</div><div><span class="lbl">Gate</span>01</div><div><span class="lbl">Seat</span>1A</div></div></div>${skills.length ? `<div class="stub"><span class="lbl">In my bag</span><ul>${skills.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div></div>`);
    }

    case "badge":
      return head("idbadge", `<div class="wrap"><p class="l">${esc(d.heading)}</p><p class="r">${esc(parts.join(" · "))}</p><div class="lanyard" aria-hidden="true"><span class="strap"></span><div class="card">${d.image ? `<div class="pic">${photo(240, 240)}</div>` : ""}<strong>${esc(first)}<br><em>${esc(last)}</em></strong>${role ? `<span>${esc(role)}</span>` : ""}</div></div><h1>${esc(name)}</h1>${actions}</div>`);

    case "deco":
      return head("deco", `<div class="wrap"><div class="frame"><span class="sun" aria-hidden="true"></span>${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}<h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div></div>`);

    case "slides": {
      const lead = projects[0];
      const ref = lead?.images[0] ?? d.image;
      return head("slides", `<div class="bgimg">${photo(1920, 1080, ref)}</div><div class="wrap"><span class="count">01 / ${String(Math.max(projects.length, 1)).padStart(2, "0")}</span><h1>${esc(lead?.title || name)}</h1><p class="sub">${esc(name)}${role ? ` — ${esc(role)}` : ""}</p>${projects.length > 1 ? `<ol class="index">${projects.slice(0, 6).map((p, i) => `<li><a href="${esc(work)}"><span>0${i + 1}</span>${esc(p.title)}</a></li>`).join("")}</ol>` : ""}</div>`);
    }

    case "roles": {
      const pool = [...new Set([role, ...skills, place, ...projects.map((p) => p.role || "")].filter(Boolean))];
      const wall = Array.from({ length: 6 }, () => pool.join("  ")).join("  ");
      return head("roles", `<div class="wall" aria-hidden="true">${esc(wall)}</div><div class="wrap"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p><div class="pillbar"><strong>${esc(name)}</strong>${parts.slice(0, 2).map((x) => `<span>${esc(x)}</span>`).join("")}${actions}</div></div>`);
    }

    case "ohhi":
      return head("ohhi", `<svg class="thread" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 260C150 200 260 300 420 230S700 120 860 210 1080 330 1210 250" fill="none" stroke="currentColor" stroke-width="2"/></svg><div class="wrap"><div class="grid"><div><h1>oh, hi. i'm <em>${esc(first.toLowerCase())}</em>.</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>${d.image ? `<div class="blob"><span class="note">that's me →</span>${photo(520, 520)}</div>` : ""}</div></div>`);

    case "hotspots": {
      const spots: [string, string, number, number][] = [];
      if (about) spots.push(["About", sectionHref(s, ["about"]), 22, 58]);
      if (projects.length) spots.push(["Work", work, 52, 38]);
      for (const p of navPages) if (p.slug && p.slug !== "contact") spots.push([p.title, link(p.slug), 76, 60]);
      spots.push(["Contact", contactHref, 60, 82]);
      const pins = spots.slice(0, 4).map(([l, h, x, y]) => `<a class="spot" href="${esc(h)}" style="left:${x}%;top:${y}%"><i></i><span>${esc(l)}</span></a>`).join("");
      return head("hotspots", `<div class="wrap"><div class="copy"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p></div><div class="scene">${photo(1600, 1000)}${pins}</div></div>`);
    }

    case "landscape":
      return head("landscape", `<div class="scene">${photo(1920, 1000)}</div><div class="wrap">${d.eyebrow ? `<p class="kicker">${esc(d.eyebrow)}</p>` : ""}<h1>${esc(d.heading)}</h1><p class="sub">${esc(name)}</p>${actions}</div>`);

    case "bento": {
      const projTiles = projects.slice(0, 3).map((p) => `<a class="b proj" href="${esc(work)}">${img(s, p.images[0], { w: 600, h: 400, fallbackSeed: p.title })}<span>${esc(p.title)}${p.period ? `<small>${esc(p.period)}</small>` : ""}</span></a>`).join("");
      return head("bento", `<div class="wrap"><div class="bgrid"><div class="b intro"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p></div>${place ? `<div class="b where"><span class="lbl">Based in</span><strong>${esc(place)}</strong></div>` : ""}<div class="b hello">${photo(900, 600)}<span>hello</span></div>${skills.length ? `<div class="b list"><span class="lbl">Services</span><ul>${skills.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}${projTiles}${role ? `<div class="b status"><span class="lbl">Current role</span><strong>${esc(role)}</strong></div>` : ""}<a class="b talk" href="${esc(contactHref)}"><span class="lbl">Let's talk</span><strong>Start a conversation →</strong></a></div></div>`);
    }

    case "champion":
      return head("champion", `<div class="bgimg">${photo(1920, 1200)}</div><div class="wrap">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}<h1>${esc(first)}<br>${esc(last)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);

    case "bookcover":
      return head("bookcover", `<div class="wrap"><div class="book"><span class="bk-mark" aria-hidden="true"></span>${role ? `<span class="kicker">${esc(role)}</span>` : ""}<span class="orn" aria-hidden="true"></span><h1>${esc(d.heading)}</h1>${bio ? `<p class="blurb">${esc(bio.split(/(?<=\.)\s/)[0])}</p>` : ""}<span class="by">${esc(name)}</span></div>${actions}</div>`);
  }
  return null;
}
