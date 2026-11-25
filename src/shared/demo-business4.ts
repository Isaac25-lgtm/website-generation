import type { ImageRef } from "./schema";
import type { Persona } from "./demo";

// Fictional businesses for the premium business templates, built from industry kits.
// Names are invented and unrelated to the reference sites; photos are CC0.

const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });
const svc = (title: string, description: string, image: ImageRef, price = "") => ({ title, description, price, image });

interface Kit { services: ReturnType<typeof svc>[]; benefits: string; gallery: ImageRef[]; faqs: { q: string; a: string }[] }

const KITS: Record<string, Kit> = {
  studio: {
    services: [svc("Brand identity", "Strategy, naming and visual identity.", st("work-sketches", "Identity sketches"), "From $9,000"), svc("Websites", "Design and build of fast, accessible sites.", st("work-wireframes", "Wireframes"), "From $12,000"), svc("Packaging", "Labels, boxes and retail displays.", st("home-bud-vases", "Packaged ceramics"), "From $6,000")],
    benefits: "Senior team on every project\nFixed proposals\nHand-over files you own",
    gallery: [st("work-pattern", "A sculptural pattern"), st("obj-journal", "Sketchbook"), st("biz-glass", "Office building"), st("home-white-room", "Studio space")],
    faqs: [{ q: "How long does a brand project take?", a: "Usually eight to twelve weeks." }, { q: "Do you work with small companies?", a: "Yes. Most of our clients have fewer than fifty people." }],
  },
  industry: {
    services: [svc("Engineering", "Design and testing of equipment and plant.", st("make-tools", "Workshop tools"), ""), svc("Manufacturing", "Small-batch production in our own facility.", st("make-bench", "A workbench"), ""), svc("Field service", "Installation, maintenance and support on site.", st("safari-drive", "A vehicle on a field site"), "")],
    benefits: "Own test facility\nCertified engineers\nSupport in the field",
    gallery: [st("biz-facade-bw", "Our building"), st("make-apron", "An engineer at work"), st("photo-misty-mountains", "A field site"), st("biz-team", "The team")],
    faqs: [{ q: "Do you work outside your region?", a: "Yes, with partners in several countries." }, { q: "Can you build to our specification?", a: "Yes. Send us drawings and we will quote within ten days." }],
  },
  finance: {
    services: [svc("Long-term investment", "Patient capital for profitable private companies.", st("biz-dark-boardroom", "A boardroom"), ""), svc("Property", "Residential and commercial buildings held for decades.", st("biz-towers", "Office towers"), ""), svc("Family governance", "Structures that help families decide together.", st("biz-window-table", "A meeting by a window"), "")],
    benefits: "Independent and family-owned\nTen-year holding periods\nNo outside funds",
    gallery: [st("biz-boardroom", "Boardroom"), st("biz-review", "Reviewing figures"), st("biz-office", "Office")],
    faqs: [{ q: "Do you take outside money?", a: "No. We invest only family capital." }, { q: "What size of company do you back?", a: "Profitable companies with revenue between two and fifty million." }],
  },
  health: {
    services: [svc("Primary care", "Family doctors and nurses in twelve neighbourhood clinics.", st("pro-desk-woman", "A clinician at a desk"), ""), svc("Mental health", "Counselling and therapy, in person or online.", st("pro-window-woman", "A counsellor by a window"), ""), svc("Community programmes", "Health education in schools and workplaces.", st("biz-workshop", "A community workshop"), "")],
    benefits: "Same-week appointments\nCare in five languages\nFees on a sliding scale",
    gallery: [st("biz-team", "Our team"), st("home-white-room", "A clinic room"), st("biz-window-table", "A consultation")],
    faqs: [{ q: "Do I need a referral?", a: "No. You can book directly." }, { q: "Do you offer online sessions?", a: "Yes, for counselling and follow-up appointments." }],
  },
  property: {
    services: [svc("Mountain residences", "Apartments with views across the valley.", st("photo-misty-mountains", "Mountains in mist"), "From €640,000"), svc("Hotel suites", "Serviced suites managed by our team.", st("stay-room-green", "A hotel suite"), "From €420,000"), svc("Chalets", "Five private chalets on the upper slope.", st("home-leather-armchair", "A chalet interior"), "From €1.4m")],
    benefits: "Built to passive-house standard\nManaged by an on-site team\nTen minutes from the lifts",
    gallery: [st("photo-teal-lake", "A mountain lake"), st("home-loft", "Residence interior"), st("stay-white-bed", "A suite bedroom")],
    faqs: [{ q: "When will the development be complete?", a: "The first residences are handed over next winter." }, { q: "Can buyers rent out their homes?", a: "Yes, through our management programme." }],
  },
  food: {
    services: [svc("Plant-based burgers", "Grilled, juicy and made from peas and beets.", st("home-coffee-table", "A table set for lunch"), ""), svc("For restaurants", "Bulk packs and chef support.", st("make-ceramics-shelf", "Kitchen shelves"), ""), svc("In stores", "Find us in the chilled aisle.", st("fashion-boutique-rails", "A store display"), "")],
    benefits: "Made in our own kitchens\nNo artificial colours\nSold in 400 stores",
    gallery: [st("home-dining", "Dinner table"), st("home-kitchen", "Our kitchen"), st("biz-team", "The team")],
    faqs: [{ q: "Where can I buy your products?", a: "In supermarkets across the country, and online." }, { q: "Are your products gluten free?", a: "Most are. Every pack lists the ingredients." }],
  },
  publishing: {
    services: [svc("Books", "Four new titles a year, printed in small runs.", st("obj-old-books", "Books on a shelf"), "From £14"), svc("Prints", "Limited-edition prints from our archive.", st("work-drawing", "A drawing"), "From £40"), svc("Archive visits", "Reading-room appointments for researchers.", st("obj-book-pages", "An open book"), "By appointment")],
    benefits: "Independent since 1998\nPrinted locally\nOpen archive",
    gallery: [st("obj-open-book", "An open book"), st("obj-journal", "Notebook"), st("pro-reader-woman", "A reader")],
    faqs: [{ q: "Do you accept manuscripts?", a: "Yes, twice a year. Check the dates on our contact page." }, { q: "Can I visit the archive?", a: "Yes, by appointment on weekdays." }],
  },
  events: {
    services: [svc("Main stage", "Two days of talks from builders and artists.", st("pro-speaker-man", "A speaker on stage"), "From $480"), svc("Workshops", "Small hands-on sessions.", st("biz-workshop", "A workshop"), "From $120"), svc("Partner programme", "For companies who want to take part.", st("biz-boardroom", "A partner meeting"), "On request")],
    benefits: "Two days, 3,000 guests\nSixty sessions\nHeld in a former factory",
    gallery: [st("stay-lobby", "The venue"), st("biz-team", "Guests"), st("pro-speaker-woman", "A talk")],
    faqs: [{ q: "When is the next edition?", a: "Every May. Dates are announced in January." }, { q: "Are tickets refundable?", a: "Tickets can be transferred to another person at no charge." }],
  },
};

type Row = [id: string, name: string, tagline: string, industry: string, city: string, country: string, description: string, about: string, hero: string, kit: keyof typeof KITS];

const ROWS: Row[] = [
  ["b-colorword", "Bright & Fable", "A brand agency for companies that make things people use every day.", "Brand agency", "Brooklyn", "United States", "Identity, packaging and campaigns for consumer brands.", "Bright & Fable is fourteen designers and writers.", "", "studio"],
  ["b-ragged", "Flint Harbour", "Brands with a bit of grit.", "Branding agency", "Glasgow", "United Kingdom", "Branding and film for food, drink and outdoor companies.", "We are a branding and film studio working with companies that make real things.", "safari-dust", "studio"],
  ["b-blueprint", "Ledger Line Trust", "Infrastructure finance, built to last fifty years.", "Infrastructure finance", "Toronto", "Canada", "Long-term finance for bridges, water and energy projects.", "We lend to public infrastructure projects and stay with them for decades.", "", "finance"],
  ["b-typeintro", "Halden Works", "We design objects, spaces and stories with care, slowly.", "Design collective", "Copenhagen", "Denmark", "A collective of designers working across products and spaces.", "Halden Works is a small collective of independent designers sharing one studio.", "", "studio"],
  ["b-bigword", "Kvadrat Nine", "Architecture and design from a small studio by the sea.", "Design studio", "Bergen", "Norway", "Houses, interiors and furniture.", "A studio of six architects and designers.", "", "studio"],
  ["b-headline", "Fieldwork Co.", "We make brands, websites and the things in between.", "Design studio", "Melbourne", "Australia", "Design for hospitality, retail and culture.", "Fieldwork is a studio of twelve, working with independent businesses.", "", "studio"],
  ["b-dark3d", "Volume", "Objects, renders and identities with weight.", "3D and design studio", "Bucharest", "Romania", "3D product visuals and identities.", "Volume makes product renders and identities for consumer brands.", "work-pattern", "studio"],
  ["b-marquee", "Northline", "A design studio measured by what changed for our clients.", "Design studio", "Oslo", "Norway", "Product, brand and digital design.", "Northline works with growing companies in Scandinavia.", "", "studio"],
  ["b-pixel", "Ashgrove Holdings", "Patient capital for good companies.", "Family office", "Zurich", "Switzerland", "A family office investing in private companies and property.", "Ashgrove has invested one family's capital since 1987.", "", "finance"],
  ["b-alpine", "Valmont Residences", "Homes above the valley, built to last.", "Mountain real estate", "Chamonix", "France", "Residences, suites and chalets on the upper slope.", "Valmont is a small development of forty homes built to passive-house standards.", "photo-misty-mountains", "property"],
  ["b-orbit", "Meridian Orbital", "Seeing the planet clearly, every day.", "Earth observation", "Toulouse", "France", "Satellites and imaging for agriculture and climate research.", "We build small imaging satellites and sell the data to researchers and farmers.", "photo-teal-lake", "industry"],
  ["b-aerial", "Greenfield Materials", "Cleaner chemicals, made from plants.", "Materials manufacturer", "Houston", "United States", "Bio-based chemicals for cleaning, farming and water treatment.", "We turn plant sugars into everyday chemicals in our own plant.", "safari-plains", "industry"],
  ["b-silhouette", "Northwind Robotics", "Inspection robots for bridges, tunnels and pipelines.", "Robotics", "Pittsburgh", "United States", "Robots and drones that inspect infrastructure safely.", "Northwind builds inspection robots so people don't have to climb into dangerous places.", "photo-misty-mountains", "industry"],
  ["b-earth", "Deepcore Energy", "Heat from the ground, for whole towns.", "Geothermal energy", "Reykjavík", "Iceland", "Geothermal plants and district heating.", "Deepcore drills, builds and runs geothermal heating plants.", "safari-plains", "industry"],
  ["b-technical", "Fluxion Power", "Compact power units for remote sites.", "Energy hardware", "Seattle", "United States", "Power units for clinics, towers and field stations.", "Fluxion designs and builds compact power units.", "make-tools", "industry"],
  ["b-alliance", "Harbourline Health", "Care that starts in your neighbourhood.", "Community health network", "Liverpool", "United Kingdom", "Twelve neighbourhood clinics and community programmes.", "Harbourline is a not-for-profit network of community clinics.", "biz-team", "health"],
  ["b-typing", "Two Rivers Studio", "We design and build websites and apps for companies that would rather not think about software.", "Design and development studio", "Kraków", "Poland", "Websites, apps and internal tools.", "A studio of nine designers and developers.", "", "studio"],
  ["b-objects", "Form & Matter", "Industrial design for products people keep.", "Industrial design studio", "Milan", "Italy", "Product design, prototyping and production support.", "Form & Matter designs furniture, lighting and kitchenware.", "", "studio"],
  ["b-devices", "Brightwater Digital", "Websites and apps for ambitious small businesses.", "Digital agency", "Auckland", "New Zealand", "Design, development and support.", "A team of eleven designers and developers.", "", "studio"],
  ["b-founder", "Mara Ellison Studio", "I help agencies grow without burning out their teams.", "Agency consultancy", "Austin", "United States", "Operations and growth consulting for agencies.", "I ran an agency for twelve years. Now I help other founders build calmer ones.", "pro-glasses-woman", "studio"],
  ["b-care", "Willow Room Therapy", "Therapy that feels like a conversation.", "Therapy practice", "Brighton", "United Kingdom", "Counselling for adults, couples and young people.", "Willow Room is a practice of six accredited therapists.", "pro-window-woman", "health"],
  ["b-grid", "Cycle Industrial", "We recover metals and plastics from factory waste.", "Industrial recycling", "Rotterdam", "Netherlands", "Collection, sorting and recovery for manufacturers.", "Cycle Industrial runs three recovery plants serving 400 factories.", "", "industry"],
  ["b-leather", "Tannery Row", "Leather tanned slowly, the old way.", "Leather manufacturer", "Porto", "Portugal", "Vegetable-tanned leather for makers and brands.", "We tan leather with plant extracts in a family tannery.", "fashion-weekender", "industry"],
  ["b-packshot", "Shelf Life Studio", "Packaging that sells itself.", "Packaging studio", "Philadelphia", "United States", "Packaging and branding for food and drink.", "Shelf Life designs packaging for independent food brands.", "", "studio"],
  ["b-blackgrid", "Obsidian & Oak", "Products designed to be kept.", "Product studio", "London", "United Kingdom", "Product and brand design.", "A product studio designing homeware and accessories.", "", "studio"],
  ["b-friendly", "Clearview Research", "We find out what your customers think, and why.", "Research firm", "Dublin", "Ireland", "Customer research, surveys and workshops.", "Clearview is a team of researchers and analysts.", "biz-workshop", "studio"],
  ["b-consult", "Keel Systems", "We connect the software your business already has.", "Systems consultancy", "Nairobi", "Kenya", "Integration and process consulting for growing businesses.", "Keel helps businesses join up their accounting, stock and sales systems.", "", "studio"],
  ["b-venture", "Lantern Ventures", "We back founders building in hard industries.", "Venture capital", "San Francisco", "United States", "Early investment in industrial, energy and health companies.", "Lantern invests at the first round and stays for the long run.", "", "finance"],
  ["b-huge", "Loud Matter", "Digital Experiences", "Creative agency", "New York", "United States", "Campaigns, sites and products for global brands.", "A creative agency of forty.", "", "studio"],
  ["b-unseen", "Quiet Room Studio", "Films, identities and digital work.", "Creative studio", "Berlin", "Germany", "Film, identity and digital.", "A small creative studio.", "", "studio"],
  ["b-phantom", "Blink & Co.", "Brand, digital and motion for curious companies.", "Creative agency", "Lisbon", "Portugal", "Brand, digital and motion design.", "An agency of twenty designers and animators.", "", "studio"],
  ["b-trionn", "Arcline Digital", "Digital products for ambitious companies.", "Digital agency", "Ahmedabad", "India", "Websites, apps and digital products.", "A team of thirty designers and engineers.", "", "studio"],
  ["b-twotone", "Second Light", "A studio for brands and the people behind them.", "Creative studio", "Vienna", "Austria", "Brand strategy and design.", "Second Light is a studio of eight.", "", "studio"],
  ["b-kode", "Copperline", "Websites and apps, designed and built in one place.", "Development studio", "Belgrade", "Serbia", "Design and development.", "A studio of fifteen developers and designers.", "", "studio"],
  ["b-editorial", "Design Council North", "Design that serves the public.", "Design organisation", "Montreal", "Canada", "Research, exhibitions and publications on design.", "A non-profit organisation promoting good design in public life.", "pro-reader-woman", "publishing"],
  ["b-report", "Tideline Institute", "The state of coastal towns, in seven short chapters.", "Research institute", "Plymouth", "United Kingdom", "Research and an annual report on coastal communities.", "Tideline publishes research on the economy and health of coastal towns.", "obj-book-pages", "publishing"],
  ["b-event", "Assembly Days", "Two days of ideas, in a factory.", "Conference", "Detroit", "United States", "A two-day festival of talks and workshops.", "Assembly Days brings together builders, artists and founders every May.", "", "events"],
  ["b-index", "Archive Press", "Books, prints and a small archive.", "Publisher", "Edinburgh", "United Kingdom", "Independent publisher of books and prints.", "A small press publishing four books a year.", "", "publishing"],
  ["b-poster", "Good Plate Foods", "Plant-based food that tastes like dinner", "Food brand", "Chicago", "United States", "Plant-based burgers, sausages and mince.", "Good Plate makes plant-based food in its own kitchens.", "home-dining", "food"],
];

// Studio templates draw their photos from a wider pool (offset per template) so no two look alike;
// product-grid templates get product photography.
const POOL = ["work-wireframes", "work-sketches", "work-drawing", "work-pattern", "obj-journal", "home-bud-vases", "home-pink-vase", "home-white-jug", "biz-glass", "stay-lobby", "home-white-room", "flower-tulip", "home-desk-lamp", "home-butterfly-chair", "obj-book-pages", "home-glass-jar"];
const PRODUCT: Record<string, string[]> = {
  "b-objects": ["home-desk-lamp", "home-butterfly-chair", "home-white-jug", "home-floor-lamp", "home-orange-armchair", "home-pink-vase"],
  "b-packshot": ["home-glass-jar", "home-bud-vases", "flower-tulip", "obj-book-pages", "home-white-jug", "jewel-pendant"],
  "b-blackgrid": ["men-brogues", "fashion-weekender", "jewel-halo-ring", "home-brass-pendants", "men-pocket-square", "home-desk-lamp"],
};

export const BUSINESS4_PERSONAS: Record<string, Persona> = Object.fromEntries(ROWS.map(([id, businessName, tagline, industry, city, country, description, about, hero, kit], i) => {
  const base = KITS[kit];
  const pics = PRODUCT[id] ?? (kit === "studio" ? Array.from({ length: 6 }, (_, j) => POOL[(i * 5 + j) % POOL.length]) : null);
  const k = pics ? { ...base, services: base.services.map((x, j) => ({ ...x, image: st(pics[j], x.title) })), gallery: pics.slice(3).map((n) => st(n, `${businessName} work`)) } : base;
  return [id, { answers: {
    businessName, tagline, industry, city, country, description, about, benefits: k.benefits,
    heroImage: st(hero || k.gallery[0].stock!, businessName), gallery: k.gallery, services: k.services, faqs: k.faqs,
    email: "hello@example.com", primaryGoal: "form", quoteForm: true,
  } }];
}));
