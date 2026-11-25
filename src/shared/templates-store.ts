import type { TemplateDef } from "./templates";
import type { StoreLayout } from "./render/layouts";
import type { Theme } from "./schema";

// Phase 1, batch 1: Signature storefronts (fashion, menswear, jewellery, furniture, home).
// Each template is an original design informed by the structure of top-ranked shop fronts
// (layout, rhythm, type scale). No source names, logos, photos, copy, code or domains are used.

const VARIANTS: Record<StoreLayout, TemplateDef["variants"]> = {
  editorial: { hero: "lookbook", products: "tall", collections: "tiles", about: "split", footer: "columns" },
  quiet: { hero: "statement", products: "quiet", collections: "chips", about: "split", footer: "simple" },
  jewel: { hero: "panel", products: "jewel", collections: "tiles", about: "split", footer: "columns" },
  interiors: { hero: "room", products: "room", collections: "tiles", about: "split", footer: "big" },
  object: { hero: "objecthero", products: "object", collections: "chips", about: "split", footer: "columns" },
  lifestyle: { hero: "sunlit", products: "life", collections: "tiles", about: "split", footer: "big" },
  wordmark: { hero: "wordgrid", products: "hair", collections: "chips", about: "columns", footer: "simple" },
  pop: { hero: "popstack", products: "pop", collections: "chips", about: "split", footer: "big" },
  sport: { hero: "action", products: "tech", collections: "tiles", about: "split", footer: "columns" },
  tabletop: { hero: "tablescape", products: "bottle", collections: "chips", about: "split", footer: "columns" },
  atelier: { hero: "workbench", products: "atelier", collections: "chips", about: "split", footer: "simple" },
};

type C = Theme["colors"];
interface Spec {
  id: string; name: string; category: string; layout: StoreLayout; tier: "public" | "member";
  styles: string[]; industries: string[]; description: string;
  colors: C; mode?: "light" | "dark"; fontHeading: Theme["fontHeading"]; fontBody: Theme["fontBody"];
  headerStyle?: Theme["headerStyle"]; radius?: Theme["radius"]; headingScale?: Theme["headingScale"];
  hero?: string; css: string;
}

const S = (x: Spec): TemplateDef => ({
  id: x.id, name: x.name, type: "ecommerce", tier: x.tier, category: x.category, rank: "signature", layout: x.layout,
  styles: x.styles, industries: x.industries, description: x.description,
  theme: {
    mode: x.mode ?? "light", colors: x.colors, fontHeading: x.fontHeading, fontBody: x.fontBody,
    radius: x.radius ?? "none", density: "airy", headingScale: x.headingScale ?? "lg", animation: "subtle",
    headerStyle: x.headerStyle ?? (x.layout === "editorial" || x.layout === "jewel" ? "centered" : x.layout === "quiet" || x.layout === "wordmark" ? "minimal" : "bar"),
    cardStyle: "flat", ornament: "none",
  },
  variants: { ...VARIANTS[x.layout], ...(x.hero ? { hero: x.hero } : {}) },
  art: "arcs",
  css: x.css,
});

const upperNav = `.nav a,.cart-link{text-transform:uppercase;letter-spacing:.16em!important;font-size:.72rem!important}`;

export { S as storeTemplate };

/** A compact storefront row used by the shop batches: colours are bg, surface, text, muted, primary, accent. */
export type StoreRow = [id: string, name: string, category: string, layout: StoreLayout, rank: "signature" | "premium" | "standard", c: [string, string, string, string, string, string], h: Theme["fontHeading"], b: Theme["fontBody"], description: string, industries: string, x?: Partial<{ dark: boolean; hero: string; css: string; radius: Theme["radius"]; tier: "public" | "member"; header: Theme["headerStyle"] }>];

export function storeRows(rows: StoreRow[]): TemplateDef[] {
  return rows.map(([id, name, category, layout, rank, c, h, b, description, industries, x = {}]) => ({
    ...S({
      id, name, category, layout, tier: x.tier ?? "member",
      styles: [layout, x.dark ? "dark" : "light"], industries: industries.split(", "), description,
      colors: { bg: c[0], surface: c[1], text: c[2], muted: c[3], primary: c[4], accent: c[5] } as C,
      mode: x.dark ? "dark" : "light", fontHeading: h, fontBody: b, headerStyle: x.header, radius: x.radius,
      hero: x.hero, css: x.css ?? "",
    }),
    rank,
  }));
}
export const STORE_TEMPLATES: TemplateDef[] = [
  // ───────────── Fashion (womenswear) ─────────────
  S({
    id: "e-couture", name: "Couture", category: "fashion", layout: "editorial", tier: "public",
    styles: ["editorial", "luxury", "fashion"], industries: ["fashion", "womenswear", "boutique"],
    description: "Ivory and black with a high-contrast Didone wordmark, full-screen lookbook and tall product columns.",
    colors: { bg: "#f7f4ee", surface: "#ece6db", text: "#111111", muted: "#5f5a52", primary: "#111111", accent: "#8a6d3b" },
    fontHeading: "bodoni-moda", fontBody: "inter", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500}
.hero.lookbook h1{font-style:italic;font-size:clamp(2.8rem,6.5vw,5.6rem)}
.product-card .p-title{font-family:var(--font-h);font-size:1.05rem}`,
  }),
  S({
    id: "e-runway", name: "Runway", category: "fashion", layout: "editorial", tier: "member",
    styles: ["bold", "monochrome", "fashion"], industries: ["fashion", "designer label", "concept store"],
    description: "Black and white, condensed capitals set screen-wide over the season's campaign photo.",
    colors: { bg: "#ffffff", surface: "#f1f1f1", text: "#0a0a0a", muted: "#5a5a5a", primary: "#0a0a0a", accent: "#b3122e" },
    fontHeading: "archivo", fontBody: "archivo", headerStyle: "bar", headingScale: "xl",
    css: `${upperNav}
h1,h2,.brand{font-stretch:72%;text-transform:uppercase;letter-spacing:-.005em}
.brand{font-weight:800;font-size:1.5rem}
.hero.lookbook{align-items:flex-end;justify-content:flex-start;text-align:left}
.hero.lookbook h1{font-size:clamp(3rem,9vw,8rem);line-height:.88;max-width:none;font-weight:800;margin-inline:0}
.hero.lookbook .sub,.hero.lookbook .eyebrow{margin-inline:0}
.hero.lookbook .actions{justify-content:flex-start}
.product-card .p-title{text-transform:uppercase;font-size:.82rem;letter-spacing:.04em;font-weight:600}
.lay-editorial .sec-head h2{font-weight:800;letter-spacing:.02em}`,
  }),
  S({
    id: "e-gallery", name: "Gallery", category: "fashion", layout: "editorial", tier: "member",
    styles: ["minimal", "white", "fashion"], industries: ["fashion", "womenswear", "studio label"],
    description: "Pure white space, one centred model photograph and small, exact type. Lets the clothes speak.",
    colors: { bg: "#ffffff", surface: "#f4f4f2", text: "#161616", muted: "#5f5f5f", primary: "#161616", accent: "#74746c" },
    fontHeading: "manrope", fontBody: "manrope", headerStyle: "minimal", hero: "centered", headingScale: "md",
    css: `.brand{font-weight:600;letter-spacing:.02em}
.hero.centered{padding-top:clamp(2rem,4vw,3rem)}
.hero.centered h1{font-weight:500;font-size:clamp(1.8rem,3.4vw,2.8rem);letter-spacing:-.02em}
.hero.centered .hero-media{aspect-ratio:3/4;max-width:520px;border-radius:0}
.hero.centered .btn{border-radius:99px}
.product-card .p-title{font-size:.9rem}`,
  }),
  S({
    id: "e-soiree", name: "Soirée", category: "fashion", layout: "editorial", tier: "member",
    styles: ["romantic", "soft", "fashion"], industries: ["occasionwear", "bridal", "womenswear"],
    description: "Blush and ivory with an italic garamond and widely spaced capitals, for occasion and evening wear.",
    colors: { bg: "#fbf3ef", surface: "#f3e3dc", text: "#2b1f1d", muted: "#6b5853", primary: "#2b1f1d", accent: "#a5645b" },
    fontHeading: "cormorant", fontBody: "jost", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-style:italic;font-size:1.9rem;font-weight:500}
.hero.lookbook h1{font-style:italic;font-weight:500;font-size:clamp(3rem,7vw,6.2rem)}
.btn{text-transform:uppercase;letter-spacing:.2em;font-size:.72rem;font-weight:500}
.product-card .p-title{font-family:var(--font-h);font-size:1.2rem;font-weight:500}`,
  }),
  S({
    id: "e-tailor", name: "Tailor", category: "fashion", layout: "editorial", tier: "member",
    styles: ["tailoring", "warm", "editorial"], industries: ["womenswear", "tailoring", "outerwear"],
    description: "Warm grey with a newspaper serif. A large statement beside the portrait, then a calm product index.",
    colors: { bg: "#eeebe6", surface: "#e2ded7", text: "#1e1c1a", muted: "#5b5650", primary: "#1e1c1a", accent: "#7b5e3c" },
    fontHeading: "newsreader", fontBody: "inter", hero: "editorial", headerStyle: "bar", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.45rem;font-weight:500}
.hero.editorial h1{font-weight:400;font-style:italic;letter-spacing:-.02em}
.hero.editorial .hero-media{border-radius:0}
.hero.editorial .btn{border-radius:0}`,
  }),
  S({
    id: "e-linen", name: "Linen", category: "fashion", layout: "quiet", tier: "member",
    styles: ["natural", "minimal", "calm"], industries: ["linen clothing", "loungewear", "slow fashion"],
    description: "Sand and stone, products on soft grounds and tiny centred captions. Quiet, natural and slow.",
    colors: { bg: "#f2ede4", surface: "#e8e1d5", text: "#2a2620", muted: "#665f53", primary: "#2a2620", accent: "#85735a" },
    fontHeading: "inter-tight", fontBody: "inter-tight", headingScale: "md",
    css: `.brand{font-weight:600;letter-spacing:.06em;text-transform:lowercase;font-size:1.25rem}
.hero.statement h1{font-weight:400}
.btn{border-radius:99px;font-weight:500}`,
  }),
  S({
    id: "e-drape", name: "Drape", category: "fashion", layout: "editorial", tier: "member",
    styles: ["warm", "editorial", "fashion"], industries: ["womenswear", "knitwear", "boutique"],
    description: "Oatmeal and charcoal with a soft old-style serif, left-set lookbook titles and generous columns.",
    colors: { bg: "#efe9df", surface: "#e4dccf", text: "#262422", muted: "#605a53", primary: "#262422", accent: "#8a6a4b" },
    fontHeading: "fraunces", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.6rem;font-weight:400;font-style:italic}
.hero.lookbook{justify-content:flex-start;text-align:left}
.hero.lookbook h1,.hero.lookbook .sub{margin-inline:0}
.hero.lookbook .actions{justify-content:flex-start}
.hero.lookbook h1{font-weight:300;font-size:clamp(2.8rem,6.4vw,5.4rem)}`,
  }),
  S({
    id: "e-velvet", name: "Velvet", category: "fashion", layout: "editorial", tier: "member",
    styles: ["rich", "classic", "fashion"], industries: ["womenswear", "eveningwear", "boutique"],
    description: "Burgundy and ivory with a classic display serif. Rich, confident and made for evening collections.",
    colors: { bg: "#f8f3ec", surface: "#efe4d8", text: "#2a1418", muted: "#684f53", primary: "#6e1a2b", accent: "#9a6b34" },
    fontHeading: "playfair", fontBody: "inter", headingScale: "xl",
    css: `.site-header{border-top:5px solid var(--primary)}
.brand{font-family:var(--font-h);font-size:1.8rem;font-weight:600;color:var(--primary)}
.banner{background:var(--primary);color:var(--on-primary)}
.hero.lookbook h1{font-weight:500}
.lay-editorial .sec-head h2{color:var(--primary)}`,
  }),
  S({
    id: "e-blanc", name: "Neuf", category: "fashion", layout: "quiet", tier: "member",
    styles: ["minimal", "white", "gallery"], industries: ["fashion", "concept store", "design label"],
    description: "White on white with tiny grotesk type and wide letter-spacing. A gallery that happens to sell clothes.",
    colors: { bg: "#ffffff", surface: "#f4f4f4", text: "#111111", muted: "#5e5e5e", primary: "#111111", accent: "#767676" },
    fontHeading: "space-grotesk", fontBody: "space-grotesk", headingScale: "sm",
    css: `body{font-size:.94rem}
.brand{font-size:.92rem;letter-spacing:.34em;text-transform:uppercase;font-weight:500}
.nav a{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase}
.hero.statement h1{font-size:clamp(1.2rem,2vw,1.6rem);text-transform:uppercase;letter-spacing:.08em;font-weight:500}
.btn{border-radius:0;font-weight:500;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase}`,
  }),

  // ───────────── Menswear ─────────────
  S({
    id: "e-plain", name: "Plain", category: "menswear", layout: "quiet", tier: "public",
    styles: ["minimal", "utility", "menswear"], industries: ["menswear", "essentials", "basics"],
    description: "Off-white and navy, products only, set in a precise sans. Everyday menswear without noise.",
    colors: { bg: "#f6f5f1", surface: "#eae9e3", text: "#18202e", muted: "#56606f", primary: "#1b2a4a", accent: "#86683a" },
    fontHeading: "instrument-sans", fontBody: "instrument-sans", headingScale: "md",
    css: `.brand{font-weight:700;letter-spacing:-.01em;font-size:1.3rem}
.hero.statement h1{font-weight:600;letter-spacing:-.02em}
.btn{border-radius:2px}`,
  }),
  S({
    id: "e-savile", name: "Savile", category: "menswear", layout: "editorial", tier: "member",
    styles: ["heritage", "tailoring", "classic"], industries: ["tailoring", "menswear", "outfitter"],
    description: "Bottle green and cream with a classic garamond. Heritage tailoring, cloth details and quiet confidence.",
    colors: { bg: "#f4efe3", surface: "#e9e1d0", text: "#1d2a22", muted: "#535f57", primary: "#1f4a35", accent: "#8e7039" },
    fontHeading: "cormorant", fontBody: "inter", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.75rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--primary)}
.banner{background:var(--primary);color:var(--on-primary)}
.hero.lookbook h1{font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-size:clamp(2.4rem,5.4vw,4.6rem)}
.product-card .p-title{font-family:var(--font-h);font-size:1.15rem;font-weight:600}`,
  }),
  S({
    id: "e-cut", name: "Cut", category: "menswear", layout: "editorial", tier: "member",
    styles: ["dark", "modern", "tailoring"], industries: ["menswear", "tailoring", "streetwear"],
    description: "Charcoal and white, tight grotesk headlines and full-bleed photography. Modern tailoring after dark.",
    mode: "dark",
    colors: { bg: "#1d1d1c", surface: "#292927", text: "#f2f2ef", muted: "#b0afa9", primary: "#f2f2ef", accent: "#c9b28a" },
    fontHeading: "inter-tight", fontBody: "inter-tight", headerStyle: "bar", headingScale: "xl",
    css: `.brand{font-weight:700;letter-spacing:-.03em;font-size:1.5rem}
.hero.lookbook{justify-content:flex-start;text-align:left}
.hero.lookbook h1,.hero.lookbook .sub{margin-inline:0}
.hero.lookbook .actions{justify-content:flex-start}
.hero.lookbook h1{font-weight:700;letter-spacing:-.04em;font-size:clamp(3rem,8vw,7rem);line-height:.92}
.lay-editorial .sec-head{text-align:left;margin-inline:0}
.lay-editorial .sec-head h2{text-transform:none;letter-spacing:-.02em;font-weight:700}`,
  }),

  // ───────────── Jewellery ─────────────
  S({
    id: "e-lustre", name: "Lustre", category: "jewellery", layout: "jewel", tier: "public",
    styles: ["fine jewellery", "luxury", "warm"], industries: ["jewellery", "engagement rings", "goldsmith"],
    description: "Ivory and gold with a refined garamond. Macro photography beside a calm panel, and a second photo on hover.",
    colors: { bg: "#faf7f1", surface: "#f1ebe0", text: "#231f1a", muted: "#675f55", primary: "#231f1a", accent: "#9a7535" },
    fontHeading: "cormorant", fontBody: "inter", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.9rem;font-weight:500;letter-spacing:.1em}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;font-weight:500}
.hero.panel h1{font-style:italic}`,
  }),
  S({
    id: "e-heirloom", name: "Heirloom", category: "jewellery", layout: "jewel", tier: "member",
    styles: ["dark", "heritage", "fine jewellery"], industries: ["jewellery", "antique jewellery", "silversmith"],
    description: "Deep green with silver, set in a bookish Caslon. Made for heirloom, antique and silver pieces.",
    mode: "dark",
    colors: { bg: "#13221c", surface: "#1b2e26", text: "#eef0ec", muted: "#a8b4ac", primary: "#d9dcd6", accent: "#b9c0b8" },
    fontHeading: "libre-caslon", fontBody: "inter", headingScale: "lg",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.6rem;font-style:italic}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem}
.lay-jewel .products-jewel .ph{background:#0f1b16}`,
  }),
  S({
    id: "e-prestige", name: "Prestige", category: "jewellery", layout: "jewel", tier: "member",
    styles: ["luxury", "white", "high jewellery"], industries: ["high jewellery", "diamonds", "watches"],
    description: "White and platinum with a sharp Didone. The restraint of a high-jewellery salon.",
    colors: { bg: "#ffffff", surface: "#f3f3f1", text: "#141414", muted: "#5f5f5f", primary: "#141414", accent: "#86867f" },
    fontHeading: "bodoni-moda", fontBody: "inter", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.6rem;letter-spacing:.42em;text-transform:uppercase;font-weight:400}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.2em;font-size:.7rem;font-weight:500}
.hero.panel .copy{background:var(--bg)}`,
  }),
  S({
    id: "e-facet", name: "Facet", category: "jewellery", layout: "jewel", tier: "member",
    styles: ["soft", "modern", "jewellery"], industries: ["demi-fine jewellery", "gifts", "jewellery studio"],
    description: "Blush and gold with a friendly soft serif. Demi-fine jewellery that feels personal and giftable.",
    colors: { bg: "#fbf1ee", surface: "#f4e1db", text: "#3a2626", muted: "#735957", primary: "#3a2626", accent: "#9c7134" },
    fontHeading: "fraunces", fontBody: "dm-sans", radius: "md", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.7rem;font-weight:400}
.btn{border-radius:99px}
.hero.panel .copy{background:var(--surface)}
.lay-jewel .products-jewel .ph{border-radius:var(--radius-sm)}`,
  }),
  S({
    id: "e-gilded", name: "Gilded", category: "jewellery", layout: "jewel", tier: "member",
    styles: ["dark", "gold", "statement"], industries: ["gold jewellery", "statement pieces", "jeweller"],
    description: "Amber gold on ink, a hairline geometric wordmark and dark product grounds. Gold looks its best here.",
    mode: "dark",
    colors: { bg: "#15130f", surface: "#201c16", text: "#f3ead8", muted: "#b8ac94", primary: "#d6a54a", accent: "#d6a54a" },
    fontHeading: "jost", fontBody: "jost", headingScale: "lg",
    css: `.brand{font-weight:300;letter-spacing:.55em;text-transform:uppercase;font-size:1.05rem}
h1,h2{font-weight:300;letter-spacing:.02em}
.nav a{text-transform:uppercase;letter-spacing:.2em;font-size:.72rem;font-weight:400}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.22em;font-size:.7rem;font-weight:400}
.lay-jewel .products-jewel .ph{background:#0e0c09}`,
  }),

  // ───────────── Furniture ─────────────
  S({
    id: "e-loft", name: "Loft", category: "furniture", layout: "interiors", tier: "public",
    styles: ["industrial", "modern", "furniture"], industries: ["furniture", "workshop", "design store"],
    description: "Concrete and oak, a tight grotesk and room-set photography. For furniture makers and design stores.",
    colors: { bg: "#e9e7e3", surface: "#dcd9d3", text: "#1c1b19", muted: "#57544e", primary: "#1c1b19", accent: "#8a5f37" },
    fontHeading: "inter-tight", fontBody: "inter-tight", headingScale: "xl",
    css: `.brand{font-weight:700;letter-spacing:-.02em;font-size:1.35rem}
.hero.room h1{font-weight:600;letter-spacing:-.04em}
.lay-interiors .sec-head h2,.lay-interiors .product-card .p-title,.lay-interiors .tile span{font-weight:600;letter-spacing:-.02em}
.btn{border-radius:2px}`,
  }),
  S({
    id: "e-modular", name: "Modular", category: "furniture", layout: "interiors", tier: "member",
    styles: ["warm", "modern", "furniture"], industries: ["furniture", "sofas", "storage"],
    description: "Warm white with a terracotta accent and rounded details. Modern furniture for real homes.",
    colors: { bg: "#fbf9f5", surface: "#f1ece4", text: "#1f1d1a", muted: "#605b54", primary: "#1f1d1a", accent: "#b0532b" },
    fontHeading: "manrope", fontBody: "manrope", radius: "lg", headingScale: "lg",
    css: `.brand{font-weight:800;letter-spacing:-.02em;font-size:1.35rem}
.brand::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--accent);margin-left:2px}
.hero.room h1{font-weight:700;letter-spacing:-.03em}
.lay-interiors .sec-head h2,.lay-interiors .product-card .p-title{font-weight:700;letter-spacing:-.02em}
.btn{border-radius:99px}`,
  }),
  S({
    id: "e-terrace", name: "Terrace", category: "furniture", layout: "interiors", tier: "member",
    styles: ["outdoor", "natural", "warm"], industries: ["outdoor furniture", "garden", "terrace"],
    description: "Stone and olive with a soft serif. Outdoor living, long tables and slow summer evenings.",
    colors: { bg: "#f0ece3", surface: "#e3dccd", text: "#2b2a22", muted: "#615e51", primary: "#4b562b", accent: "#9a5e36" },
    fontHeading: "fraunces", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.6rem;font-weight:400;color:var(--primary)}
.hero.room h1{font-weight:300}
.btn{border-radius:99px}`,
  }),
  S({
    id: "e-pavilion", name: "Pavilion", category: "furniture", layout: "interiors", tier: "member",
    styles: ["architectural", "minimal", "white"], industries: ["design furniture", "lighting", "architecture"],
    description: "Architectural white, hairline rules and an engineered grotesk. Design pieces presented like a catalogue.",
    colors: { bg: "#fafafa", surface: "#efefef", text: "#121212", muted: "#5b5b5b", primary: "#121212", accent: "#6b6b6b" },
    fontHeading: "space-grotesk", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-weight:600;text-transform:uppercase;letter-spacing:.2em;font-size:1rem}
.hero.room h1{font-weight:500;letter-spacing:-.03em}
.lay-interiors .products-room .ph,.lay-interiors .tile img{border-radius:0}
.lay-interiors .product-card{border-top:1px solid var(--text)!important;padding-top:.75rem}
.lay-interiors .product-card .p-title{font-family:var(--font-h);font-weight:500;font-size:1rem}
.btn{border-radius:0}`,
  }),

  // ───────────── Home & interiors ─────────────
  S({
    id: "e-estate", name: "Estate", category: "home", layout: "interiors", tier: "public",
    styles: ["classic", "warm", "interiors"], industries: ["homeware", "interiors", "antiques"],
    description: "Linen and walnut with a classic garamond. Country-house interiors, ceramics and textiles.",
    colors: { bg: "#f5f0e8", surface: "#ebe3d6", text: "#2d241c", muted: "#685c4f", primary: "#5a3d28", accent: "#8f6d45" },
    fontHeading: "cormorant", fontBody: "inter", headingScale: "xl",
    css: `${upperNav}
.brand{font-family:var(--font-h);font-size:1.8rem;font-weight:600;letter-spacing:.06em;color:var(--primary)}
.hero.room h1{font-weight:500;font-style:italic}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.16em;font-size:.74rem}`,
  }),
  S({
    id: "e-joinery", name: "Joinery", category: "home", layout: "interiors", tier: "member",
    styles: ["craft", "kitchen", "warm"], industries: ["kitchens", "joinery", "homeware"],
    description: "Oak and brass with a newspaper serif. Kitchens, joinery and the objects that live on the shelves.",
    colors: { bg: "#f7f3ec", surface: "#ece4d6", text: "#1f1b16", muted: "#5d564c", primary: "#1f1b16", accent: "#94742f" },
    fontHeading: "newsreader", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.55rem;font-weight:500}
.hero.room h1{font-weight:400;letter-spacing:-.02em}
.hero.room h1::first-letter{color:var(--accent)}
.btn{border-radius:2px}`,
  }),
  S({
    id: "e-lumen", name: "Lumen", category: "home", layout: "interiors", tier: "member",
    styles: ["dark", "warm", "lighting"], industries: ["lighting", "lamps", "homeware"],
    description: "Warm dark rooms lit by amber light, with an elegant display serif. Built for lighting shops.",
    mode: "dark",
    colors: { bg: "#1c1712", surface: "#262019", text: "#f4ecdf", muted: "#bdaf98", primary: "#e8b86a", accent: "#e8b86a" },
    fontHeading: "instrument-serif", fontBody: "inter", headingScale: "xl",
    css: `.brand{font-family:var(--font-h);font-size:1.8rem;font-style:italic}
.hero.room h1{font-size:clamp(2.8rem,6.5vw,5.6rem);line-height:1}
.lay-interiors .products-room .ph{background:#120e0a}
.btn{border-radius:99px}`,
  }),
  S({
    id: "e-weave", name: "Weave", category: "home", layout: "interiors", tier: "member",
    styles: ["textile", "warm", "craft"], industries: ["rugs", "textiles", "cushions", "homeware"],
    description: "Madder red and wool tones with a bookish Caslon. Rugs, cushions and hand-made textiles.",
    colors: { bg: "#f3ebe1", surface: "#e8dccb", text: "#2f211a", muted: "#6a5748", primary: "#8a3b24", accent: "#3d5a4a" },
    fontHeading: "libre-caslon", fontBody: "inter", headingScale: "lg",
    css: `.brand{font-family:var(--font-h);font-size:1.6rem;color:var(--primary)}
.site-header{border-bottom:3px double var(--border)!important}
.hero.room h1{font-style:italic}
.btn{border-radius:0}`,
  }),
];
