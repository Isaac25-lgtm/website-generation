import type { TemplateDef } from "./templates";
import type { Theme } from "./schema";

// Premium business templates: one per four-star business reference (structure only; nothing copied).

type Pal = [bg: string, surface: string, text: string, muted: string, primary: string, accent: string];
type X = Partial<{ dark: boolean; v: TemplateDef["variants"]; css: string; radius: Theme["radius"]; tier: "public" | "member" }>;
type Row = [id: string, name: string, hero: string, pal: Pal, h: Theme["fontHeading"], b: Theme["fontBody"], header: Theme["headerStyle"], description: string, industries: string, x?: X];

const W: Pal = ["#ffffff", "#f3f3f1", "#141414", "#5e5e5b", "#141414", "#141414"];
const D: Pal = ["#0d0d0f", "#17171a", "#f1f1ee", "#a6a6a2", "#f1f1ee", "#f1f1ee"];

const ROWS: Row[] = [
  ["b-colorword", "Colourword", "colorword", W, "archivo", "inter", "bar", "Your name as a giant multicolour wordmark with one clear line about what you do.", "brand agency, design studio", { tier: "public" }],
  ["b-ragged", "Ragged", "champion", ["#0f0f10", "#19191b", "#f3f3f0", "#a8a8a3", "#ff5b2e", "#ff5b2e"], "archivo", "inter", "bar", "A bold full-bleed photograph with your name in huge condensed capitals.", "branding agency, production company", { dark: true }],
  ["b-blueprint", "Blueprint", "blueprint", ["#f5f8fc", "#e8eef7", "#0d2b52", "#4f6584", "#0d2b52", "#2f6fed"], "space-grotesk", "inter", "bar", "Navy blueprint paper with fine line drawings and a calm, technical statement.", "finance, engineering, infrastructure"],
  ["b-typeintro", "Type Intro", "typeintro", ["#fbfaf7", "#f1efe9", "#161513", "#5f5c55", "#161513", "#161513"], "instrument-serif", "inter", "minimal", "A minimal page where your sentence appears word by word in a fine serif.", "design collective, studio, consultancy"],
  ["b-bigword", "Big Word", "wordmark", W, "inter-tight", "inter", "minimal", "Your name set huge in black on white, with one line and nothing else.", "design studio, architecture firm", { tier: "public" }],
  ["b-headline", "Headline", "statementcards", ["#f6f5f2", "#ebe9e4", "#121212", "#5c5b57", "#121212", "#121212"], "archivo", "inter", "bar", "A big headline over large work tiles. Bold, direct and portfolio-led.", "design studio, agency"],
  ["b-dark3d", "Dark Object", "monolith", ["#0b0b0d", "#151518", "#f0f0ec", "#a2a29d", "#ff4f1f", "#ff4f1f"], "archivo", "inter", "floating", "Dark and bold: a huge wordmark above a single sculptural object photograph.", "design studio, 3D studio, product studio", { dark: true }],
  ["b-marquee", "Marquee", "marquee", W, "inter-tight", "inter", "bar", "A giant scrolling marquee of your name, then a tidy table of services and prices.", "design studio, agency, consultancy"],
  ["b-pixel", "Pixel", "pixel", ["#f7f5ef", "#ece8dc", "#1b1a17", "#605d55", "#1f4d3a", "#1f4d3a"], "space-mono", "inter", "minimal", "A pixel-cut wordmark in deep green: playful, yet calm and premium.", "family office, investment firm, holding company"],
  ["b-alpine", "Alpine", "skyline", ["#f4f6f5", "#e7ecea", "#152420", "#55645f", "#1f3b33", "#a8844e"], "cormorant", "jost", "bar", "Architecture set against mountains, a two-tone serif headline and numbered strengths.", "resort, real estate, hospitality development"],
  ["b-orbit", "Orbit", "canal", ["#0b0e14", "#141924", "#eef1f6", "#9ba4b5", "#eef1f6", "#7aa7ff"], "archivo", "inter", "bar", "Condensed headlines beside full-height imagery, with lots of dark space.", "aerospace, space technology, research", { dark: true }],
  ["b-aerial", "Aerial", "fullportrait", ["#f6f8f5", "#e9eee7", "#13201a", "#55635b", "#13201a", "#2f8a5a"], "inter-tight", "inter", "minimal", "A full-screen aerial photograph with one bold statement about what you make.", "manufacturing, chemicals, agriculture"],
  ["b-silhouette", "Silhouette", "cinema", D, "inter-tight", "inter", "bar", "Cinematic full-screen imagery with a filmstrip of what you build.", "robotics, engineering, security", { dark: true }],
  ["b-earth", "Earth", "champion", ["#14110d", "#1e1a15", "#f2ece1", "#b3a995", "#d9a441", "#d9a441"], "archivo", "inter", "bar", "Dark earth tones and a bold condensed headline over landscape photography.", "energy, mining, infrastructure", { dark: true }],
  ["b-technical", "Technical", "coordinates", ["#fafbfb", "#eef1f2", "#101416", "#59636a", "#101416", "#e5532b"], "space-grotesk", "inter", "minimal", "A technical caption bar and a wide machine photograph. Precise and engineered.", "energy, engineering, hardware"],
  ["b-alliance", "Alliance", "contractor", ["#ffffff", "#f2f6f8", "#132028", "#566570", "#146c94", "#146c94"], "manrope", "inter", "bar", "A big headline over a team photograph, with a clear call to action. Credible and human.", "health network, clinic group, nonprofit"],
  ["b-typing", "Typing", "sentence", ["#0b0b0b", "#151515", "#f2f2ee", "#a5a5a0", "#f2f2ee", "#f2f2ee"], "newsreader", "inter", "minimal", "Black, with a long serif statement and pill buttons.", "design and development studio", { dark: true }],
  ["b-objects", "Objects", "photogrid", W, "inter", "inter", "minimal", "A minimal studio site led by a tight grid of product photography.", "product design studio, industrial design"],
  ["b-devices", "Devices", "mockups", ["#f7f7f5", "#ecece8", "#141414", "#5b5b57", "#141414", "#3d5afe"], "outfit", "inter", "bar", "A clear statement with your work shown in device frames, and a newsletter footer.", "design studio, digital agency"],
  ["b-founder", "Founder", "panelcard", ["#101012", "#19191c", "#f0f0ec", "#a7a7a2", "#f0f0ec", "#7ac0a0"], "inter-tight", "inter", "bar", "A dark profile card with a clear one-line offer and a 'book a call' button.", "agency founder, consultant, advisor", { dark: true }],
  ["b-care", "Care", "creator", ["#fbf6f0", "#f2e8dc", "#2a2019", "#6a5c4f", "#2f6b5f", "#2f6b5f"], "fraunces", "dm-sans", "bar", "Warm serif and sans, soft colours and a gentle headline. For therapy and care practices.", "therapy, counselling, care practice", { radius: "lg", tier: "public" }],
  ["b-grid", "Grid", "swiss", ["#f5f5f2", "#e9e9e4", "#121212", "#5d5d58", "#121212", "#e0581f"], "inter-tight", "inter", "minimal", "A strict industrial grid with bold headings and clear service lists.", "industrial services, recycling, logistics"],
  ["b-leather", "Leather", "panel", ["#f4efe8", "#e8dfd2", "#2a1d14", "#6b5a4a", "#5a3a22", "#a87b4f"], "cormorant", "inter", "centered", "Material close-ups beside calm serif panels. For manufacturers and suppliers.", "manufacturer, leather goods, materials supplier"],
  ["b-packshot", "Packshot", "photogrid", ["#f7f4ee", "#ece6da", "#161410", "#5f5a50", "#161410", "#e4572e"], "archivo", "inter", "bar", "An editorial grid of strong product photography. For packaging and branding studios.", "packaging studio, branding studio"],
  ["b-blackgrid", "Black Grid", "photogrid", D, "inter-tight", "inter", "minimal", "Products on black in a precise grid. Premium and quiet.", "product studio, brand studio", { dark: true }],
  ["b-friendly", "Friendly", "warmbento", ["#f7f8ff", "#eaedfc", "#1a1d3a", "#5a5f80", "#5b5fe0", "#1a1d3a"], "bricolage", "dm-sans", "bar", "Friendly rounded cards, bright colour and plain language. For research and marketing firms.", "research firm, marketing agency", { radius: "xl" }],
  ["b-consult", "Consult", "sentence", ["#fbfaf7", "#f1efe9", "#1b1d22", "#5c5f67", "#1b3a5c", "#1b3a5c"], "libre-caslon", "inter", "sidebar", "Side navigation and a clear serif statement of value. For consultants and systems firms.", "consultant, systems integrator, advisory", { css: ".hero.sentence h1{font-weight:400;font-size:clamp(1.8rem,3.6vw,3rem)}" }],
  ["b-venture", "Venture", "promise", ["#0f0f10", "#18181a", "#efede8", "#a6a39c", "#efede8", "#c9b28a"], "instrument-serif", "inter", "bar", "Dark and restrained, with a serif promise and one italic accent.", "venture capital, private equity, family office", { dark: true }],
  ["b-huge", "Studio Dark", "studiodark", ["#0a0a0b", "#141416", "#f2f2ef", "#a2a29e", "#f2f2ef", "#ff3d2e"], "archivo", "inter", "minimal", "A dark agency page with your discipline in enormous type and a numbered services list.", "creative agency, digital agency", { dark: true, css: ".hero.studiodark h1{font-stretch:80%;text-transform:uppercase}" }],
  ["b-unseen", "Initials", "initials", D, "syne", "inter", "minimal", "Cinematic black with your studio's initials set enormous.", "creative studio, production company", { dark: true }],
  ["b-phantom", "Phantom", "ticker", ["#f3f1ec", "#e8e4db", "#121212", "#5c5a54", "#121212", "#7b5cff"], "archivo-black", "inter", "bar", "Bold shapes, a big name and a ticker of services running underneath.", "creative agency, design studio"],
  ["b-trionn", "Halftone", "globe", ["#f6f7fb", "#e9ecf6", "#0e1230", "#545a78", "#0e1230", "#ff6a3d"], "inter-tight", "inter", "bar", "A deep navy panel with a halftone sphere and a confident name.", "digital agency, technology consultancy"],
  ["b-twotone", "Two Tone", "twotone", ["#ecebe7", "#e0ded8", "#151513", "#8a8780", "#151513", "#151513"], "inter-tight", "inter", "floating", "Warm grey, a large two-tone statement and a floating pill menu.", "creative studio, consultancy"],
  ["b-kode", "Italic List", "clients", ["#ffffff", "#f1f4ff", "#0d0f1a", "#545a72", "#111827", "#111827"], "playfair", "inter", "bar", "Your services or clients in giant italic, one per line, on a deep background.", "agency, development studio"],
  ["b-editorial", "Editorial", "gazette", ["#f4f0e7", "#e9e3d6", "#141414", "#5d5850", "#141414", "#c8102e"], "playfair", "lora", "minimal", "A front page for your organisation: masthead, lead story and 'in this issue'.", "publisher, cultural organisation, design body"],
  ["b-report", "Report", "chapters", ["#efe9dd", "#e4dccb", "#262019", "#6a5f4e", "#262019", "#8a4a24"], "cormorant", "lora", "centered", "An annual report as a book: title page, plate and a table of contents.", "research institute, foundation, report"],
  ["b-event", "Event", "slides", D, "syne", "inter", "minimal", "A full-screen event photograph with a slide counter and an index of sessions.", "conference, festival, event company", { dark: true }],
  ["b-index", "Index", "datelist", W, "inter", "inter", "minimal", "An ultra-minimal index of everything you offer, dated and tidy.", "publisher, archive, studio"],
  ["b-poster", "Poster", "realwork", ["#ffffff", "#f6f0ee", "#161212", "#5e5654", "#161212", "#d6261f"], "archivo", "inter", "bar", "Poster-like: a huge condensed headline in red over a photograph, with an intro panel.", "food brand, consumer brand", { css: ".hero.realwork h1{text-transform:uppercase;font-stretch:75%}" }],
];

export const PREMIUM_BUSINESS_TEMPLATES: TemplateDef[] = ROWS.map(([id, name, hero, c, h, b, header, description, industries, x = {}]) => ({
  id, name, type: "business", tier: x.tier ?? "member", rank: "premium",
  styles: [hero, x.dark ? "dark" : "light"], industries: industries.split(", "), description,
  theme: {
    mode: x.dark ? "dark" : "light",
    colors: { bg: c[0], surface: c[1], text: c[2], muted: c[3], primary: c[4], accent: c[5] },
    fontHeading: h, fontBody: b, radius: x.radius ?? "sm", density: "airy", headingScale: "lg", animation: "subtle",
    headerStyle: header, cardStyle: "flat", ornament: "none",
  },
  variants: { services: "grid", about: "split", gallery: "grid", footer: "columns", ...x.v, hero },
  art: "arcs",
  css: x.css ?? "",
}));
