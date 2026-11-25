import type { Persona } from "./demo";
import { KITS, shop } from "./demo-store";

// Fictional shops for shop batch 2. Names are invented and unrelated to the reference sites;
// photos are CC0 (public/stock/CREDITS.txt). Copy follows the no-AI-slop rule.

const SZ = (vals: string[]) => ({ name: "Size", values: vals });

KITS.beauty = {
  collections: ["Skincare", "Make-up", "Tools"],
  products: [
    { title: "Daily face serum", price: 48, description: "A light serum with squalane and niacinamide, 30 ml.", collection: "Skincare", stock: 14, featured: true, image: "beauty-dropper-tan", images: ["beauty-serum-portrait"] },
    { title: "Rich night cream", price: 56, description: "A slow-absorbing cream for dry skin, 50 ml.", collection: "Skincare", stock: 9, featured: true, image: "beauty-cream-jar", images: ["beauty-towel-cream"] },
    { title: "Day moisturiser", price: 44, description: "A fragrance-free moisturiser for every skin type, 50 ml.", collection: "Skincare", stock: 12, featured: true, image: "beauty-face-cream" },
    { title: "Cleansing bars", price: 18, description: "Two cold-process bars with oat and clay.", collection: "Skincare", stock: 30, image: "beauty-soap-bars" },
    { title: "Cream blush", price: 28, description: "A sheer, buildable blush in a refillable compact.", collection: "Make-up", option1: { name: "Shade", values: ["Petal", "Terracotta", "Berry"] }, stock: 11, featured: true, image: "beauty-blush-compact" },
    { title: "Tinted lip balm", price: 14, description: "Shea and castor oil with a hint of colour.", collection: "Make-up", option1: { name: "Shade", values: ["Clear", "Rose"] }, stock: 25, featured: true, image: "beauty-lip-balm" },
    { title: "Brush set", price: 62, description: "Six vegan brushes in a linen roll.", collection: "Tools", stock: 7, image: "beauty-brushes-white", images: ["beauty-brushes-dark"] },
    { title: "Make-up edit", price: 74, description: "Blush, balm and two brushes in one pouch.", collection: "Make-up", stock: 5, image: "beauty-makeup-flatlay" },
  ],
  faqs: [
    { q: "Are your products tested on animals?", a: "No. We never test on animals, and neither do our suppliers." },
    { q: "Which product should I start with?", a: "The daily serum and day moisturiser suit most skin. Write to us and we'll help." },
    { q: "Can I return an opened product?", a: "Yes, within 30 days if it didn't suit your skin." },
  ],
};

KITS.fragrance = {
  collections: ["Fragrance", "Body"],
  products: [
    { title: "Eau de parfum No. 1", price: 120, description: "Fig leaf, cedar and a little smoke. 50 ml.", collection: "Fragrance", option1: SZ(["15 ml", "50 ml"]), stock: 10, featured: true, image: "frag-attar-bottle", images: ["frag-garden-portrait"] },
    { title: "Eau de parfum Violet", price: 135, description: "Violet leaf, iris and warm musk. 50 ml.", collection: "Fragrance", option1: SZ(["15 ml", "50 ml"]), stock: 8, featured: true, image: "frag-violet-bottle" },
    { title: "Discovery set", price: 38, description: "Five 2 ml samples, credited against a full bottle.", collection: "Fragrance", stock: 20, featured: true, image: "beauty-makeup-flatlay" },
    { title: "Body oil", price: 46, description: "Jojoba and almond oil, lightly scented. 100 ml.", collection: "Body", stock: 12, featured: true, image: "beauty-dropper-tan" },
    { title: "Scented soap", price: 16, description: "Two hand-cut bars in our signature scent.", collection: "Body", stock: 24, image: "beauty-soap-bars" },
  ],
  faqs: [
    { q: "How long does a fragrance last on skin?", a: "Six to eight hours for most of our perfumes." },
    { q: "Can I try before buying a full bottle?", a: "Yes. The discovery set's price is credited against your first full bottle." },
  ],
};

KITS.bags = {
  collections: ["Backpacks", "Travel", "Small bags"],
  products: [
    { title: "Leather duffle", price: 340, description: "Full-grain leather duffle with brass hardware, 45 litres.", collection: "Travel", stock: 4, featured: true, image: "bag-leather-duffle", images: ["bag-duffel-sky"] },
    { title: "Canvas backpack", price: 165, description: "Waxed canvas and leather straps, fits a 15-inch laptop.", collection: "Backpacks", option1: { name: "Colour", values: ["Olive", "Sand"] }, stock: 9, featured: true, image: "bag-canvas-backpack", images: ["bag-packs-flatlay"] },
    { title: "Day pack", price: 120, description: "A light roll-top pack in recycled canvas.", collection: "Backpacks", option1: { name: "Colour", values: ["Mustard", "Black"] }, stock: 12, featured: true, image: "bag-yellow-backpack" },
    { title: "Mini backpack", price: 140, description: "A small leather backpack with a magnetic flap.", collection: "Small bags", stock: 6, featured: true, image: "bag-cream-backpack" },
    { title: "Rugged rucksack", price: 210, description: "Leather-trimmed rucksack for long trips.", collection: "Travel", stock: 5, image: "bag-leather-pack", images: ["bag-pack-lantern"] },
    { title: "Weekend holdall", price: 260, description: "A soft leather holdall with a shoulder strap.", collection: "Travel", stock: 3, image: "bag-packs-flatlay" },
    { title: "Printed clutch", price: 85, description: "A cotton clutch with a zip and inner pocket.", collection: "Small bags", stock: 10, image: "bag-floral-clutch" },
  ],
  faqs: [
    { q: "How do I care for leather?", a: "Wipe with a damp cloth and condition twice a year." },
    { q: "Do you repair bags?", a: "Yes. Send us any bag we made and we'll quote for the repair." },
  ],
};

KITS.eyewear = {
  collections: ["Optical", "Reading"],
  products: [
    { title: "Round optical frame", price: 145, description: "Acetate round frame, made by hand.", collection: "Optical", option1: { name: "Colour", values: ["Tortoise", "Black"] }, stock: 10, featured: true, image: "eyewear-round-portrait" },
    { title: "Square black frame", price: 135, description: "A classic square frame in black acetate.", collection: "Optical", stock: 12, featured: true, image: "eyewear-black-frames" },
    { title: "Reading glasses", price: 85, description: "Lightweight readers with spring hinges.", collection: "Reading", option1: { name: "Strength", values: ["+1.0", "+1.5", "+2.0"] }, stock: 20, featured: true, image: "eyewear-flatlay" },
    { title: "Screen glasses", price: 95, description: "Clear lenses with a blue-light filter.", collection: "Reading", stock: 14, featured: true, image: "eyewear-laptop-flowers" },
  ],
  faqs: [
    { q: "Can I add my prescription?", a: "Yes. Upload your prescription after ordering, or visit us for an eye test." },
    { q: "Can I try frames at home?", a: "Choose up to four frames to try for five days, free." },
  ],
};

KITS.footwear = {
  collections: ["Sneakers", "Outdoor", "Classics"],
  products: [
    { title: "White leather sneaker", price: 150, description: "Full-grain leather with a stitched rubber sole.", collection: "Sneakers", option1: SZ(["38", "39", "40", "41", "42", "43", "44"]), stock: 14, featured: true, image: "shoe-white-studio", images: ["shoe-white-above"] },
    { title: "Canvas low-top", price: 75, description: "Cotton canvas with a natural rubber sole.", collection: "Sneakers", option1: SZ(["38", "40", "42", "44"]), stock: 18, featured: true, image: "shoe-navy-canvas" },
    { title: "Suede high-top", price: 110, description: "Soft suede high-top in moss green.", collection: "Sneakers", option1: SZ(["39", "41", "43"]), stock: 8, featured: true, image: "shoe-green-hightops" },
    { title: "Light runner", price: 120, description: "A breathable knit runner for every day.", collection: "Sneakers", option1: SZ(["37", "38", "39", "40"]), stock: 10, image: "shoe-runners-magenta" },
    { title: "Hiking boot", price: 190, description: "Waterproof suede boot with a grippy sole.", collection: "Outdoor", option1: SZ(["39", "41", "43", "45"]), stock: 7, featured: true, image: "shoe-hiking-boots" },
    { title: "Leather brogue", price: 230, description: "Goodyear-welted brogue in calf leather.", collection: "Classics", option1: SZ(["40", "42", "44"]), stock: 5, image: "men-brogues" },
    { title: "Everyday trainer", price: 95, description: "A simple white trainer with a padded collar.", collection: "Sneakers", option1: SZ(["38", "40", "42"]), stock: 16, image: "shoe-white-fence", images: ["shoe-white-flatlay"] },
  ],
  faqs: [
    { q: "How do your shoes fit?", a: "True to size. If you are between sizes, take the larger one." },
    { q: "Can I exchange for another size?", a: "Yes, free of charge within 30 days." },
  ],
};

KITS.kids = {
  collections: ["Nursery", "Feeding", "Clothing"],
  products: [
    { title: "First sneakers", price: 32, description: "Soft canvas shoes for first steps.", collection: "Clothing", option1: SZ(["0–6 m", "6–12 m", "12–18 m"]), stock: 20, featured: true, image: "kids-tiny-sneakers" },
    { title: "Woven Moses basket", price: 120, description: "Hand-woven basket with an organic mattress.", collection: "Nursery", stock: 5, featured: true, image: "kids-basket" },
    { title: "Rocking bassinet", price: 240, description: "A wooden bassinet with a soft canopy.", collection: "Nursery", stock: 3, featured: true, image: "kids-bassinet" },
    { title: "Plush mobile", price: 48, description: "Hand-stitched animals on a wooden ring.", collection: "Nursery", stock: 9, featured: true, image: "kids-teddy-mobile" },
    { title: "Glass feeding bottle", price: 16, description: "Borosilicate glass with a slow-flow teat.", collection: "Feeding", stock: 30, image: "kids-bottle" },
    { title: "Organic cotton blanket", price: 38, description: "A soft cellular blanket in organic cotton.", collection: "Nursery", stock: 14, image: "kids-baby-feet" },
  ],
  faqs: [
    { q: "Are your products safety tested?", a: "Yes. Every nursery product meets the relevant safety standards." },
    { q: "Do you offer gift wrapping?", a: "Yes, free on every order." },
  ],
};

KITS.stationery = {
  collections: ["Notebooks", "Planners", "Pens"],
  products: [
    { title: "Lined notebook", price: 22, description: "A5, 192 pages of lined paper, lay-flat binding.", collection: "Notebooks", option1: { name: "Cover", values: ["Sand", "Navy", "Sage"] }, stock: 40, featured: true, image: "paper-notebook-pencil" },
    { title: "Grid notebook", price: 22, description: "A5 dot-grid notebook with a ribbon marker.", collection: "Notebooks", stock: 35, featured: true, image: "paper-grid-notebook" },
    { title: "Travel journal", price: 28, description: "Pocket journal with a map pocket and elastic.", collection: "Notebooks", stock: 18, featured: true, image: "paper-travel-journal" },
    { title: "Weekly planner", price: 30, description: "Undated weekly planner, one week per spread.", collection: "Planners", stock: 20, featured: true, image: "paper-planner" },
    { title: "Fountain pen", price: 68, description: "A steel-nib fountain pen with a converter.", collection: "Pens", option1: { name: "Nib", values: ["Fine", "Medium"] }, stock: 10, image: "paper-fountain-pen" },
    { title: "Desk notebook", price: 18, description: "A plain notebook for the desk, 120 pages.", collection: "Notebooks", stock: 25, image: "paper-notebook-coffee" },
  ],
  faqs: [
    { q: "What paper do you use?", a: "100 gsm acid-free paper that takes fountain-pen ink without bleeding." },
    { q: "Can I order in bulk for my company?", a: "Yes. Orders of 50 or more can be personalised." },
  ],
};

KITS.wellness = {
  collections: ["Tea", "Body", "Rest"],
  products: [
    { title: "Ceremonial green tea", price: 34, description: "Stone-ground green tea, 30 g tin.", collection: "Tea", stock: 22, featured: true, image: "home-glass-jar" },
    { title: "Tea bowl", price: 42, description: "A wheel-thrown tea bowl with a matte glaze.", collection: "Tea", stock: 9, featured: true, image: "home-white-jug" },
    { title: "Calming body oil", price: 38, description: "Lavender and chamomile in jojoba oil.", collection: "Body", stock: 15, featured: true, image: "beauty-dropper-tan" },
    { title: "Bath bars", price: 18, description: "Two bars with oat and magnesium.", collection: "Body", stock: 28, image: "beauty-soap-bars" },
    { title: "Linen eye pillow", price: 26, description: "Flax-seed eye pillow in washed linen.", collection: "Rest", stock: 12, featured: true, image: "home-cushions" },
  ],
  faqs: [
    { q: "Where does your tea come from?", a: "From two family farms that grow and grind it by hand." },
    { q: "Do you ship internationally?", a: "Yes, to most countries in Europe and North America." },
  ],
};

KITS.streetwear = {
  collections: ["Tops", "Shoes", "Accessories"],
  products: [
    { title: "Heavyweight hoodie", price: 95, description: "450 gsm brushed cotton, relaxed fit.", collection: "Tops", option1: SZ(["S", "M", "L", "XL"]), stock: 12, featured: true, image: "street-grey-hoodie", images: ["street-hoodie-camera"] },
    { title: "Zip hoodie", price: 105, description: "Heavyweight zip hoodie with metal pulls.", collection: "Tops", option1: SZ(["S", "M", "L", "XL"]), stock: 9, featured: true, image: "street-hoodie-sitting" },
    { title: "Suede high-top", price: 120, description: "Moss suede high-top with a cupsole.", collection: "Shoes", option1: SZ(["40", "42", "44"]), stock: 8, featured: true, image: "shoe-green-hightops" },
    { title: "Ribbed beanie", price: 35, description: "Chunky rib in recycled wool.", collection: "Accessories", stock: 24, featured: true, image: "men-beanie" },
    { title: "Canvas pack", price: 85, description: "A roll-top pack in waxed canvas.", collection: "Accessories", stock: 10, image: "bag-canvas-backpack" },
    { title: "Utility jacket", price: 160, description: "Cotton twill jacket with four pockets.", collection: "Tops", option1: SZ(["S", "M", "L"]), stock: 6, image: "fashion-olive-jacket" },
  ],
  faqs: [
    { q: "Will a sold-out item come back?", a: "Core pieces are restocked. Seasonal drops are made once." },
    { q: "How do your hoodies fit?", a: "Relaxed. Take your usual size for a roomy fit, one size down for a closer fit." },
  ],
};

type R = [id: string, kit: string, name: string, tagline: string, industry: string, city: string, country: string, currency: string, rate: number, hero: string, about: string, lead?: string];

const SHOPS: R[] = [
  ["e-apothecary", "beauty", "Juniper & Ash", "Skincare made in small batches, the slow way.", "Skincare", "Bath", "United Kingdom", "GBP", 0.8, "beauty-soap-bars", "Juniper & Ash blends every product by hand in a small workshop. Each batch is dated so you know how fresh it is."],
  ["e-glow", "beauty", "Solace Skin", "Skincare that fits into a busy morning.", "Skincare", "Los Angeles", "United States", "USD", 1, "beauty-serum-portrait", "Solace makes three-step routines with ingredients you can pronounce."],
  ["e-salonbar", "beauty", "Atelier Mane", "Salon-quality care for your hair at home.", "Hair care", "London", "United Kingdom", "GBP", 0.85, "beauty-towel-cream", "Atelier Mane was started by two stylists who wanted their clients' hair to look as good at home as in the chair."],
  ["e-botanica", "beauty", "Fernwood Botanicals", "Botanical skincare from a garden in the hills.", "Botanical skincare", "Byron Bay", "Australia", "AUD", 1.5, "beauty-dropper-tan", "We grow most of our own botanicals and press the oils on site."],
  ["e-serum", "beauty", "Clarity Lab", "Simple formulas that do one thing well.", "Skincare", "Copenhagen", "Denmark", "DKK", 7, "beauty-dropper-tan", "Clarity Lab makes a short range of serums and creams with published concentrations."],
  ["e-maquillage", "beauty", "Maison Rouge", "Colour for evenings that matter.", "Luxury cosmetics", "Paris", "France", "EUR", 1.1, "beauty-serum-portrait", "Maison Rouge makes lipstick, blush and powder in a Paris laboratory.", "Make-up"],
  ["e-pigment", "beauty", "Brightside Cosmetics", "Bold colour, easy to wear.", "Cosmetics", "Toronto", "Canada", "CAD", 1.35, "beauty-blush-compact", "Brightside makes bright, buildable colour for every skin tone.", "Make-up"],
  ["e-bodycare", "beauty", "Softday", "Body care for every day of the week.", "Body care", "Austin", "United States", "USD", 0.9, "beauty-towel-cream", "Softday makes gentle body washes, creams and oils in Texas."],
  ["e-ritual", "beauty", "Golden Hour Rituals", "Small rituals for skin and mood.", "Wellness beauty", "Santa Monica", "United States", "USD", 1, "beauty-face-cream", "We make powders, oils and creams for daily rituals."],
  ["e-ayur", "beauty", "Terra Herbal", "Herbal skincare from old recipes.", "Herbal skincare", "Kochi", "India", "USD", 0.85, "beauty-soap-bars", "Terra Herbal works with family herb growers and makes everything in small batches."],
  ["e-kbeauty", "beauty", "Dewlight", "Layers of light, hydrating skincare.", "Skincare", "Singapore", "Singapore", "SGD", 1.35, "beauty-cream-jar", "Dewlight makes hydrating toners, serums and creams for humid climates."],
  ["e-clean", "beauty", "Bare Shelf", "The make-up you'll actually finish.", "Make-up", "Melbourne", "Australia", "AUD", 1.5, "beauty-makeup-flatlay", "Bare Shelf makes a short range of multi-use make-up in refillable cases.", "Make-up"],
  ["e-popbeauty", "beauty", "Fizz Beauty", "Loud colour for hair and skin.", "Beauty", "Miami", "United States", "USD", 0.9, "beauty-lip-balm", "Fizz makes playful hair and skin products that smell like summer.", "Make-up"],
  ["e-scent", "fragrance", "Field Notes Parfum", "Natural perfume, written like a field journal.", "Natural perfumery", "Wellington", "New Zealand", "NZD", 1.6, "frag-attar-bottle", "We make perfume from natural materials and publish every ingredient."],
  ["e-nocturne", "fragrance", "Nuit Ambrée", "Perfume for the hours after dark.", "Luxury perfume", "Monaco", "Monaco", "EUR", 1.2, "frag-violet-bottle", "Nuit Ambrée composes rich, slow perfumes in small editions."],
  ["e-carryon", "bags", "Gateway Travel Co.", "Luggage that keeps up.", "Luggage", "Vancouver", "Canada", "CAD", 1.35, "bag-duffel-sky", "Gateway designs suitcases, packs and travel pouches for frequent flyers.", "Travel"],
  ["e-maroquin", "bags", "Maison Lune", "Leather bags, quietly made in Spain.", "Leather bags", "Madrid", "Spain", "EUR", 1, "bag-cream-backpack", "Maison Lune makes small-batch leather bags in a family workshop near Ubrique.", "Small bags"],
  ["e-satchel", "bags", "Brookfield Leather", "Leather satchels for school, work and the weekend.", "Leather goods", "Leeds", "United Kingdom", "GBP", 0.8, "bag-canvas-backpack", "Brookfield has made satchels in the same Yorkshire workshop since 1989."],
  ["e-studiobag", "bags", "Atelier Dune", "Sculptural bags in soft leather.", "Designer bags", "New York", "United States", "USD", 1.2, "bag-street-handbags", "Atelier Dune designs bags with architectural shapes.", "Small bags"],
  ["e-weekender", "bags", "Northbound", "Bags for the trip, the gym and everything between.", "Travel bags", "Chicago", "United States", "USD", 1, "bag-pack-lantern", "Northbound makes weekenders and packs in recycled nylon.", "Travel"],
  ["e-optics", "eyewear", "Lens & Line", "Glasses made with care, fitted in person.", "Opticians", "Glasgow", "United Kingdom", "GBP", 0.8, "eyewear-round-portrait", "Lens & Line designs its own frames and fits them in two shops."],
  ["e-rainwear", "bags", "Stormproof", "Waterproof bags for wet cities.", "Rainwear", "Bergen", "Norway", "NOK", 10.5, "bag-leather-pack", "Stormproof makes waterproof bags and coats for wet weather.", "Backpacks"],
  ["e-sneaker", "footwear", "Common Step", "Good sneakers, nothing extra.", "Sneakers", "Portland", "United States", "USD", 1, "shoe-white-studio", "Common Step makes three sneakers and keeps improving them.", "Sneakers"],
  ["e-espadrille", "footwear", "Costa Azul", "Summer shoes made by the sea.", "Summer shoes", "Valencia", "Spain", "EUR", 0.95, "shoe-white-flatlay", "Costa Azul makes canvas and leather summer shoes in a seaside workshop."],
  ["e-leathersneaker", "footwear", "Fold & Sole", "Leather sneakers, made to last years.", "Leather sneakers", "Florence", "Italy", "EUR", 1.1, "shoe-white-above", "Fold & Sole sneakers are made in a small factory outside Florence.", "Sneakers"],
  ["e-craftshoe", "footwear", "Cobbler's Bench", "Hand-made shoes and boots.", "Handmade footwear", "Northampton", "United Kingdom", "GBP", 0.9, "men-brogues", "We make every pair by hand and resole them when they wear out.", "Classics"],
  ["e-woven", "footwear", "Sol y Sal", "Woven shoes for long summers.", "Espadrilles", "Mallorca", "Spain", "EUR", 0.7, "shoe-white-fence", "Sol y Sal makes woven summer shoes with local artisans."],
  ["e-trail", "footwear", "Ridgeback Outdoor", "Shoes for long trails.", "Trail footwear", "Boulder", "United States", "USD", 1, "shoe-hiking-boots", "Ridgeback designs hiking and trail shoes tested on mountain routes.", "Outdoor"],
  ["e-nursery", "kids", "Little Acorn", "Gentle things for the first year.", "Baby and nursery", "Brighton", "United Kingdom", "GBP", 0.85, "kids-tiny-sneakers", "Little Acorn makes nursery basics in organic cotton and natural materials."],
  ["e-paperie", "stationery", "Paper & Plume", "Notebooks and paper goods for everyday writing.", "Stationery", "Bristol", "United Kingdom", "GBP", 0.8, "paper-travel-journal", "Paper & Plume designs notebooks, planners and cards printed in Britain."],
  ["e-manual", "stationery", "Index Editions", "Design books and reissued manuals.", "Design publishing", "Brooklyn", "United States", "USD", 1.2, "paper-planner", "Index Editions publishes design books and reissues of classic graphic standards."],
  ["e-graphite", "stationery", "Lead & Line", "Pencils, pens and tools for serious writing.", "Writing tools", "Seattle", "United States", "USD", 1, "paper-fountain-pen", "Lead & Line makes pencils and pens for writers and illustrators.", "Pens"],
  ["e-stonepaper", "stationery", "Slate Notes", "Notebooks with a smaller footprint.", "Eco stationery", "Sydney", "Australia", "AUD", 1.5, "paper-grid-notebook", "Slate Notes makes notebooks from recycled and tree-free papers."],
  ["e-calm", "wellness", "Stillwater", "Tools for calmer days and deeper sleep.", "Wellness", "San Diego", "United States", "USD", 1, "home-cushions", "Stillwater makes products for rest, from eye pillows to evening teas."],
  ["e-matcha", "wellness", "Green Stone Tea", "Bright green tea for slow mornings.", "Tea", "Los Angeles", "United States", "USD", 1, "home-glass-jar", "Green Stone imports green tea from two family farms."],
  ["e-signal", "streetwear", "SIGNAL/NOISE", "Heavyweight basics and limited drops.", "Streetwear", "Berlin", "Germany", "EUR", 1, "street-grey-hoodie", "SIGNAL/NOISE makes heavyweight hoodies and tees in small runs."],
];

export const STORE2_PERSONAS: Record<string, Persona> = Object.fromEntries(SHOPS.map(([id, kit, name, tagline, industry, city, country, currency, rate, hero, about, lead]) => {
  const k = KITS[kit];
  const gal = k.products.slice(1, 3).map((p) => [p.image!, p.title] as [string, string]);
  return [id, shop(kit, { name, tagline, industry, description: tagline, about, currency, rate, city, country, hero: [hero, name], gallery: gal, lead })];
}));
