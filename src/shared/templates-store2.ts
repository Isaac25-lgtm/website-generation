import type { TemplateDef } from "./templates";
import type { Theme } from "./schema";
import type { StoreLayout } from "./render/layouts";
import { storeTemplate } from "./templates-store";

// Shop batch 2: one template per five-star storefront in beauty, fragrance, bags, footwear, kids,
// stationery, wellness and streetwear (structure only; no source names, photos, copy or code).

type C = Theme["colors"];
type Row = [id: string, name: string, category: string, layout: StoreLayout, rank: "signature" | "premium", c: [string, string, string, string, string, string], h: Theme["fontHeading"], b: Theme["fontBody"], description: string, industries: string, x?: Partial<{ dark: boolean; hero: string; css: string; radius: Theme["radius"]; tier: "public" | "member"; header: Theme["headerStyle"] }>];

const ROWS: Row[] = [
  // Beauty
  ["e-apothecary", "Apothecary", "beauty", "quiet", "signature", ["#f4f0e8", "#e9e2d4", "#24211c", "#625c51", "#24211c", "#7b6a4c"], "cormorant", "inter", "Parchment tones, botanical calm and products set on soft grounds. An apothecary for considered skincare.", "skincare, apothecary, natural beauty", { tier: "public" }],
  ["e-glow", "Glow", "beauty", "lifestyle", "signature", ["#fbf4ef", "#f2e4da", "#2c1d17", "#6c5a50", "#2c1d17", "#c4703f"], "fraunces", "dm-sans", "Warm skin tones and sunlit routines, with a soft card over a wide photograph.", "skincare, beauty, body care"],
  ["e-salonbar", "Salon Bar", "beauty", "object", "signature", ["#f6f1f4", "#ece1e7", "#2a1c24", "#6b5a63", "#2a1c24", "#b88aa3"], "playfair", "inter", "A single product close-up on a blush panel beside a classic serif headline. For hair and salon brands.", "hair care, salon products, beauty"],
  ["e-botanica", "Botanica", "beauty", "lifestyle", "signature", ["#f1f2ea", "#e3e6d8", "#1f251c", "#5a6253", "#3e5a35", "#a8774a"], "fraunces", "inter", "Sage and clay with sunlit product photography. Botanical skincare, made calmly.", "botanical skincare, natural beauty"],
  ["e-serum", "Serum", "beauty", "object", "signature", ["#ffffff", "#f3efe9", "#1b1917", "#5f5a53", "#1b1917", "#e9d9c4"], "newsreader", "inter", "A dropper bottle on a warm panel and a fine serif. Clean, clinical, quietly luxurious.", "skincare, serums, dermatology"],
  ["e-maquillage", "Maquillage", "beauty", "editorial", "signature", ["#faf7f4", "#efe8e1", "#121212", "#5c5853", "#121212", "#a0262a"], "bodoni-moda", "inter", "High-fashion beauty: a full-screen lookbook, tall product columns and a deep red accent.", "luxury beauty, cosmetics, make-up"],
  ["e-pigment", "Pigment", "beauty", "wordmark", "premium", ["#fff7f2", "#ffe9dd", "#1b0f0b", "#634b40", "#1b0f0b", "#ff6a3d"], "archivo", "inter", "Bold colour cosmetics: a screen-wide wordmark above a hairline product grid.", "cosmetics, make-up, colour beauty"],
  ["e-bodycare", "Body Care", "beauty", "lifestyle", "premium", ["#f6f4fb", "#ebe7f5", "#1f1b2c", "#5e5a70", "#4b3f8c", "#4b3f8c"], "outfit", "inter", "Soft lavender, friendly type and photographs of products in use. Body care for every day.", "body care, bath, skincare", { radius: "xl" }],
  ["e-ritual", "Ritual", "beauty", "lifestyle", "premium", ["#fbf6ec", "#f2e7d2", "#2a2014", "#6a5d48", "#8a4b1f", "#3f6b4b"], "dm-serif", "dm-sans", "Warm, colourful and playful, for beauty and wellness rituals with a sense of fun.", "wellness beauty, supplements, rituals", { radius: "lg" }],
  ["e-ayur", "Ayur", "beauty", "quiet", "premium", ["#f3ece0", "#e8ddca", "#2a1f12", "#655844", "#7a3e14", "#7a3e14"], "cormorant", "jost", "Earthy terracotta and quiet product grids, for traditional and herbal skincare.", "herbal skincare, traditional remedies"],
  ["e-kbeauty", "Seoul Skin", "beauty", "object", "premium", ["#f7f9fb", "#e9eef4", "#141b24", "#57616e", "#141b24", "#9bc4e2"], "manrope", "inter", "Cool pale blue panels and precise product shots. For modern skincare routines.", "skincare, beauty routines"],
  ["e-clean", "Clean Edit", "beauty", "wordmark", "premium", ["#fbfaf7", "#f0eee8", "#151513", "#5e5c57", "#151513", "#d8a7a0"], "inter-tight", "inter", "A bold wordmark over a clean hairline grid of make-up essentials.", "clean beauty, make-up"],
  ["e-popbeauty", "Pop Beauty", "beauty", "wordmark", "premium", ["#fff3f8", "#ffe1ee", "#1d0a14", "#6b4a5a", "#d81b72", "#d81b72"], "archivo-black", "inter", "Hot pink and loud type: a playful beauty brand that wants to be noticed.", "hair care, beauty, youth brand", { radius: "lg" }],
  // Fragrance
  ["e-scent", "Scent", "fragrance", "object", "signature", ["#f5f2ec", "#e8e2d6", "#1d1a15", "#615b50", "#1d1a15", "#c9b48f"], "instrument-serif", "inter", "One bottle on a warm panel, an elegant serif and notes set out like a perfumer's sheet.", "fragrance, perfume, natural perfumery", { tier: "public" }],
  ["e-nocturne", "Nocturne", "fragrance", "editorial", "signature", ["#141210", "#1e1b18", "#efe7da", "#b2a895", "#d6b06a", "#d6b06a"], "cormorant", "inter", "Black and gold, jewel-like bottles and a cinematic lookbook. Fragrance after dark.", "fragrance, luxury perfume", { dark: true }],
  // Bags & eyewear
  ["e-carryon", "Carry-on", "bags", "object", "signature", ["#f3f4f4", "#e5e8e8", "#16191a", "#5a6062", "#16191a", "#c9d3d6"], "manrope", "inter", "Cool grey panels and luggage shown like objects. Calm and functional travel goods.", "luggage, travel bags, accessories"],
  ["e-maroquin", "Maroquin", "bags", "quiet", "signature", ["#f2ede6", "#e7dfd3", "#221c16", "#62594d", "#221c16", "#8a5a3a"], "jost", "jost", "Leather bags on stone-coloured grounds with tiny centred captions. Quiet Parisian restraint.", "leather bags, handbags, accessories", { tier: "public" }],
  ["e-satchel", "Satchel", "bags", "lifestyle", "signature", ["#f6f1e8", "#ebe2d2", "#25201a", "#655c4f", "#7a3a1e", "#7a3a1e"], "libre-caslon", "inter", "Tan leather and cream, satchels photographed out in the world. Heritage made friendly.", "leather satchels, school bags, heritage goods"],
  ["e-studiobag", "Studio Bag", "bags", "editorial", "signature", ["#f4efe8", "#e9e0d3", "#1e1a15", "#605a50", "#b0532b", "#b0532b"], "syne", "inter", "Sand and terracotta, sculptural bags in a full-screen editorial. Design-led accessories.", "designer bags, accessories"],
  ["e-weekender", "Weekender", "bags", "wordmark", "premium", ["#f7f5f1", "#ece9e2", "#141414", "#5d5b56", "#141414", "#e0b43a"], "inter-tight", "inter", "A strong wordmark over a hairline grid of travel bags and pouches.", "travel bags, weekenders, accessories"],
  ["e-optics", "Optics", "bags", "quiet", "premium", ["#ffffff", "#f3f3f1", "#121212", "#5e5e5a", "#121212", "#121212"], "instrument-sans", "inter", "Frames on white, small exact type and plenty of space. For opticians and eyewear brands.", "eyewear, opticians, glasses"],
  ["e-rainwear", "Rainwear", "bags", "wordmark", "premium", ["#eef1f3", "#e0e5e9", "#0f1418", "#55606a", "#0f1418", "#2f6b8a"], "archivo", "inter", "Cool grey and a condensed wordmark, for waterproof bags and outerwear.", "rainwear, bags, outdoor accessories"],
  // Footwear
  ["e-sneaker", "Sneaker", "footwear", "object", "signature", ["#ffffff", "#f2f2f2", "#111111", "#5c5c5c", "#111111", "#e7e1d6"], "inter", "inter", "One shoe on a panel, crisp sans type and simple choices. Everyday sneakers, done well.", "sneakers, footwear", { tier: "public" }],
  ["e-espadrille", "Espadrille", "footwear", "editorial", "signature", ["#f5efe6", "#ebe1d1", "#1f1a14", "#62594c", "#2b5d8a", "#2b5d8a"], "dm-serif", "inter", "Sea blue and sand, summer shoes in a full-screen lookbook.", "summer shoes, sandals, footwear"],
  ["e-leathersneaker", "Leather Line", "footwear", "quiet", "signature", ["#f2efe9", "#e6e1d8", "#1c1a17", "#5f5b53", "#1c1a17", "#1c1a17"], "instrument-serif", "inter", "Stone grounds, one shoe per tile and tiny captions. Leather sneakers, quietly made.", "leather sneakers, footwear"],
  ["e-craftshoe", "Craft Shoe", "footwear", "wordmark", "premium", ["#f7f4ee", "#ebe6db", "#16130e", "#5e584c", "#16130e", "#c45a2a"], "space-grotesk", "inter", "A bold wordmark and hairline grid for hand-made shoes and boots.", "handmade shoes, boots"],
  ["e-woven", "Woven", "footwear", "lifestyle", "premium", ["#fbf6ee", "#f1e6d4", "#231c13", "#665a49", "#a4532a", "#3f6b8a"], "fraunces", "dm-sans", "Warm, sunlit photographs of woven summer shoes being worn.", "espadrilles, summer shoes"],
  ["e-trail", "Trail", "footwear", "lifestyle", "premium", ["#11140f", "#1a1e17", "#eef0e8", "#a7ad9f", "#d4ff3f", "#d4ff3f"], "archivo", "inter", "Dark trail photography and bright lime details. For hiking and trail shoes.", "hiking shoes, trail running, outdoor footwear", { dark: true }],
  // Kids
  ["e-nursery", "Nursery", "kids", "lifestyle", "signature", ["#fbf6f0", "#f4e8dc", "#2b221b", "#6b5d52", "#c97a5a", "#7a9a83"], "fraunces", "dm-sans", "Soft cream and peach, gentle photographs and friendly type for baby and nursery shops.", "baby, nursery, kids", { radius: "xl", tier: "public" }],
  // Stationery
  ["e-paperie", "Paperie", "stationery", "lifestyle", "signature", ["#f8f4f0", "#efe6dd", "#26201b", "#675c52", "#b0566b", "#5d7a9a"], "newsreader", "inter", "Pastel desk scenes and a classic serif. Notebooks, cards and gifts.", "stationery, notebooks, gifts", { radius: "lg", tier: "public" }],
  ["e-manual", "Manual", "stationery", "wordmark", "signature", ["#f4f4f1", "#e8e8e3", "#111111", "#5c5c57", "#d8261c", "#d8261c"], "space-grotesk", "inter", "A design-publisher's shop: a bold wordmark, a red accent and a strict hairline grid.", "books, design publishing, prints"],
  ["e-graphite", "Graphite", "stationery", "object", "premium", ["#151515", "#1f1f1f", "#f0eee9", "#a9a69f", "#f0eee9", "#3a3a3a"], "bodoni-moda", "inter", "Dark panels and fine serif type, for pencils, pens and serious writing tools.", "pencils, pens, writing tools", { dark: true }],
  ["e-stonepaper", "Stone Paper", "stationery", "quiet", "premium", ["#f3f3f0", "#e7e7e2", "#1a1a18", "#5d5d58", "#1a1a18", "#1a1a18"], "inter-tight", "inter", "Grey stone grounds and quiet captions, for notebooks made of unusual materials.", "notebooks, eco stationery"],
  // Wellness
  ["e-calm", "Calm", "wellness", "object", "premium", ["#f1f3f2", "#e2e8e5", "#152019", "#55635a", "#2f5d4b", "#cfe0d6"], "instrument-serif", "inter", "Sage panels and a single calm object. For wellness devices and sleep products.", "wellness, sleep, relaxation"],
  ["e-matcha", "Matcha", "wellness", "lifestyle", "premium", ["#f3f5ec", "#e4ead7", "#1c2414", "#58634a", "#4f7a2a", "#c9a24a"], "fraunces", "inter", "Bright greens and sunlit kitchen scenes, for tea, matcha and daily rituals.", "tea, matcha, wellness", { radius: "lg" }],
  // Streetwear
  ["e-signal", "Signal", "fashion", "wordmark", "signature", ["#ffffff", "#f3f3f3", "#0c0c0c", "#5c5c5c", "#e10600", "#e10600"], "archivo-black", "inter", "Red and white with a giant grotesk wordmark over a tight product grid. Streetwear energy.", "streetwear, hoodies, sneakers", { tier: "public" }],
];

export const STORE2_TEMPLATES: TemplateDef[] = ROWS.map(([id, name, category, layout, rank, c, h, b, description, industries, x = {}]) => ({
  ...storeTemplate({
    id, name, category, layout, tier: x.tier ?? "member",
    styles: [layout, x.dark ? "dark" : "light"], industries: industries.split(", "), description,
    colors: { bg: c[0], surface: c[1], text: c[2], muted: c[3], primary: c[4], accent: c[5] } as C,
    mode: x.dark ? "dark" : "light", fontHeading: h, fontBody: b, headerStyle: x.header, radius: x.radius,
    hero: x.hero, css: x.css ?? "",
  }),
  rank,
}));
