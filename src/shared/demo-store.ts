import type { ImageRef, StoreSettings } from "./schema";
import type { DemoProduct, Persona } from "./demo";

// Fictional demo shops for the Signature storefront templates. Every shop name, person and
// detail is invented; photos are CC0 (public/stock/CREDITS.txt). Copy follows the no-AI-slop
// rule in quality.ts: plain, specific sentences, no hype.

const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });

export const STORE_BASE = (currency: string, delivery: string, deliveryPrice: number, pickup: string): Partial<StoreSettings> => ({
  paymentMethods: [
    { id: "cod", kind: "cod", label: "Pay on delivery", instructions: "Pay the courier when your order arrives." },
    { id: "bank", kind: "bank_transfer", label: "Bank transfer", instructions: "After placing your order you'll receive our bank details. Your order is confirmed once payment arrives." },
  ],
  fulfillment: [
    { id: "delivery", kind: "delivery", label: delivery, priceMinor: deliveryPrice, details: "Delivered within 1–3 working days." },
    { id: "pickup", kind: "pickup", label: pickup, priceMinor: 0, details: "Collect from our shop during opening hours." },
  ],
  requirePhone: true,
  returnsPolicy: "Unused items in their original packaging can be returned within 14 days of delivery for an exchange or refund. Contact us with your order number to arrange a return.",
  shippingPolicy: "We deliver in 1–3 working days. Delivery fees are shown at checkout. You can also collect your order from our shop free of charge.",
  privacyNote: "We use your name, phone number, email and address only to process and deliver your order and to contact you about it. We do not sell your information.",
  checkoutNote: "You will receive a confirmation page with your order number. We'll contact you to confirm delivery.",
  prohibitedAck: true,
});

export interface Kit { collections: string[]; products: DemoProduct[]; faqs: { q: string; a: string }[] }

const SIZES = { name: "Size", values: ["XS", "S", "M", "L"] };
const MSIZES = { name: "Size", values: ["S", "M", "L", "XL"] };

const BASE_KITS: Record<string, Kit> = {
  fashion: {
    collections: ["Dresses", "Tops & jackets", "Accessories"],
    products: [
      { title: "Floral wrap dress", price: 185, description: "A relaxed wrap dress in printed cotton voile with a tie waist and flutter sleeves. Falls just below the knee.", collection: "Dresses", option1: SIZES, option2: { name: "Colour", values: ["Navy", "Blush"] }, stock: 4, featured: true, image: "fashion-floral-dress", images: ["fashion-hero"] },
      { title: "Bias-cut slip dress", price: 145, compareAt: 170, description: "Cut on the bias from washed satin so it moves with you. Adjustable straps, midi length.", collection: "Dresses", option1: SIZES, stock: 6, featured: true, image: "fashion-slip-dress" },
      { title: "Olive utility jacket", price: 260, description: "Structured cotton twill with a high collar, tonal buttons and four patch pockets.", collection: "Tops & jackets", option1: SIZES, stock: 5, featured: true, image: "fashion-olive-jacket", images: ["fashion-street"] },
      { title: "Cream lace blouse", price: 120, description: "Soft guipure lace sleeves on a relaxed cotton body. Mother-of-pearl buttons.", collection: "Tops & jackets", option1: SIZES, stock: 8, featured: true, image: "fashion-lace-blouse" },
      { title: "Tie-neck camisole", price: 85, description: "A fluid camisole with a ribbon tie at the neck. Wears alone or under tailoring.", collection: "Tops & jackets", option1: SIZES, stock: 0, image: "fashion-tie-top" },
      { title: "Leather weekender", price: 420, description: "Full-grain leather holdall with brass hardware, a cotton lining and a detachable strap.", collection: "Accessories", stock: 3, featured: true, image: "fashion-weekender" },
      { title: "Canvas mini backpack", price: 150, description: "Waxed canvas with leather trims and a drawstring top. Fits a laptop up to 13 inches.", collection: "Accessories", stock: 7, image: "fashion-backpack" },
      { title: "Spiral drop earrings", price: 65, description: "Hand-formed brass spirals on sterling silver hooks.", collection: "Accessories", stock: 12, featured: true, image: "fashion-earrings" },
    ],
    faqs: [
      { q: "How do your sizes run?", a: "True to size. Each product page lists garment measurements; if you are between sizes, take the larger for a relaxed fit." },
      { q: "How long does delivery take?", a: "Orders leave the studio within two working days and arrive one to three days later." },
      { q: "Can I return an item?", a: "Yes. Unworn items with tags attached can be returned within 14 days for an exchange or refund." },
    ],
  },
  menswear: {
    collections: ["Tailoring", "Knitwear", "Shoes", "Accessories"],
    products: [
      { title: "Navy two-piece suit", price: 680, description: "Half-canvassed jacket in navy wool with natural shoulders, and flat-front trousers. Made in a small Portuguese workshop.", collection: "Tailoring", option1: { name: "Size", values: ["38", "40", "42", "44"] }, stock: 4, featured: true, image: "men-navy-suit", images: ["men-jacket-buttons"] },
      { title: "Charcoal wool blazer", price: 420, description: "Single-breasted blazer in charcoal flannel with horn buttons and a soft shoulder.", collection: "Tailoring", option1: { name: "Size", values: ["38", "40", "42", "44"] }, stock: 5, featured: true, image: "men-dark-tailoring" },
      { title: "Tweed sport coat", price: 460, description: "Brown herringbone tweed, patch pockets and leather-covered buttons.", collection: "Tailoring", option1: { name: "Size", values: ["38", "40", "42", "44"] }, stock: 3, featured: true, image: "men-tweed-buttons", images: ["men-tweed-cloth"] },
      { title: "Ivory dinner jacket", price: 520, description: "Shawl-collar dinner jacket in ivory wool barathea, for summer evenings.", collection: "Tailoring", option1: { name: "Size", values: ["38", "40", "42"] }, stock: 2, image: "men-white-jacket" },
      { title: "Merino crew knit", price: 160, description: "Fine-gauge merino in heather grey. Light enough to wear under a jacket.", collection: "Knitwear", option1: MSIZES, stock: 9, featured: true, image: "men-grey-knit" },
      { title: "Ribbed wool beanie", price: 45, description: "Chunky rib in undyed wool, folded cuff.", collection: "Knitwear", stock: 14, image: "men-beanie" },
      { title: "Oxford brogues", price: 290, description: "Goodyear-welted calf leather brogues on a leather sole. Resoleable.", collection: "Shoes", option1: { name: "Size", values: ["41", "42", "43", "44", "45"] }, stock: 6, featured: true, image: "men-brogues" },
      { title: "Silk pocket square", price: 45, description: "Hand-rolled edges, printed silk twill.", collection: "Accessories", stock: 20, featured: true, image: "men-pocket-square" },
      { title: "Felt fedora", price: 120, description: "Rabbit felt with a grosgrain band. Packs flat for travel.", collection: "Accessories", option1: { name: "Size", values: ["57", "58", "59"] }, stock: 4, image: "men-hat-blazer" },
    ],
    faqs: [
      { q: "Do you offer alterations?", a: "Yes. Sleeve and trouser lengths can be adjusted in our workshop before dispatch, free of charge." },
      { q: "How do your jackets fit?", a: "Chest sizes are in inches. Choose your usual suit size; the product page lists full garment measurements." },
      { q: "Can I return an item?", a: "Unworn, unaltered items can be returned within 14 days of delivery." },
    ],
  },
  jewellery: {
    collections: ["Rings", "Necklaces", "Earrings", "Bracelets"],
    products: [
      { title: "Halo engagement ring", price: 2400, description: "A round brilliant diamond, 0.6 ct, set in a halo of pavé diamonds on a platinum band.", collection: "Rings", option1: { name: "Ring size", values: ["J", "L", "N", "P"] }, stock: 2, featured: true, image: "jewel-halo-ring", images: ["jewel-hand-rings"] },
      { title: "Solitaire ring", price: 1450, description: "A single round diamond in a four-claw setting on a slim 18k white-gold band.", collection: "Rings", option1: { name: "Ring size", values: ["J", "L", "N", "P"] }, option2: { name: "Metal", values: ["White gold", "Yellow gold"] }, stock: 3, featured: true, image: "jewel-solitaire-band", images: ["jewel-rings-grey"] },
      { title: "Pink sapphire ring", price: 980, description: "An oval pink sapphire in a six-claw setting on a polished band.", collection: "Rings", option1: { name: "Ring size", values: ["J", "L", "N"] }, stock: 1, featured: true, image: "jewel-pink-diamond", images: ["jewel-hand-rings"] },
      { title: "Stacking band set", price: 320, description: "Three slim bands, one with a single diamond, to wear together or apart.", collection: "Rings", option1: { name: "Ring size", values: ["J", "L", "N", "P"] }, stock: 6, image: "jewel-rings-navy" },
      { title: "Gold pendant necklace", price: 420, description: "A peridot pendant on a fine 18k gold chain, 45 cm.", collection: "Necklaces", stock: 5, featured: true, image: "jewel-pendant", images: ["jewel-layered"] },
      { title: "Freshwater pearl strand", price: 380, description: "Hand-knotted freshwater pearls with a gold clasp, 42 cm.", collection: "Necklaces", stock: 4, featured: true, image: "jewel-pearls", images: ["jewel-choker"] },
      { title: "Layered chain necklace", price: 260, description: "Two fine chains, 40 and 46 cm, joined at one clasp.", collection: "Necklaces", stock: 8, image: "jewel-layered", images: ["jewel-choker"] },
      { title: "Gold hoop earrings", price: 240, description: "Medium hoops in 14k gold with a hinged click fastening.", collection: "Earrings", stock: 9, featured: true, image: "jewel-hoop-earring" },
      { title: "Spiral drop earrings", price: 190, description: "Hand-formed spirals in recycled gold vermeil.", collection: "Earrings", stock: 7, featured: true, image: "jewel-spiral-earring" },
      { title: "Beaded bracelet stack", price: 120, description: "Three stretch bracelets with gold-filled beads.", collection: "Bracelets", stock: 10, image: "jewel-bracelets" },
    ],
    faqs: [
      { q: "Can I have a piece engraved?", a: "Yes. Most rings and pendants can be engraved with up to 20 characters. Add a note at checkout." },
      { q: "How do I find my ring size?", a: "Visit the studio to be measured, or ask us for a free ring sizer by post." },
      { q: "How should I care for my jewellery?", a: "Store pieces separately, take them off before swimming, and clean with a soft cloth. We clean and check claws for free." },
    ],
  },
  furniture: {
    collections: ["Seating", "Tables", "Lighting"],
    products: [
      { title: "Patterned lounge chair", price: 1250, description: "A mid-century lounge chair with a solid walnut frame and a printed wool seat. Seat height 42 cm.", collection: "Seating", stock: 3, featured: true, image: "home-orange-armchair", images: ["home-white-room"] },
      { title: "Leather club chair", price: 1890, description: "Deep-buttoned club chair in vegetable-tanned leather that darkens with age.", collection: "Seating", stock: 2, featured: true, image: "home-leather-armchair" },
      { title: "Butterfly chair", price: 540, description: "A steel frame with a heavy cotton canvas sling. Folds flat.", collection: "Seating", option1: { name: "Colour", values: ["Natural", "Rust"] }, stock: 6, featured: true, image: "home-butterfly-chair" },
      { title: "Oak side chair", price: 380, description: "Solid oak, oiled, with a woven cord seat. Made to order in eight weeks.", collection: "Seating", stock: 8, image: "home-wood-chair" },
      { title: "Upholstered armchair", price: 980, description: "A compact armchair in boucle with an oak base. Seat width 56 cm.", collection: "Seating", stock: 4, image: "home-armchair-detail" },
      { title: "Round pedestal table", price: 890, description: "A 100 cm round top on a single cast pedestal. Seats four.", collection: "Tables", option1: { name: "Top", values: ["White", "Oak"] }, stock: 3, featured: true, image: "home-tulip-table" },
      { title: "Low coffee table", price: 720, description: "A thick reclaimed-wood top on a blackened steel frame, 120 × 60 cm.", collection: "Tables", stock: 5, featured: true, image: "home-coffee-table" },
      { title: "Arc floor lamp", price: 340, description: "A matt black floor lamp with an adjustable steel shade. Height 150 cm.", collection: "Lighting", stock: 7, featured: true, image: "home-floor-lamp" },
      { title: "Task desk lamp", price: 210, description: "A swing-arm desk lamp with a weighted base and a warm 2700K bulb.", collection: "Lighting", stock: 9, image: "home-desk-lamp" },
    ],
    faqs: [
      { q: "How is furniture delivered?", a: "Large pieces are delivered by a two-person team to the room of your choice, with packaging taken away." },
      { q: "Do you make pieces to order?", a: "Some pieces are made to order. Lead times are listed on each product page." },
      { q: "Can I see a piece before buying?", a: "Yes. Our showroom is open Tuesday to Saturday, and you can request fabric and wood samples by post." },
    ],
  },
  home: {
    collections: ["Ceramics", "Textiles", "Lighting"],
    products: [
      { title: "Stoneware bud vases", price: 58, description: "A pair of wheel-thrown bud vases in a satin white glaze, 18 and 14 cm.", collection: "Ceramics", stock: 12, featured: true, image: "home-bud-vases" },
      { title: "Blush ceramic vase", price: 74, description: "A round-bellied vase in a soft blush glaze, 22 cm.", collection: "Ceramics", stock: 6, featured: true, image: "home-pink-vase" },
      { title: "White pitcher", price: 48, description: "A one-litre pitcher in glazed earthenware, for water or flowers.", collection: "Ceramics", stock: 10, featured: true, image: "home-white-jug" },
      { title: "Glass storage jar", price: 32, description: "Mouth-blown glass with a cork lid, 1.2 litres.", collection: "Ceramics", stock: 15, image: "home-glass-jar" },
      { title: "Linen cushion covers", price: 65, description: "Stonewashed linen covers with a hidden zip, 50 × 50 cm. Set of two.", collection: "Textiles", option1: { name: "Colour", values: ["Duck egg", "Oat", "Ink"] }, stock: 14, featured: true, image: "home-cushions" },
      { title: "Brass pendant trio", price: 420, description: "Three spun-brass pendants on a single ceiling plate, with 1.5 m of fabric flex.", collection: "Lighting", stock: 4, featured: true, image: "home-brass-pendants", images: ["home-pendant-shelves"] },
      { title: "Square fabric pendant", price: 260, description: "A large square shade in warm linen, 50 cm.", collection: "Lighting", stock: 5, featured: true, image: "home-square-pendant" },
      { title: "Bare-bulb pendant", price: 90, description: "A braided cord pendant with a dimmable filament bulb.", collection: "Lighting", stock: 18, image: "home-bulb-pendant" },
      { title: "Wall sconce", price: 180, description: "A plug-in wall light with a linen shade and a brass arm.", collection: "Lighting", stock: 7, image: "home-wall-light" },
    ],
    faqs: [
      { q: "Are your ceramics food safe?", a: "Yes. All glazes are lead-free and food safe. Wash by hand to keep the finish." },
      { q: "Do your lights come with bulbs?", a: "Pendants and wall lights come with a warm dimmable bulb. Ceiling lights should be fitted by an electrician." },
      { q: "How do you pack fragile pieces?", a: "In recycled card and paper, with no plastic. Anything that arrives damaged is replaced free." },
    ],
  },
};

export const KITS: Readonly<Record<string, Kit>> = Object.freeze({
  ...BASE_KITS,
  lighting: {
    collections: ["Pendants", "Wall lights", "Lamps"],
    products: [
      ...BASE_KITS.home.products.filter((p) => p.collection === "Lighting").map((p) => ({ ...p, collection: p.title === "Wall sconce" ? "Wall lights" : "Pendants" })),
      ...BASE_KITS.furniture.products.filter((p) => p.collection === "Lighting").map((p) => ({ ...p, collection: "Lamps", featured: true })),
    ],
    faqs: BASE_KITS.home.faqs,
  },
});

// A lighting-only range for lighting shops (pendants and wall lights from "home", lamps from "furniture").

export interface ShopSpec {
  name: string; tagline: string; description: string; about: string; industry: string;
  currency: string; rate: number; city: string; country: string;
  hero: [string, string]; gallery: [string, string][]; banner?: string;
  /** collection shown first (reorders the kit) */
  lead?: string; whatsapp?: string;
}

const nice = (v: number) => (v >= 100 ? Math.round(v / 5) * 5 : Math.round(v));

export function shop(kitOrKey: string | Kit, x: ShopSpec): Persona {
  const kit = typeof kitOrKey === "string" ? KITS[kitOrKey] : kitOrKey;
  if (!kit) throw new Error(`Unknown product kit: ${String(kitOrKey)}`);
  const products = kit.products
    .map((p) => ({ ...p, price: nice(p.price * x.rate), compareAt: p.compareAt ? nice(p.compareAt * x.rate) : undefined }))
    .sort((a, b) => (x.lead ? Number(b.collection === x.lead) - Number(a.collection === x.lead) : 0));
  const collections = x.lead ? [x.lead, ...kit.collections.filter((c) => c !== x.lead)] : kit.collections;
  const zero = ["JPY", "KRW"].includes(x.currency);
  return {
    answers: {
      storeName: x.name, tagline: x.tagline, industry: x.industry, description: x.description, about: x.about,
      currency: x.currency, country: x.country, city: x.city, email: "shop@example.com", whatsapp: x.whatsapp,
      heroImage: st(x.hero[0], x.hero[1]), gallery: x.gallery.map(([n, a]) => st(n, a)), promoBanner: x.banner,
      faqs: kit.faqs,
      hours: [{ days: "Tuesday – Saturday", hours: "10:00 – 18:00" }],
      store: STORE_BASE(x.currency, "Tracked delivery", zero ? 800 : Math.round(8 * x.rate) * 100, "Collect in store"),
    },
    collections,
    products,
  };
}

export const STORE_PERSONAS: Record<string, Persona> = {
  "e-couture": shop("fashion", {
    name: "Maison Arlette", tagline: "Day and evening dresses, cut in Paris.", industry: "Womenswear",
    description: "Dresses, blouses and outerwear made in small runs in our Paris atelier.",
    about: "Maison Arlette is a womenswear atelier in the 11th arrondissement. Every pattern is drafted in the studio and every collection is made in runs of no more than forty pieces.\n\nWe work with two family-run mills in France and Italy, and keep offcuts for scarves and linings.",
    currency: "EUR", rate: 0.95, city: "Paris", country: "France",
    hero: ["fashion-hero", "Two women in floral dresses holding a hydrangea"], gallery: [["fashion-atelier", "Rails of garments in the atelier"], ["fashion-boutique-rails", "Clothes on a rail in the shop"]],
    banner: "Complimentary alterations on all dresses",
  }),
  "e-runway": shop("fashion", {
    name: "Nora Vale", tagline: "Collection 04. Slip dresses and hard tailoring.", industry: "Designer womenswear",
    description: "A designer label from Milan, released in two collections a year.",
    about: "Nora Vale started as a graduate collection in 2019. Today the label releases two collections a year, made in Lombardy by the same three workshops.\n\nEach piece is numbered, and each collection is made once.",
    currency: "EUR", rate: 1.1, city: "Milan", country: "Italy", lead: "Tops & jackets",
    hero: ["fashion-street", "A model in a utility jacket on a city street"], gallery: [["fashion-atelier", "The studio rails"], ["fashion-boutique-rails", "The Milan shop"]],
  }),
  "e-gallery": shop("fashion", {
    name: "Ines & Sloane", tagline: "Clothes for the long run.", industry: "Womenswear",
    description: "A short wardrobe of dresses and layers, made to be worn for years.",
    about: "Ines & Sloane is two designers and one cutting table in Brooklyn. We make fewer things, better: each style stays in the range until it stops being useful.\n\nWe repair anything we have made, for life.",
    currency: "USD", rate: 1, city: "New York", country: "United States",
    hero: ["fashion-slip-dress", "A model in a black slip dress"], gallery: [["fashion-boutique-rails", "The studio rail"], ["fashion-wooden-hangers", "Wooden hangers on a rail"]],
  }),
  "e-soiree": shop("fashion", {
    name: "Belle Saison", tagline: "Dresses for the evenings you remember.", industry: "Occasionwear",
    description: "Occasion and evening dresses, with free fittings in our Lyon salon.",
    about: "Belle Saison dresses weddings, galas and long summer evenings. Book a fitting in the salon and we will adjust your dress by hand before you collect it.\n\nOur fabrics are deadstock silks and cottons from French mills.",
    currency: "EUR", rate: 1.05, city: "Lyon", country: "France", lead: "Dresses",
    hero: ["fashion-hero", "Two women in floral dresses"], gallery: [["fashion-floral-dress", "A floral dress in the salon"], ["fashion-atelier", "The fitting room rails"]],
    banner: "Book a free fitting in the salon",
  }),
  "e-tailor": shop("fashion", {
    name: "Whitlow & Hart", tagline: "Tailoring for women, made to last a decade.", industry: "Womenswear tailoring",
    description: "Jackets, coats and shirts cut for women, from our London workroom.",
    about: "Whitlow & Hart was founded by two tailors who were tired of altering men's patterns for women. Every jacket is cut on our own blocks and finished by hand in our London workroom.\n\nWe offer free sleeve and hem adjustments.",
    currency: "GBP", rate: 0.85, city: "London", country: "United Kingdom", lead: "Tops & jackets",
    hero: ["fashion-olive-jacket", "A woman in an olive utility jacket"], gallery: [["fashion-wooden-hangers", "Wooden hangers in the workroom"], ["fashion-atelier", "Jackets on the rail"]],
  }),
  "e-linen": shop("fashion", {
    name: "Field Linen Co.", tagline: "Linen clothing, washed soft.", industry: "Linen clothing",
    description: "Garment-washed linen for everyday wear, woven in Portugal.",
    about: "Field Linen Co. makes a small range of linen clothing from flax grown and woven in northern Portugal. Every piece is garment-washed so it is soft from the first wear.\n\nWe ship in recycled paper.",
    currency: "EUR", rate: 0.9, city: "Lisbon", country: "Portugal",
    hero: ["fashion-linen-robes", "Linen robes hanging on a white wall"], gallery: [["fashion-wooden-hangers", "Wooden hangers"], ["fashion-linen-robes", "Linen robes"]],
  }),
  "e-drape": shop("fashion", {
    name: "Atelier Odile", tagline: "Soft tailoring and fine knits from Copenhagen.", industry: "Womenswear",
    description: "Relaxed womenswear in wool, linen and silk, designed in Copenhagen.",
    about: "Atelier Odile designs relaxed womenswear in natural fibres. We release four small drops a year and restock only what our customers ask for.\n\nOur studio shop is open on Saturdays.",
    currency: "DKK", rate: 7, city: "Copenhagen", country: "Denmark",
    hero: ["fashion-atelier", "A woman among rails of clothing"], gallery: [["fashion-lace-blouse", "A cream lace blouse"], ["fashion-boutique-rails", "The studio shop"]],
  }),
  "e-velvet": shop("fashion", {
    name: "Rosamund", tagline: "Evening wear with a little drama.", industry: "Eveningwear",
    description: "Evening dresses and jackets in velvet, satin and lace.",
    about: "Rosamund makes eveningwear in rich fabrics: velvet, satin and lace. Each style is made in limited numbers in London.\n\nPersonal appointments are available in our Marylebone salon.",
    currency: "GBP", rate: 0.9, city: "London", country: "United Kingdom", lead: "Dresses",
    hero: ["fashion-slip-dress", "A model in a black slip dress"], gallery: [["fashion-floral-dress", "A printed wrap dress"], ["fashion-atelier", "The salon rails"]],
    banner: "Private appointments in our Marylebone salon",
  }),
  "e-blanc": shop("fashion", {
    name: "STUDIO NEUF", tagline: "Clothes shown like objects.", industry: "Concept store",
    description: "A concept store for clothing and accessories by independent designers.",
    about: "Studio Neuf is a small concept store in Berlin-Mitte. We buy from independent designers we have met in person, and show their work like a gallery.\n\nThe shop changes every season.",
    currency: "EUR", rate: 1, city: "Berlin", country: "Germany", lead: "Accessories",
    hero: ["fashion-boutique-rails", "Garments on a rail in a white shop"], gallery: [["fashion-wooden-hangers", "Hangers on a rail"], ["fashion-boutique-rails", "The shop"]],
  }),
  "e-plain": shop("menswear", {
    name: "Plain Goods", tagline: "Good clothes. Nothing extra.", industry: "Menswear",
    description: "Menswear essentials in wool, cotton and leather.",
    about: "Plain Goods makes the clothes most men wear every day, properly. No logos, no seasons: the range changes only when we can make something better.\n\nEverything is made in Portugal and Japan.",
    currency: "USD", rate: 0.9, city: "Portland", country: "United States", lead: "Knitwear",
    hero: ["men-shop", "Shirts and jackets on rails in a menswear shop"], gallery: [["men-tweed-cloth", "Tweed cloth up close"], ["men-shop", "The Portland shop"]],
  }),
  "e-savile": shop("menswear", {
    name: "Ashby & Rowe", tagline: "Tailoring, cut and finished in London.", industry: "Tailoring",
    description: "Ready-to-wear and made-to-measure tailoring from our London shop.",
    about: "Ashby & Rowe has cut suits since 1998. Our ready-to-wear jackets are made from the same patterns as our made-to-measure, and every one is finished by hand.\n\nBook a fitting and we will adjust any piece before collection.",
    currency: "GBP", rate: 0.85, city: "London", country: "United Kingdom",
    hero: ["men-navy-suit", "A man fastening a navy suit jacket"], gallery: [["men-jacket-buttons", "Jacket cuff buttons"], ["men-tweed-cloth", "Tweed cloth"]],
    banner: "Free alterations on all tailoring",
  }),
  "e-cut": shop("menswear", {
    name: "Hale Tailoring", tagline: "Sharp tailoring for after six.", industry: "Menswear",
    description: "Modern tailoring and eveningwear, made in New York.",
    about: "Hale Tailoring makes slim, modern suits and evening jackets in a Manhattan workroom. We fit every customer in person or by video call.\n\nAlterations are free for the life of the garment.",
    currency: "USD", rate: 1.05, city: "New York", country: "United States",
    hero: ["men-dark-tailoring", "A man adjusting a dark tie"], gallery: [["men-white-jacket", "An ivory dinner jacket"], ["men-jacket-buttons", "Cuff buttons"]],
  }),
  "e-lustre": shop("jewellery", {
    name: "Maren Fine Jewellery", tagline: "Diamonds and gold, set by hand in Antwerp.", industry: "Fine jewellery",
    description: "Engagement rings and fine jewellery, made in our Antwerp workshop.",
    about: "Maren is a goldsmith's workshop in Antwerp's diamond quarter. Every stone is chosen in person and every setting is made by hand at our bench.\n\nWe use recycled gold and platinum, and every diamond comes with its certificate.",
    currency: "EUR", rate: 0.95, city: "Antwerp", country: "Belgium",
    hero: ["jewel-spiral-earring", "A woman wearing a gold spiral earring by the sea"], gallery: [["jewel-sketching", "A jeweller sketching designs at the bench"], ["jewel-rings-navy", "Rings on blue velvet"]],
    banner: "Complimentary engraving on all rings",
  }),
  "e-heirloom": shop("jewellery", {
    name: "Holloway & Daughters", tagline: "Silver and antique jewellery since 1962.", industry: "Antique jewellery",
    description: "Antique, vintage and new silver jewellery, restored in our Edinburgh workshop.",
    about: "Holloway & Daughters has bought, restored and sold jewellery in Edinburgh's Old Town for three generations. Every antique piece is checked, cleaned and re-strung in our workshop.\n\nWe also make a small range of new silver pieces.",
    currency: "GBP", rate: 0.8, city: "Edinburgh", country: "United Kingdom", lead: "Necklaces",
    hero: ["jewel-pearls", "A woman wearing a pearl necklace"], gallery: [["jewel-sketching", "Designs on the workshop bench"], ["jewel-rings-grey", "Rings on grey stone"]],
  }),
  "e-prestige": shop("jewellery", {
    name: "Verel", tagline: "High jewellery from Geneva.", industry: "High jewellery",
    description: "Diamond rings and high jewellery, by appointment in Geneva.",
    about: "Verel makes a small number of high-jewellery pieces each year in its Geneva workshop. Each design is drawn, modelled and set by the same three craftspeople.\n\nThe salon is open by appointment.",
    currency: "CHF", rate: 1.2, city: "Geneva", country: "Switzerland",
    hero: ["jewel-halo-ring", "A halo diamond ring"], gallery: [["jewel-sketching", "Design drawings"], ["jewel-solitaire-band", "A solitaire ring"]],
  }),
  "e-facet": shop("jewellery", {
    name: "Ada Rose Studio", tagline: "Demi-fine jewellery for every day.", industry: "Demi-fine jewellery",
    description: "Gold vermeil and gold-filled jewellery, made in Sydney.",
    about: "Ada Rose Studio makes everyday jewellery in gold vermeil and gold-filled wire. Pieces are designed to be layered and worn every day.\n\nEvery order is gift-wrapped in recycled card.",
    currency: "AUD", rate: 0.55, city: "Sydney", country: "Australia", lead: "Earrings",
    hero: ["jewel-choker", "A woman wearing a fine gold choker"], gallery: [["jewel-layered", "Layered gold necklaces"], ["jewel-bracelets", "A stack of beaded bracelets"]],
    banner: "Free gift wrapping on every order",
  }),
  "e-gilded": shop("jewellery", {
    name: "Solenne", tagline: "Statement gold, made to be noticed.", industry: "Gold jewellery",
    description: "Bold gold jewellery in 18k and 22k, made in Dubai.",
    about: "Solenne makes statement pieces in high-carat gold: heavy hoops, wide bands and pendants. Each design starts as a wax carving at our Dubai bench.\n\nEvery piece is hallmarked.",
    currency: "USD", rate: 1.15, city: "Dubai", country: "United Arab Emirates", lead: "Earrings",
    hero: ["jewel-hoop-earring", "A woman wearing a gold hoop earring"], gallery: [["jewel-sketching", "Design drawings"], ["jewel-pendant", "A gold pendant on wood"]],
  }),
  "e-loft": shop("furniture", {
    name: "Gray Oak Works", tagline: "Furniture in solid oak and steel.", industry: "Furniture maker",
    description: "Tables, chairs and lighting made in our Rotterdam workshop.",
    about: "Gray Oak Works is a furniture workshop in a former shipyard in Rotterdam. We build tables, chairs and storage in solid oak and blackened steel, and make most pieces to order.\n\nVisit the workshop showroom on Saturdays.",
    currency: "EUR", rate: 0.95, city: "Rotterdam", country: "Netherlands", lead: "Tables",
    hero: ["home-loft", "An open-plan loft with a dining table and sofa"], gallery: [["home-coffee-table", "A reclaimed-wood coffee table"], ["home-white-room", "A bright room with a lounge chair"]],
  }),
  "e-modular": shop("furniture", {
    name: "Unit Nine", tagline: "Modern furniture for real homes.", industry: "Furniture",
    description: "Seating, tables and lighting designed in Oslo.",
    about: "Unit Nine designs furniture for everyday homes: comfortable, durable and easy to move. Covers are removable and washable, and spare parts are sold for every piece.\n\nWe deliver free to the room of your choice.",
    currency: "NOK", rate: 10.5, city: "Oslo", country: "Norway",
    hero: ["home-white-room", "A bright room with a lounge chair and plants"], gallery: [["home-minimal-living", "A minimal living room"], ["home-butterfly-chair", "A butterfly chair by the window"]],
    banner: "Free delivery to the room of your choice",
  }),
  "e-terrace": shop("furniture", {
    name: "Olive & Stone", tagline: "Furniture for long evenings outside.", industry: "Outdoor furniture",
    description: "Outdoor tables, chairs and lighting for terraces and gardens.",
    about: "Olive & Stone makes outdoor furniture in Barcelona from steel, teak and woven cord, built to stay outside all year.\n\nEvery piece is tested on our own terrace first.",
    currency: "EUR", rate: 0.95, city: "Barcelona", country: "Spain",
    hero: ["home-veranda", "A covered veranda with chairs and plants"], gallery: [["home-bistro-chairs", "Orange bistro chairs on a terrace"], ["home-red-chair", "A red chair outside"]],
  }),
  "e-pavilion": shop("furniture", {
    name: "Halden", tagline: "Design furniture, presented like architecture.", industry: "Design furniture",
    description: "A catalogue of seating, tables and lighting by Scandinavian designers.",
    about: "Halden represents eight independent furniture designers from Denmark and Sweden. We show every piece in our Copenhagen gallery and ship across Europe.\n\nDimensions and materials are listed for every piece.",
    currency: "DKK", rate: 7, city: "Copenhagen", country: "Denmark", lead: "Lighting",
    hero: ["home-minimal-living", "A minimal living room with a pendant light"], gallery: [["home-white-room", "A white gallery room"], ["home-tulip-table", "A round pedestal table"]],
  }),
  "e-estate": shop("home", {
    name: "Wren House", tagline: "Country-house ceramics, linen and light.", industry: "Homeware",
    description: "Ceramics, linen and lighting for old houses and new ones.",
    about: "Wren House began as a market stall in Bath selling ceramics from local potters. Today we stock the work of twenty makers from across Britain.\n\nOur shop is in a Georgian townhouse on Walcot Street.",
    currency: "GBP", rate: 0.85, city: "Bath", country: "United Kingdom",
    hero: ["home-sideboard", "A dark sideboard with portraits above"], gallery: [["home-dining", "A dining room with a chandelier"], ["home-leather-armchair", "A leather armchair by a stone wall"]],
  }),
  "e-joinery": shop("home", {
    name: "Fenwick Joinery", tagline: "Kitchens, shelves and the things that live on them.", industry: "Kitchens & homeware",
    description: "Bespoke kitchens and a shop of ceramics and lighting, in Toronto.",
    about: "Fenwick Joinery designs and builds kitchens in solid wood. Our shop sells the ceramics, lighting and tools we use in our own kitchens.\n\nBook a design consultation in the showroom.",
    currency: "CAD", rate: 1.35, city: "Toronto", country: "Canada",
    hero: ["home-kitchen", "A white kitchen with pendant lights"], gallery: [["home-pendant-shelves", "Shelves lit by pendant lamps"], ["home-dining", "A dining room"]],
  }),
  "e-lumen": shop("lighting", {
    name: "Lampwright", tagline: "Light for the evening.", industry: "Lighting",
    description: "Pendants, wall lights and lamps with a warm, dimmable glow.",
    about: "Lampwright designs lighting for the hours after sunset. Every light takes a warm dimmable bulb, and every shade is made from natural materials.\n\nOur Amsterdam showroom is lit only by our own lamps.",
    currency: "EUR", rate: 0.95, city: "Amsterdam", country: "Netherlands",
    hero: ["home-pendant-shelves", "Warm pendant lights above shelves"], gallery: [["home-brass-pendants", "Brass pendants glowing"], ["home-wall-light", "A wall light"]],
  }),
  "e-weave": shop("home", {
    name: "Loom Hall", tagline: "Textiles woven by hand.", industry: "Textiles",
    description: "Hand-woven cushions, throws and rugs, and the ceramics to go with them.",
    about: "Loom Hall works with weaving cooperatives in New Mexico and Peru. We pay weavers before work starts and print each weaver's name on the label.\n\nOur studio in Santa Fe is open for visits.",
    currency: "USD", rate: 1, city: "Santa Fe", country: "United States", lead: "Textiles",
    hero: ["home-cushions", "Cushions on a pale sofa"], gallery: [["home-grey-sofa", "A sofa with cushions"], ["home-coffee-table", "A coffee table in a living room"]],
  }),
};

/** One row of a shop batch: template id, kit, and the fictional shop's details. */
export type ShopRow = [id: string, kit: string, name: string, tagline: string, industry: string, city: string, country: string, currency: string, rate: number, hero: string, about: string, lead?: string];

/** Builds shop personas from rows against an explicitly composed kit map (no import-order side effects). */
export function shopPersonas(rows: ShopRow[], kits: Readonly<Record<string, Kit>>): Record<string, Persona> {
  return Object.fromEntries(rows.map(([id, kitKey, name, tagline, industry, city, country, currency, rate, hero, about, lead]) => {
    const k = kits[kitKey];
    if (!k) throw new Error(`${id}: unknown product kit "${kitKey}"`);
    const gallery = k.products.slice(1, 3).map((pr) => [pr.image!, pr.title] as [string, string]);
    // The hero subheading is the first sentence of the story, so it never repeats the headline.
    const description = about.split(/(?<=\.)\s/)[0];
    return [id, shop(k, { name, tagline, industry, description, about, currency, rate, city, country, hero: [hero, name], gallery, lead })];
  }));
}
