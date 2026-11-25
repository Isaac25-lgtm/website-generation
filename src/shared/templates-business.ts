import type { TemplateDef } from "./templates";
import type { Theme } from "./schema";

// One Signature business template per five-star business reference (structure only; nothing copied).

interface B {
  id: string; name: string; hero: string; tier?: "public" | "member";
  styles: string[]; industries: string[]; description: string;
  c: [bg: string, surface: string, text: string, muted: string, primary: string, accent: string]; dark?: boolean;
  h: Theme["fontHeading"]; b: Theme["fontBody"]; header?: Theme["headerStyle"]; radius?: Theme["radius"];
  v?: TemplateDef["variants"]; css?: string;
}

const T = (x: B): TemplateDef => ({
  id: x.id, name: x.name, type: "business", tier: x.tier ?? "member", rank: "signature",
  styles: x.styles, industries: x.industries, description: x.description,
  theme: {
    mode: x.dark ? "dark" : "light",
    colors: { bg: x.c[0], surface: x.c[1], text: x.c[2], muted: x.c[3], primary: x.c[4], accent: x.c[5] },
    fontHeading: x.h, fontBody: x.b, radius: x.radius ?? "sm", density: "airy", headingScale: "lg",
    animation: "subtle", headerStyle: x.header ?? "bar", cardStyle: "flat", ornament: "none",
  },
  variants: { services: "grid", about: "split", footer: "columns", ...x.v, hero: x.hero },
  art: "arcs",
  css: x.css ?? "",
});

const tracked = `.nav a{text-transform:uppercase;letter-spacing:.18em;font-size:.68rem}`;

export const BUSINESS_TEMPLATES: TemplateDef[] = [
  T({ id: "b-skyline", name: "Skyline", hero: "skyline", tier: "public", styles: ["luxury", "navy", "real estate"], industries: ["real estate", "property", "private banking"],
    description: "A full-screen city photograph with a two-tone serif headline, a location label and a row of numbered strengths. For premium property firms.",
    c: ["#fbfaf7", "#f0eee8", "#0f1d3a", "#566079", "#14244a", "#a8844e"], h: "playfair", b: "jost", v: { services: "numbered" },
    css: `${tracked}.brand{font-family:var(--font-h);letter-spacing:.22em;text-transform:uppercase;font-size:1.05rem;font-weight:500}.sec-head h2{font-weight:400}` }),
  T({ id: "b-expedition", name: "Expedition", hero: "continent", styles: ["luxury travel", "editorial", "white"], industries: ["luxury travel", "expeditions", "tour operator"],
    description: "White space ruled with fine vertical lines, an italic label and a large uppercase serif paragraph. For luxury travel and expedition companies.",
    c: ["#ffffff", "#f5f5f2", "#1d2430", "#6b7280", "#1d2430", "#d1561a"], h: "cormorant", b: "inter", header: "minimal", v: { services: "grid", gallery: "strip" },
    css: `.about.split .body p,.about p{font-family:var(--font-h);font-style:italic;font-size:1.25rem}.card h3{text-transform:uppercase;font-weight:500;letter-spacing:.04em}` }),
  T({ id: "b-atlas", name: "Atlas", hero: "coordinates", styles: ["photography", "minimal", "architecture"], industries: ["architecture photography", "architects", "photo studio"],
    description: "A thin caption bar with the project, place and studio name above a wide photograph. Pure, photo-led and quiet.",
    c: ["#ffffff", "#f3f3f3", "#141414", "#6b6b6b", "#141414", "#141414"], h: "inter", b: "inter", header: "minimal", v: { gallery: "masonry", services: "list" },
    css: `.brand{font-weight:800;letter-spacing:-.02em;text-transform:lowercase}.sec-head h2{font-weight:400;font-size:1.4rem}` }),
  T({ id: "b-agency", name: "Agency", hero: "studiodark", tier: "public", styles: ["dark", "studio", "bold"], industries: ["design studio", "digital agency", "creative agency"],
    description: "A dark page, one short statement, then your discipline set in enormous type. Services follow as a big numbered list.",
    c: ["#0e0f14", "#171922", "#f1f1ee", "#9a9ca6", "#f1f1ee", "#7a8cff"], dark: true, h: "inter-tight", b: "inter", header: "minimal", v: { services: "numbered", footer: "big" },
    css: `.sec-head h2{font-size:clamp(3rem,9vw,7rem);letter-spacing:-.05em;font-weight:500}` }),
  T({ id: "b-lettering", name: "Lettering", hero: "lettering", styles: ["black", "typographic", "identity"], industries: ["branding studio", "lettering artist", "identity designer"],
    description: "Black page, your name as a huge italic display wordmark, a heavy statement and a green outlined email pill.",
    c: ["#000000", "#111111", "#ffffff", "#a3a3a3", "#ffffff", "#3ddc84"], dark: true, h: "playfair", b: "archivo", header: "bar", v: { gallery: "grid", services: "list" } }),
  T({ id: "b-catalogue", name: "Catalogue", hero: "catalogue", styles: ["calm", "maker", "catalogue"], industries: ["manufacturer", "furniture maker", "materials supplier"],
    description: "A calm cream page with one centred sentence, pill buttons for each product line, a wide photograph and a catalogue request card.",
    c: ["#f2efe8", "#e8e3d8", "#232019", "#64604f", "#232019", "#232019"], h: "manrope", b: "manrope", header: "minimal", radius: "md", v: { gallery: "masonry" },
    css: `.btn{border-radius:99px}` }),
  T({ id: "b-monolith", name: "Monolith", hero: "monolith", styles: ["bold", "studio", "sculptural"], industries: ["architecture studio", "product studio", "design firm"],
    description: "A screen-wide wordmark above a sculptural photograph with one bright blue call to action, and black sections in condensed type.",
    c: ["#ffffff", "#f2f2f2", "#0a0a0a", "#5f5f5f", "#2341f2", "#2341f2"], h: "archivo", b: "inter", header: "floating", v: { services: "numbered" },
    css: `.sec.alt{background:#0a0a0a;color:#f2f2f2}.sec.alt .muted,.sec.alt p{color:#c9c9c9}.sec-head h2{text-transform:uppercase;font-stretch:75%;font-size:clamp(2.4rem,6vw,4.8rem)}` }),
  T({ id: "b-canal", name: "Canal", hero: "canal", styles: ["editorial", "condensed", "red"], industries: ["museum", "education", "tours", "cultural organisation"],
    description: "Narrow condensed titles beside a full-height photograph, with chapters marked by oversized red numerals.",
    c: ["#f4efe6", "#eae3d6", "#1c1a17", "#5f5a50", "#c42a1e", "#c42a1e"], h: "archivo", b: "inter", header: "bar", v: { services: "numbered", gallery: "strip" },
    css: `.numbered .row::before{font:800 3.4rem/1 var(--font-h);color:var(--primary-ink);font-stretch:70%}.sec-head h2{text-transform:uppercase;font-stretch:70%}` }),
  T({ id: "b-realwork", name: "Real Work", hero: "realwork", tier: "public", styles: ["bold", "modern", "services"], industries: ["IT services", "consultancy", "digital agency", "training"],
    description: "A full-width photograph of people at work, a huge two-tone headline and an introduction panel with a short orange rule. Services follow as large dark blocks.",
    c: ["#ffffff", "#f4f4f2", "#0f0f10", "#5c5c5f", "#0f0f10", "#e8590c"], h: "outfit", b: "inter", header: "bar", radius: "md", v: { services: "grid" },
    css: `.sec-head h2{text-transform:uppercase;font-weight:700}.sec-head h2::before{content:"";display:block;width:40px;height:3px;background:var(--accent);margin-bottom:1rem}
.services .card{background:#111!important;color:#fff;border:0;min-height:320px;display:flex;flex-direction:column;justify-content:flex-end}.services .card .muted{color:#cfcfcf}.services .card-media{position:absolute;inset:0;margin:0;aspect-ratio:auto;opacity:.45}.services .card>*{position:relative}.head-actions .btn{border-radius:99px}` }),
  T({ id: "b-contractor", name: "Contractor", hero: "contractor", styles: ["industrial", "bold", "practical"], industries: ["engineering", "construction", "fabrication", "industrial services"],
    description: "A site photograph behind a clear headline and a strong red call button, with the phone number always in view and every service shown with a project photo.",
    c: ["#ffffff", "#f3f4f6", "#121417", "#565b63", "#c8231a", "#e0a800"], h: "manrope", b: "manrope", header: "split", radius: "md", v: { services: "grid", gallery: "grid" },
    css: `.topbar{display:block;background:#121417}.card h3{font-size:1.2rem}` }),
];
