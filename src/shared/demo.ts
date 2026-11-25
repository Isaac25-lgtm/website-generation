import type { AnyAnswers } from "./generate";
import type { ImageRef, StoreSettings } from "./schema";
import type { CollectionView, ProductView } from "./render/types";
import { slugify } from "./util";
import { STORE_BASE, STORE_PERSONAS } from "./demo-store";
import { SITE_PERSONAS } from "./demo-site";
import { PERSONAL_PERSONAS } from "./demo-personal";
import { BUSINESS_PERSONAS } from "./demo-business";
import { PREMIUM_PERSONAS } from "./demo-premium";
import { BUSINESS4_PERSONAS } from "./demo-business4";
import { STORE2_PERSONAS } from "./demo-store2";
import { STORE3_PERSONAS } from "./demo-store3";

// Fictional sample content for template previews and the three public demo
// sites. Every demo is labelled as a demonstration wherever it is shown.

const art = (seed: string, alt = ""): ImageRef => ({ art: seed, alt, caption: "" });
const gal = (seed: string, n: number) => Array.from({ length: n }, (_, i) => art(`${seed}-${i}`));
/** Platform-hosted CC0 photo (public/stock/<name>.webp, see CREDITS.txt). */
const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });

export interface DemoProduct {
  title: string; price: number; compareAt?: number; description: string; collection: string; tags?: string;
  option1?: { name: string; values: string[] }; option2?: { name: string; values: string[] };
  stock?: number; featured?: boolean; digital?: boolean;
  /** stock photo name for the product image */
  image?: string;
  /** extra stock photos (hover image, product-page gallery) */
  images?: string[];
}

export interface Persona {
  answers: AnyAnswers;
  products?: DemoProduct[];
  collections?: string[];
}

export const PERSONAS: Record<string, Persona> = {
  // ─── personal ───
  "p-folio": { answers: {
    name: "Wanjiru Kamau", title: "Writer & Brand Strategist", tagline: "Words that make brands feel human.", location: "London, United Kingdom",
    bio: "I help founders and teams find the words for what they do. For eight years I've written brand stories, product launches and long-form features for clients across Europe and North America.\n\nMy process is simple: listen closely, write clearly, and edit until every sentence earns its place.",
    email: "hello@example.com", skills: "Brand voice, Copywriting, Editorial strategy, Content design, Workshops",
    projects: [
      { title: "Brand voice for a fintech launch", role: "Lead writer", period: "2025", description: "Defined tone of voice, naming and launch messaging for a mobile savings product.", tags: "Brand voice, Naming", images: [art("folio-a")] },
      { title: "Coastal travel feature series", role: "Writer", period: "2024", description: "A six-part feature series on sustainable travel along the Atlantic coast.", tags: "Editorial", images: [art("folio-b")] },
      { title: "Nonprofit annual report", role: "Editor", period: "2024", description: "Edited and structured a 40-page impact report into a clear narrative.", tags: "Editing, Reports", images: [art("folio-c")] },
    ],
    experience: [{ role: "Independent brand writer", org: "Self-employed", period: "2021 — now", description: "Brand voice, messaging and editorial work for startups and NGOs." }, { role: "Senior copywriter", org: "Agency (fictional)", period: "2017 — 2021", description: "Campaigns and content for retail and telecom clients." }],
    socials: [{ network: "LinkedIn", url: "https://www.linkedin.com/" }],
  } },
  "p-kernel": { answers: {
    name: "Tunde Adebayo", title: "Full-stack engineer", tagline: "I build fast, reliable software for the web.", location: "Berlin, Germany",
    bio: "Full-stack engineer focused on TypeScript, edge computing and data-heavy dashboards. I care about performance budgets, accessible interfaces and boring, dependable infrastructure.",
    email: "dev@example.com", skillGroups: [{ name: "Languages", items: "TypeScript, Python, SQL, Go" }, { name: "Platforms", items: "Cloudflare Workers, PostgreSQL, React, Docker" }],
    projects: [
      { title: "Logistics tracking dashboard", role: "Lead engineer", period: "2025", description: "Real-time shipment tracking for 2,000+ daily deliveries with offline-first mobile views.", tags: "React, Workers, D1", images: [art("kernel-a")], link: "https://example.com" },
      { title: "Open-source CSV validator", role: "Maintainer", period: "2024", description: "A small library that validates large CSV uploads in the browser.", tags: "TypeScript, OSS", images: [art("kernel-b")] },
      { title: "School fees payment portal", role: "Backend", period: "2023", description: "Payment reconciliation and receipts for a network of schools.", tags: "Python, SQL", images: [art("kernel-c")] },
    ],
    experience: [{ role: "Senior software engineer", org: "Logistics startup (fictional)", period: "2022 — now", location: "Remote", description: "Owns the tracking platform and developer tooling." }],
    education: [{ title: "BSc Computer Science", org: "University (fictional)", period: "2015 — 2019" }],
    socials: [{ network: "GitHub", url: "https://github.com/" }, { network: "LinkedIn", url: "https://www.linkedin.com/" }],
  } },
  "p-scholar": { answers: {
    name: "Dr. Naledi Mokoena", title: "Public health researcher", tagline: "", location: "Toronto, Canada",
    bio: "I study how community health programmes can reach more people at lower cost. My work combines field trials, survey methods and health economics.",
    email: "research@example.com", headshot: art("scholar-head", "Portrait"),
    experience: [{ role: "Senior research fellow", org: "Research institute (fictional)", period: "2020 — now", description: "Leads a programme evaluating community health worker models." }, { role: "Postdoctoral researcher", org: "University (fictional)", period: "2017 — 2020" }],
    education: [{ title: "PhD, Epidemiology", org: "University (fictional)", period: "2017" }, { title: "MPH", org: "University (fictional)", period: "2012" }],
    achievements: [{ title: "Cost-effectiveness of community health visits (journal article)", year: "2025", detail: "Sample publication entry." }, { title: "Early-career research award (sample)", year: "2023" }],
    skills: "Epidemiology, Survey design, Stata, R, Health economics",
  } },
  "p-studio": { answers: {
    name: "Kofi Mensah", title: "Illustrator & animator", tagline: "Bold pictures for brave brands.", location: "New York, United States",
    bio: "I make loud, joyful illustrations and short animations for brands, books and music. Colour first, always.",
    email: "studio@example.com",
    projects: [
      { title: "Album artwork series", period: "2025", description: "Cover art and animated loops for an independent label.", tags: "Illustration, Motion", images: [art("pop-a")] },
      { title: "Children's picture book", period: "2024", description: "32 illustrated spreads for a bilingual picture book.", tags: "Books", images: [art("pop-b")] },
      { title: "Festival identity", period: "2024", description: "Posters, stage graphics and merch for a city arts festival.", tags: "Branding", images: [art("pop-c")] },
    ],
    gallery: gal("pop-g", 6),
  } },
  "p-lens": { answers: {
    name: "Amina Yusuf", title: "Documentary & portrait photographer", tagline: "Light, people and the places between.", location: "Lisbon, Portugal",
    bio: "I photograph people where they live and work, and the landscapes that shape them. For six years I've worked with newspapers, NGOs and families across Europe and beyond.\n\nAvailable for editorial, documentary and portrait commissions.",
    email: "photo@example.com", heroImage: st("photo-hero", "A small boat on a misty lake at sunrise"),
    gallery: [
      st("photo-portrait-smile", "Portrait of a young woman laughing"), st("photo-fisherman-gold", "A fisherman walking ashore at golden hour"),
      st("photo-teal-lake", "A teal mountain lake seen from above"), st("photo-street-artist", "A street artist drawing portraits"),
      st("photo-sea", "A woman standing in shallow sea water"), st("photo-misty-mountains", "Mist rolling over forested mountains"),
      st("photo-elder", "Black and white portrait of an elderly man"), st("photo-kayak", "View from a kayak on a calm lake"),
      st("photo-boat", "A lone boat on a still horizon"),
    ],
    projects: [
      { title: "Lake communities", period: "2025", role: "Photographer", description: "A year-long documentary series following fishing families on the lake: early mornings, long days and the markets that depend on them.", tags: "Documentary, Editorial", images: [st("photo-fisherman-bw", "Fisherman steering a boat"), st("photo-fisherman-gold", "Fisherman at golden hour"), st("photo-boat", "Boat on the horizon")] },
      { title: "Makers", period: "2024", role: "Photographer", description: "Portraits of artists and craftspeople, made where they work.", tags: "Portraits", images: [st("photo-street-artist", "Street artist at work"), st("photo-portrait-smile", "Portrait of a young woman"), st("photo-elder", "Portrait of an elderly man")] },
    ],
    socials: [{ network: "Instagram", url: "https://www.instagram.com/" }],
  } },
  "p-aura": { answers: {
    name: "Grace Njeri", title: "Career coach & speaker", tagline: "Find work that fits the life you want.", location: "Online · Worldwide",
    bio: "I help professionals navigate career changes with clarity and confidence through 1:1 coaching, workshops and talks.",
    email: "coach@example.com", primaryCta: "booking", bookingUrl: "https://example.com/book",
    projects: [{ title: "1:1 career coaching", description: "Six sessions to map your strengths, options and next move.", images: [art("aura-a")] }, { title: "Team workshops", description: "Interactive workshops on feedback, growth and wellbeing at work.", images: [art("aura-b")] }],
  } },
  // ─── business ───
  "b-meridian": { answers: {
    businessName: "Kingsway Advisory", tagline: "Clear advice for growing businesses.", industry: "Business consulting", city: "London", country: "United Kingdom",
    description: "Financial, tax and strategy advisory for small and medium-sized businesses across the UK and Europe.",
    about: "We work alongside owners and finance teams to build sound systems, plan for growth and stay compliant. Every engagement is led by a senior advisor.",
    benefits: "Senior advisors on every project\nFixed-fee engagements\nPractical, plain-language reports",
    heroImage: st("biz-hero", "An advisor meeting a client by a window overlooking the city"),
    gallery: [
      st("biz-team", "The advisory team in a planning meeting"), st("biz-review", "Advisors reviewing a client's figures together"),
      st("biz-office", "Glass-walled meeting rooms in the office"), st("biz-handshake", "A handshake across a meeting table"),
    ],
    services: [
      { title: "Financial planning", description: "Budgets, forecasts and cash-flow models you can actually use.", price: "From £1,500", image: st("biz-analytics", "A laptop showing financial charts") },
      { title: "Tax advisory", description: "Planning and compliance support for growing companies.", price: "From £900", image: st("biz-papers", "Working through tax papers at a desk") },
      { title: "Business strategy", description: "Market entry, pricing and growth planning workshops.", price: "From £2,400", image: st("biz-workshop", "A strategy workshop with a client team") },
    ],
    faqs: [{ q: "How do engagements start?", a: "With a free 30-minute call to understand your goals, then a fixed-fee proposal." }, { q: "Do you work with businesses outside London?", a: "Yes. We work with clients across the UK and Europe, in person or online." }, { q: "How are fees agreed?", a: "Every engagement has a fixed fee agreed in writing before work begins." }],
    phone: "+44 20 7946 0123", email: "info@example.com", address: "1 Sample Street, Canary Wharf", mapQuery: "Canary Wharf, London", primaryGoal: "form", quoteForm: true,
    hours: [{ days: "Monday – Friday", hours: "8:30 – 17:30" }],
  } },
  "b-localpro": { answers: {
    businessName: "Bright Plumbing & Repairs", tagline: "Fast, honest home repairs.", industry: "Home services", city: "Austin", country: "United States",
    description: "Plumbing, electrical and general home repairs across Austin. Call or message us for a visit.",
    about: "A small team of qualified technicians handling leaks, installations and repairs for homes and offices.",
    services: [{ title: "Leak repairs", description: "Taps, pipes, tanks and toilets fixed properly.", price: "From $90" }, { title: "Installations", description: "Water heaters, sinks, showers and pumps." }, { title: "Electrical fixes", description: "Sockets, lighting and safe wiring checks." }],
    phone: "+1 512 555 0142", whatsapp: "+15125550142", whatsappFloat: true, primaryGoal: "whatsapp", serviceAreas: "Austin and Round Rock", address: "Sample Avenue, East Austin", mapQuery: "East Austin, Texas",
    hours: [{ days: "Mon – Sat", hours: "7:00 – 19:00" }],
  } },
  "b-savanna": { answers: {
    businessName: "Kijani Trails", tagline: "Small-group wildlife journeys, expertly guided.", industry: "Tours & safaris", city: "London", country: "United Kingdom",
    description: "Guided safaris, mountain treks and nights under the stars in the world's great parks, with local guides who know every track.",
    about: "Kijani Trails runs small-group trips that put local guides and communities first. Groups stay small, between two and eight travellers, so every trip feels personal and every sighting is yours to enjoy.",
    benefits: "Local, licensed guides\nGroups of 2–8 travellers\nTailor-made itineraries",
    heroImage: st("safari-hero", "A traveller watching elephants from a safari vehicle"),
    gallery: [
      st("safari-giraffe", "A giraffe browsing beside an acacia tree"), st("safari-lion", "A male lion resting"), st("safari-sunset-giraffe", "A giraffe silhouetted at sunset"),
      st("safari-zebra", "A zebra grazing"), st("safari-plains", "Sunset over open plains"), st("safari-dust", "A safari vehicle on a dusty game drive"),
    ],
    services: [
      { title: "Classic safari", description: "Five days across the northern parks in an open-roof vehicle with an expert guide.", price: "From $1,450", image: st("safari-drive", "Safari vehicle on the savanna") },
      { title: "Mountain treks", description: "Guided multi-day hikes with porters, cooks and camp crews.", price: "From $980", image: st("safari-trek", "A hiker on a mountain ridge") },
      { title: "Fly-camp nights", description: "Sleep out in the bush under a sky full of stars, with a private camp team.", price: "From $420", image: st("safari-camp", "A lit tent under the night sky") },
    ],
    email: "trips@example.com", whatsapp: "+447700900123", whatsappFloat: true, primaryGoal: "quote", quoteForm: true,
    faqs: [{ q: "How big are your groups?", a: "Between 2 and 8 travellers." }, { q: "Can you arrange airport transfers?", a: "Yes, on request when you book." }, { q: "When is the best time to travel?", a: "June to October for the dry season, but every month has something special. Ask us." }],
  } },
  "b-atelier": { answers: {
    businessName: "Form Studio", tagline: "Architecture and interiors with restraint.", industry: "Architecture", city: "Copenhagen", country: "Denmark",
    description: "Residential and small commercial projects designed for light, material and longevity.",
    about: "Form Studio is a small practice working on homes, studios and workplaces.",
    services: [{ title: "Residential architecture", description: "New homes and renovations from concept to completion." }, { title: "Interior design", description: "Material palettes, joinery and furniture." }, { title: "Feasibility studies", description: "Site analysis, massing and budget guidance." }],
    gallery: gal("atl-g", 6), email: "studio@example.com", primaryGoal: "email",
  } },
  "b-pulse": { answers: {
    businessName: "Nimbus Digital", tagline: "Software products, shipped.", industry: "Software agency", city: "Singapore", country: "Singapore",
    description: "We design and build web apps, mobile apps and internal tools for ambitious teams.",
    about: "A senior team of designers and engineers delivering in small, predictable sprints.",
    services: [{ title: "Product design", description: "Research, UX and interface design." }, { title: "Web & mobile apps", description: "Production-grade apps with modern stacks." }, { title: "Cloud & DevOps", description: "Reliable infrastructure and CI/CD." }],
    email: "hello@example.com", primaryGoal: "quote", quoteForm: true,
  } },
  "b-harvest": { answers: {
    businessName: "Mama Rosa's Kitchen", tagline: "Home-style cooking, every day.", industry: "Restaurant", city: "Melbourne", country: "Australia",
    description: "Fresh seasonal dishes, cooked daily. Eat in, take away or order for events.",
    about: "A family kitchen serving the dishes we grew up with.",
    services: [{ title: "Hand-made pappardelle", description: "Slow-cooked beef ragù and parmesan.", price: "A$26" }, { title: "Wood-fired margherita", description: "San Marzano tomato, fior di latte and basil.", price: "A$22" }, { title: "Tiramisu", description: "Made fresh every morning.", price: "A$12" }, { title: "Event catering", description: "Trays for 20–200 guests.", price: "On request" }],
    phone: "+61 3 5550 1234", address: "Sample Street, Fitzroy", mapQuery: "Fitzroy, Melbourne", primaryGoal: "call",
    hours: [{ days: "Mon – Fri", hours: "11:00 – 21:00" }, { days: "Sat – Sun", hours: "12:00 – 22:00" }], heroImage: art("harvest-hero"),
  } },
  // ─── e-commerce ───
  "e-maison": {
    answers: { storeName: "Maison Nia", tagline: "Considered clothing, made in Paris.", industry: "Fashion", description: "Small-batch womenswear and accessories in natural fabrics.", about: "Maison Nia is a small atelier making timeless pieces in limited runs. Every garment is cut and finished by hand in our Paris studio.", currency: "EUR", country: "France", city: "Paris", whatsapp: "+33199000001", email: "shop@example.com", heroImage: st("fashion-hero", "Two women in floral dresses holding a hydrangea"), gallery: [st("fashion-atelier", "Inside the atelier, among rails of clothing")], promoBanner: "Free studio pickup in Paris", store: STORE_BASE("EUR", "Tracked delivery", 600, "Studio pickup") },
    collections: ["Dresses", "Tops & jackets", "Accessories"],
    products: [
      { title: "Floral wrap dress", price: 68, description: "A relaxed wrap dress in printed cotton with a tie waist and flutter sleeves.", collection: "Dresses", option1: { name: "Size", values: ["S", "M", "L"] }, option2: { name: "Colour", values: ["Navy", "Blush"] }, stock: 4, featured: true, image: "fashion-floral-dress" },
      { title: "Black slip dress", price: 54, compareAt: 64, description: "A bias-cut slip dress that layers easily, day to night.", collection: "Dresses", option1: { name: "Size", values: ["S", "M", "L"] }, stock: 6, featured: true, image: "fashion-slip-dress" },
      { title: "Olive utility jacket", price: 89, description: "Structured cotton twill with a high collar and tonal buttons.", collection: "Tops & jackets", option1: { name: "Size", values: ["S", "M", "L"] }, stock: 5, featured: true, image: "fashion-olive-jacket" },
      { title: "Cream lace blouse", price: 42, description: "Soft lace sleeves and a relaxed body in natural cream.", collection: "Tops & jackets", option1: { name: "Size", values: ["S", "M", "L"] }, stock: 8, featured: true, image: "fashion-lace-blouse" },
      { title: "Tie-neck camisole", price: 32, description: "A fluid camisole with a ribbon tie at the neck.", collection: "Tops & jackets", option1: { name: "Size", values: ["S", "M", "L"] }, stock: 0, image: "fashion-tie-top" },
      { title: "Leather weekender", price: 120, description: "Full-grain leather holdall with brass hardware and a shoulder strap.", collection: "Accessories", stock: 3, featured: true, image: "fashion-weekender" },
      { title: "Canvas mini backpack", price: 46, description: "A compact everyday backpack with a drawstring top.", collection: "Accessories", stock: 7, image: "fashion-backpack" },
      { title: "Spiral brass earrings", price: 18, description: "Hand-formed brass spirals on hypoallergenic hooks.", collection: "Accessories", stock: 12, featured: true, image: "fashion-earrings" },
    ] },
  "e-volt": {
    answers: { storeName: "Voltline", tagline: "Gadgets that just work.", industry: "Electronics", description: "Phone accessories, audio and smart-home gear with a two-year warranty.", about: "Voltline tests every product for a month before it goes on sale, and stocks only what passes. Every item carries a two-year warranty, handled by our own support team in San Francisco.", faqs: [{ q: "What does the warranty cover?", a: "Faults in materials and workmanship for two years from delivery. We repair or replace the item." }, { q: "How fast is shipping?", a: "Orders placed before 2 pm ship the same day." }], currency: "USD", country: "United States", city: "San Francisco", whatsapp: "+14155550123", store: STORE_BASE("USD", "Standard shipping", 500, "Store pickup") },
    collections: ["Audio", "Power", "Smart home"],
    products: [
      { title: "Wireless earbuds Pro", price: 49, description: "Noise reduction, 24h battery with case.", collection: "Audio", option1: { name: "Colour", values: ["Black", "White"] }, stock: 10, featured: true },
      { title: "20,000 mAh power bank", price: 29, description: "Fast charge, two USB-C ports.", collection: "Power", stock: 15, featured: true },
      { title: "Bluetooth speaker", price: 39, description: "Splash-proof speaker with 12h playtime.", collection: "Audio", stock: 3, featured: true },
      { title: "Smart plug (2-pack)", price: 24, description: "Schedule and control appliances from your phone.", collection: "Smart home", stock: 9, featured: true },
      { title: "65W USB-C charger", price: 22, description: "Charges laptops, tablets and phones.", collection: "Power", stock: 20 },
    ] },
  "e-fresh": {
    answers: { storeName: "Field & Basket", tagline: "Farm-fresh groceries to your door.", industry: "Groceries", description: "Fruit, vegetables and pantry staples from independent farms.", about: "Field & Basket buys directly from twelve independent farms within 80 miles of London. We pack orders the morning they are delivered, so produce is usually picked the day before.", faqs: [{ q: "When do you deliver?", a: "Every day except Sunday, between 8 am and 8 pm." }, { q: "What if something is not fresh?", a: "Tell us within 24 hours and we will refund or replace it." }], currency: "GBP", country: "United Kingdom", city: "London", whatsapp: "+447700900456", promoBanner: "Free delivery on orders over £40", store: STORE_BASE("GBP", "Same-day delivery", 399, "Market stall pickup") },
    collections: ["Fruit", "Vegetables", "Pantry"],
    products: [
      { title: "Seasonal veg box", price: 18, description: "A week of seasonal vegetables for two.", collection: "Vegetables", stock: 20, featured: true },
      { title: "Avocados (4 pack)", price: 4.5, description: "Ripe Hass avocados.", collection: "Fruit", stock: 30, featured: true },
      { title: "Pineapple", price: 2.5, description: "Sweet, ready to eat.", collection: "Fruit", stock: 25, featured: true },
      { title: "Peanut butter 500g", price: 5.5, description: "Stone-ground, no additives.", collection: "Pantry", stock: 14, featured: true },
      { title: "Vine tomatoes 1kg", price: 3.2, description: "Firm, ripe tomatoes.", collection: "Vegetables", stock: 40 },
      { title: "Wildflower honey 340g", price: 9, description: "Raw honey from a farm cooperative.", collection: "Pantry", stock: 2 },
    ] },
  "e-lumiere": {
    answers: { storeName: "Lumière Botanics", tagline: "Gentle skincare from botanical oils.", industry: "Skincare", description: "Small-batch skincare made with shea, marula and baobab.", about: "Lumière Botanics makes face and body care in small batches in Sydney. Every formula uses cold-pressed plant oils, and every batch is dated so you know how fresh it is.", faqs: [{ q: "Are your products suitable for sensitive skin?", a: "Most are fragrance-free. Each product page lists every ingredient." }, { q: "How long do products last?", a: "Twelve months unopened, six months once opened." }], currency: "USD", country: "Australia", city: "Sydney", store: STORE_BASE("USD", "Courier delivery", 600, "Studio collection") },
    collections: ["Face", "Body"],
    products: [
      { title: "Marula face oil", price: 28, description: "Lightweight daily face oil.", collection: "Face", stock: 12, featured: true },
      { title: "Shea body butter", price: 22, description: "Rich whipped shea butter.", collection: "Body", option1: { name: "Size", values: ["100ml", "250ml"] }, stock: 10, featured: true },
      { title: "Baobab cleansing balm", price: 24, description: "Melts away make-up and SPF.", collection: "Face", stock: 7, featured: true },
    ] },
  "e-craft": {
    answers: { storeName: "Hearth & Hand", tagline: "Handmade by artisans, made to last.", industry: "Handmade goods", description: "Baskets, ceramics and textiles from artisan cooperatives.", about: "Every piece is made by hand by a cooperative member.", currency: "USD", country: "Canada", city: "Vancouver", store: STORE_BASE("USD", "Courier delivery", 800, "Workshop pickup") },
    collections: ["Baskets", "Ceramics", "Textiles"],
    products: [
      { title: "Sisal market basket", price: 35, description: "Hand-woven sisal basket with leather straps.", collection: "Baskets", stock: 6, featured: true },
      { title: "Speckled stoneware mug", price: 16, description: "Wheel-thrown mug, food safe glaze.", collection: "Ceramics", stock: 14, featured: true },
      { title: "Striped cotton throw", price: 29, description: "Soft woven cotton throw.", collection: "Textiles", stock: 5, featured: true },
      { title: "Serving bowl", price: 38, description: "Large hand-glazed serving bowl.", collection: "Ceramics", stock: 3, featured: true },
    ] },
  "e-concrete": {
    answers: { storeName: "CONCRETE", tagline: "Streetwear from the block.", industry: "Streetwear", description: "Heavyweight tees, hoodies and caps.", about: "CONCRETE prints heavyweight tees and hoodies in small runs in Los Angeles. Each drop is printed once and not restocked.", faqs: [{ q: "How do your tees fit?", a: "Boxy and slightly cropped. Take your usual size for the intended fit." }, { q: "Will a sold-out drop come back?", a: "No. Each design is printed once." }], currency: "USD", country: "United States", city: "Los Angeles", store: STORE_BASE("USD", "Standard shipping", 500, "Pickup") },
    collections: ["Tees", "Hoodies", "Caps"],
    products: [
      { title: "Heavyweight logo tee", price: 30, description: "300gsm cotton, boxy fit.", collection: "Tees", option1: { name: "Size", values: ["S", "M", "L", "XL"] }, option2: { name: "Colour", values: ["Black", "Bone"] }, stock: 6, featured: true },
      { title: "Block hoodie", price: 65, description: "Brushed fleece, oversized hood.", collection: "Hoodies", option1: { name: "Size", values: ["M", "L", "XL"] }, stock: 4, featured: true },
      { title: "Five-panel cap", price: 25, description: "Nylon cap with embroidered patch.", collection: "Caps", stock: 9, featured: true },
      { title: "Graphic tee 02", price: 32, description: "Screen-printed graphic tee.", collection: "Tees", option1: { name: "Size", values: ["S", "M", "L"] }, stock: 7, featured: true },
    ] },
  ...STORE_PERSONAS,
  ...SITE_PERSONAS,
  ...PERSONAL_PERSONAS,
  ...BUSINESS_PERSONAS,
  ...PREMIUM_PERSONAS,
  ...BUSINESS4_PERSONAS,
  ...STORE2_PERSONAS,
  ...STORE3_PERSONAS,
};

/** Expand a demo product list into ProductViews (for template previews rendered in memory). */
export function demoProductViews(persona: Persona, currency: string): { products: ProductView[]; collections: CollectionView[] } {
  const collections: CollectionView[] = (persona.collections ?? []).map((name, i) => ({ id: `c${i}`, name, handle: slugify(name), description: "" }));
  const minor = (v: number) => (["UGX", "JPY", "RWF", "KRW"].includes(currency) ? Math.round(v) : Math.round(v * 100));
  const products: ProductView[] = (persona.products ?? []).map((p, i) => {
    const o1 = p.option1?.values ?? [null];
    const o2 = p.option2?.values ?? [null];
    const variants = o1.flatMap((a) => o2.map((b) => ({ a, b })));
    const stock = p.stock ?? 5;
    return {
      id: `p${i}`, title: p.title, handle: slugify(p.title), description: p.description,
      priceMinor: minor(p.price), compareAtMinor: p.compareAt ? minor(p.compareAt) : null, currency,
      images: p.image ? [st(p.image, p.title), ...(p.images ?? []).map((n, k) => st(n, `${p.title}, view ${k + 2}`))] : [art(`${p.title}-img`, p.title)], tags: (p.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      collections: [slugify(p.collection)], featured: !!p.featured, productType: p.digital ? "digital" : "physical",
      option1Name: p.option1?.name ?? null, option2Name: p.option2?.name ?? null, maxPerOrder: 10, createdAt: i,
      variants: variants.map((v, j) => ({
        id: `p${i}v${j}`, title: [v.a, v.b].filter(Boolean).join(" / ") || "Default", option1: v.a, option2: v.b,
        priceMinor: minor(p.price), available: stock > 0, stock, backorder: false,
      })),
    };
  });
  return { products, collections };
}

/** The three publicly linked demo sites (one per paid product). */
export const PUBLIC_DEMOS = [
  { slug: "demo-portfolio", templateId: "p-lens", type: "personal" as const, name: "Demo: Amina Yusuf photography" },
  { slug: "demo-business", templateId: "b-meridian", type: "business" as const, name: "Demo: Kingsway Advisory" },
  { slug: "demo-store", templateId: "e-maison", type: "ecommerce" as const, name: "Demo: Maison Nia store" },
];
