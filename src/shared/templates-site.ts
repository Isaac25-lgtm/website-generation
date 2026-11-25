import type { TemplateDef } from "./templates";
import type { SiteLayout } from "./render/site-layouts";
import type { Theme } from "./schema";

// Signature personal and business templates. Original designs built on the structure of the
// top-ranked professional sites in the research. No source names, text, images, logos or code.

const VARIANTS: Record<SiteLayout, TemplateDef["variants"]> = {
  intro: { hero: "intro", about: "columns", projects: "index", experience: "table", achievements: "list", footer: "simple" },
  portrait: { hero: "nameplate", about: "split", projects: "alternating", experience: "timeline", footer: "big" },
  cv: { hero: "cvhead", about: "columns", projects: "index", experience: "table", achievements: "list", skills: "tags", footer: "simple" },
  executive: { hero: "panelcard", about: "columns", projects: "index", experience: "table", achievements: "table", footer: "columns" },
  firm: { hero: "firm", services: "numbered", about: "split", footer: "columns" },
  advisory: { hero: "promise", services: "numbered", about: "columns", footer: "columns" },
  studio: { hero: "calm", services: "grid", about: "split", gallery: "masonry", footer: "big" },
  stay: { hero: "lookbook", services: "grid", about: "split", gallery: "strip", footer: "big" },
};

const HEADER: Record<SiteLayout, Theme["headerStyle"]> = {
  intro: "minimal", portrait: "bar", cv: "minimal", executive: "bar", firm: "bar", advisory: "bar", studio: "minimal", stay: "centered",
};

interface Spec {
  id: string; name: string; type: "personal" | "business"; layout: SiteLayout; tier: "public" | "member";
  styles: string[]; industries: string[]; description: string;
  colors: Theme["colors"]; mode?: "light" | "dark"; fontHeading: Theme["fontHeading"]; fontBody: Theme["fontBody"];
  radius?: Theme["radius"]; headingScale?: Theme["headingScale"]; css: string;
}

const S = (x: Spec): TemplateDef => ({
  id: x.id, name: x.name, type: x.type, tier: x.tier, rank: "signature", layout: x.layout,
  styles: x.styles, industries: x.industries, description: x.description,
  theme: {
    mode: x.mode ?? "light", colors: x.colors, fontHeading: x.fontHeading, fontBody: x.fontBody,
    radius: x.radius ?? "sm", density: "airy", headingScale: x.headingScale ?? "lg", animation: "subtle",
    headerStyle: HEADER[x.layout], cardStyle: "flat", ornament: "none",
  },
  variants: VARIANTS[x.layout],
  art: "arcs",
  css: x.css,
});

export const SITE_TEMPLATES: TemplateDef[] = [
  // ───────────── Personal ─────────────
  S({
    id: "p-statement", name: "Statement", type: "personal", layout: "intro", tier: "public",
    styles: ["editorial", "minimalist", "professional"], industries: ["consultant", "advisor", "founder", "executive"],
    description: "One confident sentence in a large serif, a small portrait beside your name, and lots of space. For consultants and founders.",
    colors: { bg: "#f7f5f0", surface: "#eeeae2", text: "#161513", muted: "#5d5952", primary: "#161513", accent: "#9a4a2a" },
    fontHeading: "instrument-serif", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.5rem;font-weight:400}
.hero.intro h1{font-size:clamp(2.4rem,5.8vw,5rem)}
.btn{border-radius:99px}`,
  }),
  S({
    id: "p-prose", name: "Prose", type: "personal", layout: "intro", tier: "member",
    styles: ["editorial", "calm", "writer"], industries: ["writer", "advisor", "editor", "researcher"],
    description: "A newspaper serif on warm white, written like a short letter. For writers, editors and advisors.",
    colors: { bg: "#fbfaf7", surface: "#f0eee8", text: "#1a1d24", muted: "#585e69", primary: "#23395b", accent: "#86673a" },
    fontHeading: "newsreader", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.35rem;font-style:italic}
.hero.intro h1{font-style:italic}
.btn{border-radius:2px}`,
  }),
  S({
    id: "p-marquee", name: "Marquee", type: "personal", layout: "portrait", tier: "public",
    styles: ["bold", "modern", "creative"], industries: ["designer", "freelancer", "marketer", "personal brand"],
    description: "Your name set screen-wide, a portrait beside one clear line, and work shown large. For freelancers and personal brands.",
    colors: { bg: "#f2f1ed", surface: "#e6e4de", text: "#0f0f0f", muted: "#5a5a56", primary: "#0f0f0f", accent: "#d64b25" },
    fontHeading: "inter-tight", fontBody: "inter-tight", radius: "lg", headingScale: "xl",
    css: `.brand{font-weight:700;letter-spacing:-.03em}
.hero.nameplate h1{font-weight:700}
.btn{border-radius:99px}`,
  }),
  S({
    id: "p-spotlight", name: "Spotlight", type: "personal", layout: "portrait", tier: "member",
    styles: ["dark", "bold", "speaker"], industries: ["speaker", "coach", "author", "host"],
    description: "Dark stage, a warm spotlight colour and a big name. Built for speakers, coaches and hosts who get booked.",
    mode: "dark",
    colors: { bg: "#121417", surface: "#1b1e23", text: "#f2f0ea", muted: "#a9a8a2", primary: "#f2c14e", accent: "#f2c14e" },
    fontHeading: "bricolage", fontBody: "inter", radius: "md", headingScale: "xl",
    css: `.brand{font-weight:800;letter-spacing:-.02em}
.hero.nameplate h1{font-weight:800}
.btn{border-radius:99px}`,
  }),
  S({
    id: "p-dossier", name: "Dossier", type: "personal", layout: "cv", tier: "public",
    styles: ["minimal", "cv", "technical"], industries: ["engineer", "developer", "analyst", "product manager"],
    description: "A calm two-column CV: labels on the left, your record on the right. Reads like a well-set résumé.",
    colors: { bg: "#ffffff", surface: "#f4f4f4", text: "#111111", muted: "#5b5b5b", primary: "#111111", accent: "#2b59c3" },
    fontHeading: "space-grotesk", fontBody: "inter", headingScale: "md",
    css: `.brand{font-weight:600;font-size:1rem}
.hero.cvhead .statement{font-family:var(--font-h);font-weight:500;letter-spacing:-.01em}`,
  }),
  S({
    id: "p-ledger", name: "Ledger", type: "personal", layout: "cv", tier: "member",
    styles: ["academic", "classic", "cv"], industries: ["academic", "doctor", "lawyer", "researcher"],
    description: "A classic Caslon CV on cream, with publications and honours set like a printed record. For academics, doctors and lawyers.",
    colors: { bg: "#f8f5ee", surface: "#eee9de", text: "#22201c", muted: "#605b53", primary: "#6b2d1f", accent: "#6b2d1f" },
    fontHeading: "libre-caslon", fontBody: "inter", headingScale: "md",
    css: `.brand{font-family:var(--font-h);font-size:1.15rem}
.hero.cvhead .statement{font-family:var(--font-h);font-style:italic}`,
  }),
  S({
    id: "p-executive", name: "Executive", type: "personal", layout: "executive", tier: "member",
    styles: ["dark", "luxury", "executive"], industries: ["executive", "director", "board member", "creative director"],
    description: "A framed dark panel with your name, role and portrait, and an honours table. For senior leaders with a record to show.",
    mode: "dark",
    colors: { bg: "#141413", surface: "#1c1c1a", text: "#eeebe4", muted: "#a8a499", primary: "#c8a96a", accent: "#c8a96a" },
    fontHeading: "cormorant", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.5rem;letter-spacing:.06em}
.hero.panelcard h1{font-weight:500}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.14em;font-size:.74rem}`,
  }),
  S({
    id: "p-laureate", name: "Laureate", type: "personal", layout: "executive", tier: "member",
    styles: ["classic", "navy", "executive"], industries: ["executive", "academic", "architect", "public figure"],
    description: "Navy and parchment with a Didone headline: a framed introduction, career highlights and a table of honours.",
    colors: { bg: "#f4f2ec", surface: "#ebe7dd", text: "#16203a", muted: "#566073", primary: "#16203a", accent: "#87692f" },
    fontHeading: "bodoni-moda", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.35rem;letter-spacing:.12em;text-transform:uppercase}
.btn{border-radius:0}`,
  }),

  // ───────────── Business ─────────────
  S({
    id: "b-chambers", name: "Chambers", type: "business", layout: "firm", tier: "public",
    styles: ["corporate", "classic", "premium"], industries: ["law", "accounting", "finance", "consulting"],
    description: "Navy and cream, a Caslon headline beside a tall photograph, and numbered practice areas. For law and finance firms.",
    colors: { bg: "#f6f3ec", surface: "#ebe5d8", text: "#13213b", muted: "#54607a", primary: "#13213b", accent: "#94743a" },
    fontHeading: "libre-caslon", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.4rem}
.btn{border-radius:0}`,
  }),
  S({
    id: "b-capital", name: "Capital", type: "business", layout: "firm", tier: "member",
    styles: ["premium", "green", "investment"], industries: ["real estate", "investment", "property", "wealth"],
    description: "Deep green and warm white with a refined serif. For property, investment and wealth firms.",
    colors: { bg: "#fbfaf6", surface: "#eef0ea", text: "#17241d", muted: "#54605a", primary: "#1f4433", accent: "#97753a" },
    fontHeading: "newsreader", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.4rem;color:var(--primary)}
.btn{border-radius:2px}`,
  }),
  S({
    id: "b-counsel", name: "Counsel", type: "business", layout: "advisory", tier: "member",
    styles: ["dark", "luxury", "advisory"], industries: ["advisory", "strategy", "private office", "consulting"],
    description: "A dark page with one large serif promise, values set between hairlines and numbered services. For advisory firms.",
    mode: "dark",
    colors: { bg: "#0f0f0e", surface: "#181817", text: "#f1eee8", muted: "#a6a29a", primary: "#f1eee8", accent: "#b89b6b" },
    fontHeading: "instrument-serif", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.5rem}
.btn{border-radius:99px}`,
  }),
  S({
    id: "b-quorum", name: "Quorum", type: "business", layout: "advisory", tier: "member",
    styles: ["dark", "green", "advisory"], industries: ["financial advice", "family office", "governance", "consulting"],
    description: "Forest green with pale gold and a soft serif. Quiet authority for financial and governance advisers.",
    mode: "dark",
    colors: { bg: "#10201a", surface: "#172a22", text: "#eef1ec", muted: "#a5b3aa", primary: "#d8c9a3", accent: "#d8c9a3" },
    fontHeading: "fraunces", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.45rem;font-weight:400}
.btn{border-radius:2px}`,
  }),
  S({
    id: "b-workshop", name: "Workshop", type: "business", layout: "studio", tier: "public",
    styles: ["craft", "warm", "maker"], industries: ["joinery", "furniture maker", "interior design", "craft studio"],
    description: "A calm cream page, one centred sentence, photographs of work in use and a red \"project in mind?\" card. For makers.",
    colors: { bg: "#f3eee4", surface: "#e9e1d2", text: "#2a211b", muted: "#64584b", primary: "#2a211b", accent: "#a23b26" },
    fontHeading: "fraunces", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.45rem;font-weight:400}
.hero.calm h1 em,.hero.calm h1{font-style:italic}`,
  }),
  S({
    id: "b-bench", name: "Bench", type: "business", layout: "studio", tier: "member",
    styles: ["minimal", "craft", "studio"], industries: ["ceramics", "studio", "workshop", "classes"],
    description: "Clay white and slate blue with an elegant display serif. For ceramic studios, workshops and classes.",
    colors: { bg: "#f5f4f0", surface: "#eae8e1", text: "#1c1c1a", muted: "#5b5a54", primary: "#1c1c1a", accent: "#3f5e78" },
    fontHeading: "instrument-serif", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.6rem}`,
  }),
  S({
    id: "b-retreat", name: "Retreat", type: "business", layout: "stay", tier: "member",
    styles: ["hospitality", "warm", "luxury"], industries: ["boutique hotel", "guesthouse", "retreat", "spa"],
    description: "Full-screen photography, a garamond headline and rooms shown as tall cards. For boutique hotels and retreats.",
    colors: { bg: "#f5f0e7", surface: "#ebe3d4", text: "#2a2620", muted: "#655d51", primary: "#2f5d5a", accent: "#9a6139" },
    fontHeading: "cormorant", fontBody: "jost", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.8rem;letter-spacing:.08em;text-transform:uppercase;font-weight:500}
.nav a{text-transform:uppercase;letter-spacing:.16em;font-size:.74rem}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.16em;font-size:.74rem}`,
  }),
  S({
    id: "b-coast", name: "Coast", type: "business", layout: "stay", tier: "public",
    styles: ["hospitality", "fresh", "coastal"], industries: ["resort", "beach hotel", "villa rental", "travel"],
    description: "White and sea blue, wide light photography and a clean geometric sans. For resorts, villas and beach hotels.",
    colors: { bg: "#ffffff", surface: "#eef3f6", text: "#10263a", muted: "#506378", primary: "#10263a", accent: "#2b7594" },
    fontHeading: "jost", fontBody: "jost", headingScale: "lg",
    css: `.brand{font-weight:500;letter-spacing:.3em;text-transform:uppercase;font-size:1.05rem}
h1,h2{font-weight:400}
.btn{border-radius:99px}`,
  }),
];
