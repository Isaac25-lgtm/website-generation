import type { SiteType } from "./pricing";
import type { SectionKind, Theme } from "./schema";
import type { StoreLayout } from "./render/layouts";
import type { SiteLayout } from "./render/site-layouts";
import { SITE_TEMPLATES } from "./templates-site";
import { PERSONAL_TEMPLATES } from "./templates-personal";
import { BUSINESS_TEMPLATES } from "./templates-business";
import { PREMIUM_PERSONAL_TEMPLATES } from "./templates-premium";
import { PREMIUM_BUSINESS_TEMPLATES } from "./templates-business4";
import { STORE2_TEMPLATES } from "./templates-store2";
import { STORE_TEMPLATES } from "./templates-store";

/** Gallery ranking: Signature first, then Premium, then Standard (owner rule, 24 Nov 2026). */
export type TemplateRank = "signature" | "premium" | "standard";

/** E-commerce gallery categories, in tab order. */
export const STORE_CATEGORIES: { key: string; label: string }[] = [
  { key: "fashion", label: "Fashion" }, { key: "menswear", label: "Menswear" }, { key: "bags", label: "Bags" },
  { key: "footwear", label: "Footwear" }, { key: "jewellery", label: "Jewellery" }, { key: "beauty", label: "Beauty" },
  { key: "fragrance", label: "Fragrance" }, { key: "furniture", label: "Furniture" }, { key: "home", label: "Home" },
  { key: "food", label: "Food" }, { key: "drinks", label: "Drinks" }, { key: "coffee", label: "Coffee" },
  { key: "tech", label: "Tech" }, { key: "sport", label: "Sport" }, { key: "kids", label: "Kids" },
  { key: "stationery", label: "Stationery" }, { key: "wellness", label: "Wellness" }, { key: "makers", label: "Makers" },
];

export type ArtStyle = "blobs" | "geo" | "waves" | "grid" | "arcs" | "stripes" | "rings";

export interface TemplateDef {
  id: string;
  name: string;
  type: SiteType;
  /** public = visible to everyone; member = unlocked after signing in */
  tier: "public" | "member";
  styles: string[];
  industries: string[];
  description: string;
  theme: Theme;
  variants: Partial<Record<SectionKind | "footer", string>>;
  art: ArtStyle;
  /** Template-specific CSS layered over the shared base stylesheet. */
  css: string;
  /** Storefront layout family (e-commerce Phase 1 templates). */
  layout?: StoreLayout | SiteLayout;
  /** Gallery category (e-commerce), one of STORE_CATEGORIES. */
  category?: string;
  /** Gallery ranking; defaults to "standard". */
  rank?: TemplateRank;
}

const T = (d: TemplateDef) => d;

export const TEMPLATES: TemplateDef[] = [
  // ───────────────────────────── PERSONAL ─────────────────────────────
  T({
    id: "p-folio", name: "Folio", type: "personal", tier: "public",
    styles: ["editorial", "minimalist"], industries: ["writer", "designer", "consultant"],
    description: "Editorial serif typography, numbered sections and generous margins. For writers, designers and consultants.",
    theme: {
      mode: "light", colors: { bg: "#f6f2ea", surface: "#efe8db", text: "#1c1a17", muted: "#6b645a", primary: "#a8461f", accent: "#2f4a3a" },
      fontHeading: "fraunces", fontBody: "inter", radius: "none", density: "airy", headingScale: "xl",
      animation: "subtle", headerStyle: "minimal", cardStyle: "flat", ornament: "lines",
    },
    variants: { hero: "editorial", about: "columns", projects: "index", experience: "table", footer: "big" },
    art: "arcs",
    css: `
body{counter-reset:sec}
.sec>.wrap>.sec-head h2::before{counter-increment:sec;content:counter(sec,decimal-leading-zero);display:block;font:500 .8rem/1 var(--font-b);letter-spacing:.2em;color:var(--primary-ink);margin-bottom:.9rem}
.sec+.sec{border-top:1px solid var(--border)}
h1,h2{font-weight:400;letter-spacing:-.02em}
.hero h1 em,.hero h1{font-style:italic}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.14em;font-size:.78rem;padding:1rem 1.6rem}
`,
  }),
  T({
    id: "p-kernel", name: "Kernel", type: "personal", tier: "public",
    styles: ["tech", "dark"], industries: ["developer", "engineer", "data"],
    description: "Dark, terminal-inspired portfolio with monospace accents and a command-line hero. Built for developers and data people.",
    theme: {
      mode: "dark", colors: { bg: "#0a0e13", surface: "#111820", text: "#d8e3ee", muted: "#8496a8", primary: "#3cf2a6", accent: "#7aa2ff" },
      fontHeading: "jetbrains-mono", fontBody: "inter", radius: "sm", density: "comfortable", headingScale: "md",
      animation: "subtle", headerStyle: "bar", cardStyle: "outline", ornament: "none",
    },
    variants: { hero: "terminal", projects: "cards", experience: "timeline", skills: "tags" },
    art: "grid",
    css: `
.sec-head h2::before{content:"// ";color:var(--primary-ink)}
.card{background:color-mix(in srgb,var(--surface) 80%,transparent);backdrop-filter:blur(4px)}
.tag{font-family:var(--font-h);font-size:.72rem;border-color:color-mix(in srgb,var(--primary) 40%,transparent);color:var(--primary-ink)}
.btn-primary{box-shadow:0 0 0 1px var(--primary)}
.site-header .brand{font-family:var(--font-h)}
.site-header .brand::before{content:"~/";color:var(--primary-ink);margin-right:2px}
`,
  }),
  T({
    id: "p-scholar", name: "Scholar", type: "personal", tier: "public",
    styles: ["academic", "corporate"], industries: ["researcher", "lecturer", "professional"],
    description: "A calm, sidebar-navigated layout for researchers, lecturers and senior professionals with long CVs.",
    theme: {
      mode: "light", colors: { bg: "#ffffff", surface: "#f4f6fa", text: "#1b2333", muted: "#5b6578", primary: "#1f4fd1", accent: "#b7791f" },
      fontHeading: "libre-baskerville", fontBody: "inter", radius: "sm", density: "comfortable", headingScale: "sm",
      animation: "none", headerStyle: "sidebar", cardStyle: "flat", ornament: "none",
    },
    variants: { hero: "minimal", about: "columns", experience: "table", projects: "index", achievements: "list" },
    art: "rings",
    css: `
.sec{padding-block:calc(var(--space)*.7)}
.sec-head h2{font-size:1.35rem;border-bottom:2px solid var(--primary);padding-bottom:.5rem;display:inline-block}
.hero h1{font-size:clamp(2rem,4vw,2.8rem)}
`,
  }),
  T({
    id: "p-studio", name: "Studio Pop", type: "personal", tier: "member",
    styles: ["bold", "creative"], industries: ["illustrator", "creative", "content creator"],
    description: "Loud colour blocks, chunky outlines and playful tilted cards for creatives who want to be remembered.",
    theme: {
      mode: "light", colors: { bg: "#fff6e0", surface: "#ffffff", text: "#141414", muted: "#4d4a44", primary: "#ff4d2e", accent: "#2e5bff" },
      fontHeading: "archivo-black", fontBody: "dm-sans", radius: "lg", density: "comfortable", headingScale: "xl",
      animation: "lively", headerStyle: "floating", cardStyle: "flat", ornament: "dots",
    },
    variants: { hero: "poster", projects: "cards", testimonials: "big" },
    art: "geo",
    css: `
.card,.btn,.site-header.floating .bar{border:3px solid var(--text)!important;box-shadow:6px 6px 0 var(--text)}
.btn:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--text)}
.grid>.card:nth-child(odd){transform:rotate(-1deg)}.grid>.card:nth-child(even){transform:rotate(1deg)}
h1,h2{text-transform:uppercase;letter-spacing:-.01em}
.sec:nth-of-type(even){background:var(--accent);color:#fff}
.sec:nth-of-type(even) .muted,.sec:nth-of-type(even) p{color:#eef1ff}
.sec:nth-of-type(even) .card{color:var(--text)}
.sec:nth-of-type(even) .card p{color:var(--muted)}
`,
  }),
  T({
    id: "p-lens", name: "Lens", type: "personal", tier: "member",
    styles: ["photography", "dark"], industries: ["photographer", "videographer", "artist"],
    description: "Image-first dark gallery with full-bleed hero and masonry grid. Made for photographers and visual artists.",
    theme: {
      mode: "dark", colors: { bg: "#0d0d0d", surface: "#171717", text: "#f2efe9", muted: "#a39e94", primary: "#f2c46b", accent: "#f2efe9" },
      fontHeading: "cormorant", fontBody: "work-sans", radius: "none", density: "airy", headingScale: "xl",
      animation: "subtle", headerStyle: "centered", cardStyle: "flat", ornament: "none",
    },
    variants: { hero: "fullbleed", gallery: "masonry", projects: "alternating" },
    art: "waves",
    css: `
h1,h2,h3{font-weight:500;letter-spacing:.01em}
.site-header .brand{letter-spacing:.4em;text-transform:uppercase;font-size:.95rem}
.gallery img{filter:saturate(.92)}
.btn{border-radius:0;letter-spacing:.2em;text-transform:uppercase;font-size:.75rem}
`,
  }),
  T({
    id: "p-aura", name: "Aura", type: "personal", tier: "member",
    styles: ["soft", "modern"], industries: ["coach", "speaker", "wellness"],
    description: "Soft lilac tones, frosted cards and rounded shapes for coaches, speakers and wellness professionals.",
    theme: {
      mode: "light", colors: { bg: "#f7f5ff", surface: "#ffffff", text: "#221c3a", muted: "#615a7c", primary: "#7454f6", accent: "#ff7fa6" },
      fontHeading: "outfit", fontBody: "manrope", radius: "xl", density: "airy", headingScale: "lg",
      animation: "lively", headerStyle: "floating", cardStyle: "glass", ornament: "none",
    },
    variants: { hero: "centered", about: "card", testimonials: "big", services: "grid" },
    art: "blobs",
    css: `
.hero h1{color:var(--text);font-weight:600;letter-spacing:-.02em}
.btn-primary{border-radius:999px}
`,
  }),

  // ───────────────────────────── BUSINESS ─────────────────────────────
  T({
    id: "b-meridian", name: "Meridian", type: "business", tier: "public",
    styles: ["corporate", "elegant"], industries: ["law", "finance", "consulting", "real estate"],
    description: "Navy and gold corporate design with confident serif headlines. Suits firms, consultancies and agencies.",
    theme: {
      mode: "light", colors: { bg: "#ffffff", surface: "#f3f5f9", text: "#0f1b33", muted: "#55617a", primary: "#13305f", accent: "#c39a45" },
      fontHeading: "playfair", fontBody: "inter", radius: "sm", density: "comfortable", headingScale: "lg",
      animation: "subtle", headerStyle: "bar", cardStyle: "elevated", ornament: "none",
    },
    variants: { hero: "split", services: "grid", about: "split", testimonials: "cards", footer: "columns" },
    art: "arcs",
    css: `
.sec-head h2::after{content:"";display:block;width:56px;height:3px;background:var(--accent);margin-top:1rem}
.sec-head.center h2::after{margin-inline:auto}
.site-header{border-bottom:1px solid var(--border)}
.card h3{color:var(--primary-ink)}
`,
  }),
  T({
    id: "b-localpro", name: "LocalPro", type: "business", tier: "public",
    styles: ["local-service", "friendly"], industries: ["plumbing", "salon", "repairs", "cleaning", "clinic"],
    description: "Bright, conversion-focused design with big call and WhatsApp buttons. Ideal for local service businesses.",
    theme: {
      mode: "light", colors: { bg: "#ffffff", surface: "#f1f8f4", text: "#11211a", muted: "#4b5d55", primary: "#0d8a4f", accent: "#ffb703" },
      fontHeading: "poppins", fontBody: "inter", radius: "lg", density: "comfortable", headingScale: "md",
      animation: "subtle", headerStyle: "split", cardStyle: "outline", ornament: "dots",
    },
    variants: { hero: "split", services: "list", contact: "split", footer: "columns" },
    art: "geo",
    css: `
.topbar{display:block}
.services-list .item{border-left:4px solid var(--primary)}
.btn-accent{background:var(--accent);color:#111;border-color:var(--accent)}
`,
  }),
  T({
    id: "b-savanna", name: "Savanna", type: "business", tier: "public",
    styles: ["warm", "hospitality"], industries: ["tours", "hotel", "lodge", "events", "agriculture"],
    description: "Warm earth tones, textured backgrounds and large imagery. For tours, hospitality, events and agribusiness.",
    theme: {
      mode: "light", colors: { bg: "#fbf5ec", surface: "#f3e7d6", text: "#2b1d12", muted: "#6e5a48", primary: "#b85a1c", accent: "#2f6b4f" },
      fontHeading: "dm-serif", fontBody: "dm-sans", radius: "md", density: "airy", headingScale: "lg",
      animation: "subtle", headerStyle: "bar", cardStyle: "flat", ornament: "grain",
    },
    variants: { hero: "fullbleed", services: "grid", gallery: "strip", testimonials: "big", footer: "big" },
    art: "waves",
    css: `
.card{background:var(--surface)}
.sec-head .eyebrow{color:var(--accent)}
`,
  }),
  T({
    id: "b-atelier", name: "Atelier", type: "business", tier: "member",
    styles: ["minimalist", "architecture"], industries: ["architecture", "interiors", "studio", "construction"],
    description: "Monochrome grid, numbered services and an asymmetric image mosaic for architects and design studios.",
    theme: {
      mode: "light", colors: { bg: "#f4f4f1", surface: "#ebebe6", text: "#111111", muted: "#5d5d58", primary: "#111111", accent: "#8f846c" },
      fontHeading: "space-grotesk", fontBody: "inter", radius: "none", density: "airy", headingScale: "xl",
      animation: "subtle", headerStyle: "minimal", cardStyle: "flat", ornament: "lines",
    },
    variants: { hero: "mosaic", services: "numbered", projects: "alternating", footer: "simple" },
    art: "stripes",
    css: `
h1{font-weight:500;letter-spacing:-.04em;text-transform:lowercase}
h2{font-weight:500;letter-spacing:-.03em}
.btn{border-radius:0}
`,
  }),
  T({
    id: "b-pulse", name: "Pulse", type: "business", tier: "member",
    styles: ["tech", "dark", "startup"], industries: ["software", "agency", "startup", "IT services"],
    description: "Deep navy, frosted panels and crisp grotesque type for software studios and digital agencies.",
    theme: {
      mode: "dark", colors: { bg: "#070b1a", surface: "#0f1530", text: "#e8ecff", muted: "#97a0c3", primary: "#6d7bff", accent: "#22d3ee" },
      fontHeading: "bricolage", fontBody: "inter", radius: "lg", density: "comfortable", headingScale: "lg",
      animation: "lively", headerStyle: "floating", cardStyle: "glass", ornament: "none",
    },
    variants: { hero: "centered", services: "grid", testimonials: "cards", footer: "columns" },
    art: "rings",
    css: `
.hero{border-bottom:1px solid color-mix(in srgb,var(--text) 10%,transparent)}
.card{border:1px solid color-mix(in srgb,var(--text) 12%,transparent)}
.btn-primary{color:#050816}
`,
  }),
  T({
    id: "b-harvest", name: "Harvest", type: "business", tier: "member",
    styles: ["warm", "restaurant"], industries: ["restaurant", "café", "bakery", "catering"],
    description: "Menu-style service lists with dotted leaders, warm paper tones and prominent opening hours for food businesses.",
    theme: {
      mode: "light", colors: { bg: "#fffaf1", surface: "#f7ecd9", text: "#2a1a12", muted: "#6f5747", primary: "#8c2f1b", accent: "#c9922b" },
      fontHeading: "lora", fontBody: "work-sans", radius: "md", density: "comfortable", headingScale: "lg",
      animation: "subtle", headerStyle: "centered", cardStyle: "outline", ornament: "grain",
    },
    variants: { hero: "stacked", services: "menu", hours: "card", footer: "big" },
    art: "blobs",
    css: `
.sec-head h2{font-style:italic}
.menu .row .title{font-weight:600}
`,
  }),

  // ───────────────────────────── E-COMMERCE ─────────────────────────────
  T({
    id: "e-maison", name: "Maison", type: "ecommerce", tier: "public", category: "fashion", rank: "premium",
    styles: ["fashion", "editorial", "premium"], industries: ["fashion", "lifestyle", "accessories"],
    description: "Editorial fashion storefront with large product imagery, refined serif type and quiet luxury.",
    theme: {
      mode: "light", colors: { bg: "#faf8f5", surface: "#f0ebe4", text: "#161616", muted: "#6a655e", primary: "#161616", accent: "#a98552" },
      fontHeading: "cormorant", fontBody: "inter", radius: "none", density: "airy", headingScale: "xl",
      animation: "subtle", headerStyle: "centered", cardStyle: "flat", ornament: "none",
    },
    variants: { hero: "editorial", products: "large", collections: "tiles", footer: "columns" },
    art: "arcs",
    css: `
h1,h2{font-weight:500}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.18em;font-size:.74rem}
.product-card .p-title{font-family:var(--font-h);font-size:1.15rem}
`,
  }),
  T({
    id: "e-volt", name: "Volt", type: "ecommerce", tier: "public", category: "tech", rank: "standard",
    styles: ["tech", "dark", "product"], industries: ["electronics", "gadgets", "gaming", "accessories"],
    description: "High-contrast dark store with neon accents and spec-forward product cards for electronics and gadgets.",
    theme: {
      mode: "dark", colors: { bg: "#0a0c10", surface: "#13171e", text: "#eef2f7", muted: "#93a0b2", primary: "#00e0a4", accent: "#3d7cff" },
      fontHeading: "space-grotesk", fontBody: "inter", radius: "lg", density: "comfortable", headingScale: "lg",
      animation: "lively", headerStyle: "bar", cardStyle: "outline", ornament: "none",
    },
    variants: { hero: "split", products: "grid", collections: "chips", footer: "columns" },
    art: "grid",
    css: `
.product-card:hover{border-color:var(--primary);box-shadow:0 0 0 1px var(--primary)}
.price{color:var(--primary-ink)}
`,
  }),
  T({
    id: "e-fresh", name: "Market Fresh", type: "ecommerce", tier: "public", category: "food", rank: "standard",
    styles: ["friendly", "local"], industries: ["grocery", "farm produce", "food", "household"],
    description: "Friendly, rounded grocery storefront with compact product tiles, big category chips and clear delivery info.",
    theme: {
      mode: "light", colors: { bg: "#f6fbf3", surface: "#ffffff", text: "#16301b", muted: "#557060", primary: "#2b8a3e", accent: "#ff8a3d" },
      fontHeading: "plus-jakarta", fontBody: "plus-jakarta", radius: "xl", density: "compact", headingScale: "md",
      animation: "subtle", headerStyle: "bar", cardStyle: "elevated", ornament: "dots",
    },
    variants: { hero: "split", products: "compact", collections: "chips", footer: "columns" },
    art: "blobs",
    css: `
.banner{background:var(--accent);color:#1a1a1a}
.product-card{text-align:left}
`,
  }),
  T({
    id: "e-lumiere", name: "Lumière", type: "ecommerce", tier: "member", category: "beauty", rank: "premium",
    styles: ["beauty", "soft", "premium"], industries: ["cosmetics", "skincare", "fragrance", "jewellery"],
    description: "Blush tones, elegant serif and soft glass for beauty, skincare and jewellery brands.",
    theme: {
      mode: "light", colors: { bg: "#fff7f5", surface: "#ffffff", text: "#3a2326", muted: "#7c5f63", primary: "#b85d6c", accent: "#d9a189" },
      fontHeading: "playfair", fontBody: "manrope", radius: "xl", density: "airy", headingScale: "lg",
      animation: "subtle", headerStyle: "centered", cardStyle: "glass", ornament: "none",
    },
    variants: { hero: "centered", products: "large", collections: "tiles", testimonials: "big" },
    art: "rings",
    css: `
h1{font-style:italic;font-weight:500}
.btn-primary{border-radius:999px}
`,
  }),
  T({
    id: "e-craft", name: "Craft & Co", type: "ecommerce", tier: "member", category: "makers", rank: "standard",
    styles: ["artisan", "warm"], industries: ["handmade", "crafts", "home decor", "art prints"],
    description: "Kraft-paper textures, hand-made warmth and story-led product pages for artisans and makers.",
    theme: {
      mode: "light", colors: { bg: "#f3ece0", surface: "#faf6ee", text: "#3b2f22", muted: "#76634d", primary: "#7a4b2a", accent: "#4c6b3c" },
      fontHeading: "fraunces", fontBody: "work-sans", radius: "md", density: "comfortable", headingScale: "lg",
      animation: "subtle", headerStyle: "bar", cardStyle: "outline", ornament: "grain",
    },
    variants: { hero: "stacked", products: "grid", collections: "tiles", about: "split" },
    art: "stripes",
    css: `
.card,.product-card{border-style:dashed}
.sec-head .eyebrow{font-family:var(--font-h);font-style:italic;text-transform:none;letter-spacing:0;font-size:1rem}
`,
  }),
  T({
    id: "e-concrete", name: "Concrete", type: "ecommerce", tier: "member", category: "fashion", rank: "standard",
    styles: ["streetwear", "bold", "brutalist"], industries: ["streetwear", "sneakers", "merch", "music"],
    description: "Brutalist streetwear store: hard borders, acid accent, oversized type and a tight product grid.",
    theme: {
      mode: "light", colors: { bg: "#efefec", surface: "#ffffff", text: "#0a0a0a", muted: "#4a4a46", primary: "#0a0a0a", accent: "#d7ff2f" },
      fontHeading: "syne", fontBody: "space-mono", radius: "none", density: "compact", headingScale: "xl",
      animation: "lively", headerStyle: "split", cardStyle: "outline", ornament: "none",
    },
    variants: { hero: "poster", products: "grid", collections: "chips", footer: "simple" },
    art: "stripes",
    css: `
h1,h2{text-transform:uppercase;font-weight:800;letter-spacing:-.03em}
.card,.product-card,.btn,input,select,textarea{border:2px solid var(--text)!important}
.btn-primary{background:var(--accent);color:#0a0a0a}
.banner{background:var(--text);color:var(--accent)}
`,
  }),
  ...STORE_TEMPLATES,
  ...SITE_TEMPLATES,
  ...PERSONAL_TEMPLATES,
  ...BUSINESS_TEMPLATES,
  ...PREMIUM_PERSONAL_TEMPLATES,
  ...PREMIUM_BUSINESS_TEMPLATES,
  ...STORE2_TEMPLATES,
];

export const TEMPLATE_MAP: Record<string, TemplateDef> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string | undefined, type?: SiteType): TemplateDef {
  const t = id ? TEMPLATE_MAP[id] : undefined;
  if (t && (!type || t.type === type)) return t;
  return TEMPLATES.find((x) => x.type === (type ?? "business"))!;
}

export function templatesFor(type: SiteType, includeMember: boolean): TemplateDef[] {
  return TEMPLATES.filter((t) => t.type === type && (includeMember || t.tier === "public"));
}
