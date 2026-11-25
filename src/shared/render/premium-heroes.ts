// Personal heroes for the four-star ("premium") references. Structure only; nothing copied.
// Inner class names carry a short prefix per hero so they never collide with the base stylesheet.
import type { ImageRef, Section, SiteDoc } from "../schema";
import type { SCtx } from "./sections";
import { img, pageUrl } from "./sections";
import { esc } from "../util";

type Hero = Extract<Section, { kind: "hero" }>;
function secOf<K extends Section["kind"]>(doc: SiteDoc, k: K): Extract<Section, { kind: K }> | undefined {
  for (const p of doc.pages) for (const x of p.sections) if (x.kind === k && !x.hidden) return x as Extract<Section, { kind: K }>;
  return undefined;
}

export function premiumHero(s: SCtx, sec: Hero, variant: string, actions: string): string | null {
  const d = sec.data;
  const id = esc(sec.id);
  const name = s.doc.brand.name || d.heading;
  const plain = name.replace(/^(Dr|Prof)\.?\s+/i, "");
  const [first, ...rest] = plain.split(/\s+/);
  const last = rest.join(" ");
  const parts = (d.eyebrow || "").split("·").map((x) => x.trim()).filter(Boolean);
  const role = parts[0] || "", place = parts[1] || "";
  const about = secOf(s.doc, "about");
  const bio = about?.data.body.split(/\n\s*\n/)[0] || "";
  // Business sites have services instead of projects: use them so project-led heroes work for both.
  const projects = (secOf(s.doc, "projects")?.data.items ?? []).length ? secOf(s.doc, "projects")!.data.items : (secOf(s.doc, "services")?.data.items ?? []).map((x) => ({ title: x.title, description: x.description, role: x.price, period: "", tags: [] as string[], images: x.image ? [x.image] : [], link: undefined as string | undefined }));
  const skills = (secOf(s.doc, "skills")?.data.groups ?? []).flatMap((g) => g.items).concat((secOf(s.doc, "about")?.data.highlights ?? []));
  const exp = secOf(s.doc, "experience")?.data.items ?? [];
  const gallery = secOf(s.doc, "gallery")?.data.images ?? [];
  const pics: ImageRef[] = [...projects.flatMap((p) => p.images.slice(0, 1)), ...gallery].filter((i) => i.stock || i.assetId);
  const photo = (w: number, h: number, ref: ImageRef | undefined = d.image) => img(s, ref, { w, h, eager: true, fallbackSeed: name });
  const pages = s.doc.pages.filter((p) => p.inNav);
  const link = (slug: string) => pageUrl(s.ctx, slug);
  const contact = pages.some((p) => p.slug === "contact") ? link("contact") : "#";
  const H = (cls: string, inner: string) => `<section id="${id}" class="hero ${cls}">${inner}</section>`;
  const initials = (first[0] || "") + (last[0] || "");
  const words = d.heading.split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const li = (xs: string[]) => xs.map((x) => `<li>${esc(x)}</li>`).join("");

  switch (variant) {
    case "desktop": {
      const icons = [["About", about ? `#${about.id}` : contact], ["Work", "#work"], ...pages.filter((p) => p.slug && p.slug !== "contact").map((p) => [p.title, link(p.slug)]), ["Contact", contact]].slice(0, 5);
      return H("desktop", `<div class="dk-screen">${photo(1600, 1000)}<ul class="dk-icons">${icons.map(([l, h]) => `<li><a href="${esc(h)}"><span class="dk-ico" aria-hidden="true"></span>${esc(l)}</a></li>`).join("")}</ul><div class="dk-win" role="group" aria-label="${esc(name)}"><div class="dk-bar"><span>${esc(name)}.txt</span><i aria-hidden="true"></i></div><div class="dk-body"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p>${actions}</div></div><div class="dk-task"><span class="dk-start">Start</span><span>${esc(role)}</span></div></div>`);
    }
    case "globe":
      return H("globe", `<div class="wrap"><div class="gl-copy">${d.eyebrow ? `<span class="eyebrow">${esc(d.eyebrow)}</span>` : ""}<h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="gl-sphere" aria-hidden="true"></div></div>`);
    case "planet":
      return H("planet", `<div class="wrap"><span class="pl-orb" aria-hidden="true"><i></i></span><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    case "nameback": {
      const stats = skills.slice(0, 3).map((x, i) => `<div class="nb-card"><span>0${i + 1}</span>${esc(x)}</div>`).join("");
      return H("nameback", `<div class="wrap"><p class="nb-name" aria-hidden="true">${esc(first)}</p><div class="nb-pic">${photo(760, 900)}</div><div class="nb-copy"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p>${actions}</div>${stats ? `<div class="nb-stats">${stats}</div>` : ""}</div>`);
    }
    case "fullportrait":
      return H("fullportrait", `<div class="bgimg">${photo(1920, 1280)}</div><div class="wrap"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    case "scatter": {
      const sc = pics.slice(0, 6).map((im, i) => `<figure class="sc-${i}">${img(s, im, { w: 420, h: 520 })}</figure>`).join("");
      return H("scatter", `<div class="sc-field" aria-hidden="true">${sc}</div><div class="wrap"><span class="eyebrow">${esc(d.eyebrow || "")}</span><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    }
    case "lockscreen": {
      const notes = projects.slice(0, 3).map((p) => `<div class="ls-note"><b>${esc(p.title)}</b><span>${esc(p.description)}</span></div>`).join("");
      return H("lockscreen", `<div class="wrap"><div class="ls-copy"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="ls-phone" aria-label="Notifications" role="group"><div class="ls-time">${esc(role || "Hello")}</div><div class="ls-date">${esc(place)}</div>${notes}</div></div>`);
    }
    case "levels": {
      const lv = exp.slice(0, 5).map((x, i) => `<li><span class="lv-n">LEVEL ${i + 1}</span><b>${esc(x.role)}</b><span>${esc(x.org || "")} · ${esc(x.period)}</span><i style="--p:${100 - i * 14}%"></i></li>`).join("");
      return H("levels", `<div class="wrap"><div class="lv-head"><span class="lv-tag">PLAYER 1</span><h1>${esc(name)}</h1><p>${esc(d.heading)}</p>${actions}</div>${lv ? `<ol class="lv-list">${lv}</ol>` : ""}</div>`);
    }
    case "playshapes":
      return H("playshapes", `<div class="ps-shapes" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="wrap"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    case "stickies": {
      const notes = [d.heading, bio, ...projects.slice(0, 2).map((p) => p.title), role].filter(Boolean).slice(0, 5);
      return H("stickies", `<div class="wrap"><h1>${esc(name)}</h1><div class="st-board">${notes.map((n, i) => `<div class="st-n st-${i}">${esc(n)}</div>`).join("")}</div>${actions}</div>`);
    }
    case "initials":
      return H("initials", `<div class="wrap"><p class="in-big" aria-hidden="true">${esc(initials)}</p><div class="in-row"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p></div>${actions}</div>`);
    case "ticker": {
      const items = [role, place, ...skills, ...projects.map((p) => p.title)].filter(Boolean);
      const line = items.map((x) => `<span>${esc(x)}</span>`).join("");
      return H("ticker", `<div class="tk-shapes" aria-hidden="true"><i></i><i></i><i></i></div><div class="wrap"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>${items.length ? `<div class="tk-band" aria-hidden="true"><div class="tk-run">${line}${line}</div></div>` : ""}`);
    }
    case "clients": {
      const list = projects.slice(0, 8).map((p) => `<li><a href="#work">${esc(p.title)}</a></li>`).join("");
      return H("clients", `<div class="wrap"><h1 class="cl-intro">${esc(name)} — ${esc(d.heading)}</h1>${list ? `<ul class="cl-list">${list}</ul>` : ""}${actions}</div>`);
    }
    case "swiss":
      return H("swiss", `<div class="wrap"><div class="sw-grid"><h1>${esc(name)}</h1><p class="sw-role">${esc(parts.join(", "))}</p><p class="sw-bio">${esc(bio || d.heading)}</p><div class="sw-act">${actions}</div></div></div>`);
    case "profilegrid": {
      const grid = projects.slice(0, 6).map((p) => `<a class="pg-item" href="#work">${img(s, p.images[0], { w: 600, h: 450, fallbackSeed: p.title })}<span>${esc(p.title)}</span></a>`).join("");
      return H("profilegrid", `<div class="wrap"><aside class="pg-side">${d.image ? `<div class="pg-pic">${photo(240, 240)}</div>` : ""}<h1>${esc(name)}</h1><p>${esc(role)}</p><p class="muted">${esc(d.heading)}</p>${actions}</aside><div class="pg-grid">${grid}</div></div>`);
    }
    case "outline":
      return H("outline", `<div class="wrap"><span class="eyebrow">${esc(d.eyebrow || "")}</span><h1><span>${esc(first)}</span><span class="ol-last">${esc(last)}</span></h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    case "wordmark":
      return H("wordmark", `<div class="wrap"><h1>${esc(name)}</h1><div class="wm-row"><p>${esc(d.heading)}</p>${actions}</div></div>`);
    case "monogram":
      return H("monogram", `<div class="wrap"><span class="mg-mark" aria-hidden="true">${esc(initials)}</span><h1>${esc(name)}</h1><p class="sub"><em>${esc(d.heading)}</em></p>${actions}</div>`);
    case "datelist": {
      const rows = projects.slice(0, 10).map((p) => `<li><span>${esc(p.period || "")}</span><a href="#work">${esc(p.title)}</a></li>`).join("");
      return H("datelist", `<div class="wrap"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p>${rows ? `<ul class="dl-list">${rows}</ul>` : ""}${actions}</div>`);
    }
    case "tripane":
      return H("tripane", `<div class="wrap"><div class="tp-l"><span class="eyebrow">${esc(d.eyebrow || "")}</span><h1>${esc(d.heading)}</h1></div><div class="tp-pic">${photo(700, 900)}</div><div class="tp-r"><p>${esc(bio || name)}</p>${actions}</div></div>`);
    case "resumecard":
      return H("resumecard", `<div class="wrap"><article class="rc-card">${d.image ? `<div class="rc-pic">${photo(240, 240)}</div>` : ""}<h1>${esc(name)}</h1><p class="rc-role">${esc(parts.join(" · "))}</p><p>${esc(d.heading)}</p>${exp.length ? `<ul class="rc-xp">${exp.slice(0, 4).map((x) => `<li><b>${esc(x.role)}</b><span>${esc(x.org || "")}</span><span>${esc(x.period)}</span></li>`).join("")}</ul>` : ""}${actions}</article></div>`);
    case "centeravatar": {
      const tabs = ["All", ...new Set(projects.flatMap((p) => p.tags).slice(0, 4))];
      return H("centeravatar", `<div class="wrap">${d.image ? `<div class="ca-pic">${photo(240, 240)}</div>` : ""}<h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}${tabs.length > 1 ? `<div class="ca-tabs" aria-hidden="true">${tabs.map((t, i) => `<span${i === 0 ? ' class="on"' : ""}>${esc(t)}</span>`).join("")}</div>` : ""}</div>`);
    }
    case "desk":
      return H("desk", `<div class="wrap"><div><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div><div class="dsk-scene">${photo(900, 700)}<span class="dsk-tag" aria-hidden="true">${esc(role)}</span></div></div>`);
    case "editorialname":
      return H("editorialname", `<div class="wrap"><h1>${esc(name)}</h1><div class="en-row"><p>${esc(role)}${place ? `, ${esc(place)}` : ""}</p><p>${esc(d.heading)}</p></div><div class="en-pic">${photo(1600, 800)}</div>${actions}</div>`);
    case "stacked3": {
      const lines = d.heading.split(/(?<=\.)\s+/).filter(Boolean);
      return H("stacked3", `<div class="wrap"><div><h1>${lines.map((l) => `<span>${esc(l)}</span>`).join("")}</h1><p class="sub">${esc(name)}${role ? ` — ${esc(role)}` : ""}</p>${actions}</div>${d.image ? `<div class="s3-pic">${photo(700, 860)}</div>` : ""}</div>`);
    }
    case "mockups": {
      const phones = pics.slice(0, 3).map((im) => `<div class="mk-phone">${img(s, im, { w: 360, h: 760 })}</div>`).join("");
      const h1 = words.map((w, i) => (i >= half ? `<em>${esc(w)}</em>` : esc(w))).join(" ");
      return H("mockups", `<div class="wrap"><h1>${h1}</h1><p class="sub">${esc(name)}${role ? `, ${esc(role)}` : ""}</p>${actions}${phones ? `<div class="mk-row">${phones}</div>` : ""}</div>`);
    }
    case "centername":
      return H("centername", `<div class="wrap"><h1>${esc(name)}</h1><p class="sub">${esc(d.heading)}</p>${actions}</div>`);
    case "photogrid": {
      const grid = pics.slice(0, 9).map((im) => `<figure>${img(s, im, { w: 600, h: 750 })}</figure>`).join("");
      return H("photogrid", `<div class="wrap"><div class="pgr-head"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p></div><div class="pgr-grid">${grid}</div></div>`);
    }
    case "gridpaper":
      return H("gridpaper", `<div class="wrap"><h1>${esc(name)}</h1><p class="gp-bio">${esc(bio || d.heading)}</p>${actions}</div>`);
    case "twotone":
      return H("twotone", `<div class="wrap"><h1>${esc(words.slice(0, half).join(" "))} <span>${esc(words.slice(half).join(" "))}</span></h1><p class="sub">${esc(name)}${role ? ` — ${esc(role)}` : ""}</p>${actions}</div>`);
    case "handnote":
      return H("handnote", `<div class="wrap"><span class="hn-badge">${esc(role || "Available")}</span><h1>${esc(d.heading)}</h1><p class="hn-note">— ${esc(first.toLowerCase())}</p>${actions}</div>`);
    case "chat": {
      const msgs = [`Hi, I'm ${first}.`, d.heading, bio].filter(Boolean).slice(0, 3);
      return H("chat", `<div class="wrap"><div class="ch-win"><div class="ch-bar"><b>${esc(name)}</b><span>${esc(role)}</span></div><div class="ch-body"><h1 class="sr-only">${esc(name)}</h1>${msgs.map((m) => `<p class="ch-msg">${esc(m)}</p>`).join("")}<p class="ch-msg me">Tell me more about your work.</p></div><div class="ch-foot">${actions}</div></div></div>`);
    }
    case "profilesplit":
      return H("profilesplit", `<div class="wrap"><aside class="psp-l">${d.image ? `<div class="psp-pic">${photo(240, 240)}</div>` : ""}<h1>${esc(name)}</h1><p>${esc(role)}</p><ul>${li(skills.slice(0, 5))}</ul>${actions}</aside><div class="psp-r">${projects[0] ? `<span class="eyebrow">Case study</span><h2>${esc(projects[0].title)}</h2><p>${esc(projects[0].description)}</p>${img(s, projects[0].images[0], { w: 1200, h: 800, fallbackSeed: projects[0].title })}` : `<p>${esc(d.heading)}</p>`}</div></div>`);
    case "statementcards": {
      const cards = projects.slice(0, 3).map((p) => `<a class="sc2-card" href="#work">${img(s, p.images[0], { w: 600, h: 720, fallbackSeed: p.title })}<span>${esc(p.title)}</span></a>`).join("");
      return H("statementcards", `<div class="wrap"><h1>${esc(d.heading)}</h1><p class="sub">${esc(name)}${role ? ` — ${esc(role)}` : ""}</p>${actions}${cards ? `<div class="sc2-row">${cards}</div>` : ""}</div>`);
    }
    case "blog": {
      const posts = projects.slice(0, 5).map((p) => `<li><span class="bl-date">${esc(p.period || "")}</span><a href="#work">${esc(p.title)}</a><p>${esc(p.description)}</p></li>`).join("");
      return H("blog", `<div class="wrap"><div class="bl-mast"><h1>${esc(name)}</h1><p>${esc(d.heading)}</p></div>${posts ? `<ol class="bl-list">${posts}</ol>` : ""}${actions}</div>`);
    }
  }
  return null;
}
