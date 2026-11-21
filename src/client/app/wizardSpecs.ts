import type { FieldSpec } from "../components/forms";

export interface Step { id: string; title: string; intro?: string; fields?: FieldSpec[]; special?: "style" | "products" | "review" | "store-payments" | "store-delivery" }

const socials: FieldSpec = { k: "socials", label: "Social & profile links", t: "list", item: "Link", max: 12, fields: [
  { k: "network", label: "Platform", t: "select", options: [["", "Choose…"], ["LinkedIn", "LinkedIn"], ["Instagram", "Instagram"], ["Facebook", "Facebook"], ["X", "X / Twitter"], ["TikTok", "TikTok"], ["YouTube", "YouTube"], ["GitHub", "GitHub"], ["Behance", "Behance"], ["Dribbble", "Dribbble"], ["Website", "Other website"]] },
  { k: "url", label: "Full link", t: "url", ph: "https://…" },
] };
const testimonials: FieldSpec = { k: "testimonials", label: "Testimonials (only real ones you have permission to use)", t: "list", item: "Testimonial", max: 12, help: "Leave empty if you don't have any. We never invent reviews.", fields: [
  { k: "quote", label: "What they said", t: "textarea", rows: 3, max: 800 }, { k: "name", label: "Name", t: "text", max: 80 }, { k: "role", label: "Role / company (optional)", t: "text", max: 100 },
] };
const faqs: FieldSpec = { k: "faqs", label: "Frequently asked questions", t: "list", item: "Question", max: 20, fields: [{ k: "q", label: "Question", t: "text", max: 200 }, { k: "a", label: "Answer", t: "textarea", rows: 3, max: 1200 }] };
const hours: FieldSpec = { k: "hours", label: "Opening hours", t: "list", item: "Row", max: 8, help: "Only add hours if they're accurate. Leave empty to hide.", fields: [{ k: "days", label: "Days", t: "text", ph: "Mon – Fri", max: 60 }, { k: "hours", label: "Hours", t: "text", ph: "8:00 – 18:00", max: 60 }] };
const seo: FieldSpec[] = [
  { k: "seoTitle", label: "Search engine title (optional)", t: "text", max: 70, help: "Shown in Google results. Up to 70 characters." },
  { k: "seoDescription", label: "Search engine description (optional)", t: "textarea", rows: 2, max: 170 },
  { k: "lang", label: "Main language of your site", t: "select", options: [["en", "English"], ["fr", "French"], ["sw", "Swahili"], ["pt", "Portuguese"], ["ar", "Arabic"], ["es", "Spanish"], ["de", "German"]] },
];
const contactCore: FieldSpec[] = [
  { k: "email", label: "Public email", t: "email", max: 200 },
  { k: "phone", label: "Phone (with country code)", t: "tel", ph: "+1 202 555 0143", max: 40 },
  { k: "whatsapp", label: "WhatsApp number (with country code)", t: "tel", ph: "+12025550143", max: 40, help: "Adds a WhatsApp chat button to your site." },
];

export const STEPS: Record<string, Step[]> = {
  personal: [
    { id: "basics", title: "About you", intro: "The essentials visitors see first.", fields: [
      { k: "name", label: "Your full name (as you want it shown)", t: "text", max: 80 },
      { k: "title", label: "Professional title", t: "text", ph: "e.g. Product designer, Civil engineer, Photographer", max: 100 },
      { k: "tagline", label: "Tagline (optional)", t: "text", ph: "A short line that captures what you do", max: 160 },
      { k: "location", label: "Location", t: "text", ph: "e.g. Lisbon, Portugal", max: 80 },
      { k: "bio", label: "Your bio", t: "textarea", rows: 7, max: 4000, help: "A few short paragraphs about you, your work and what you're looking for." },
    ] },
    { id: "contact", title: "Contact & links", fields: [...contactCore, socials] },
    { id: "experience", title: "Experience & education", intro: "Add as much or as little as you like. Empty sections are hidden.", fields: [
      { k: "experience", label: "Work experience", t: "list", item: "Role", max: 30, fields: [{ k: "role", label: "Role / position", t: "text", max: 100 }, { k: "org", label: "Organisation", t: "text", max: 100 }, { k: "period", label: "Period", t: "text", ph: "2021 — now", max: 60 }, { k: "location", label: "Location (optional)", t: "text", max: 80 }, { k: "description", label: "What you did", t: "textarea", rows: 3, max: 1200 }] },
      { k: "education", label: "Education & certifications", t: "list", item: "Entry", max: 30, fields: [{ k: "title", label: "Qualification", t: "text", max: 140 }, { k: "org", label: "Institution", t: "text", max: 120 }, { k: "period", label: "Year / period", t: "text", max: 60 }, { k: "description", label: "Details (optional)", t: "textarea", rows: 2, max: 600 }] },
    ] },
    { id: "projects", title: "Portfolio projects", intro: "Show your best work, with photos and links.", fields: [
      { k: "projects", label: "Projects", t: "list", item: "Project", max: 30, fields: [{ k: "title", label: "Project title", t: "text", max: 120 }, { k: "description", label: "Description", t: "textarea", rows: 4, max: 1500 }, { k: "role", label: "Your role", t: "text", max: 100 }, { k: "period", label: "Date / period", t: "text", max: 60 }, { k: "tags", label: "Tags / tools (comma separated)", t: "text", max: 300 }, { k: "link", label: "Link (optional)", t: "url", max: 600 }, { k: "images", label: "Project images", t: "images", max: 12 }] },
    ] },
    { id: "skills", title: "Skills & highlights", fields: [
      { k: "skills", label: "Skills (comma separated)", t: "textarea", rows: 3, max: 2000, ph: "Research, Figma, Public speaking, Python" },
      { k: "achievements", label: "Achievements, awards & publications (real ones only)", t: "list", item: "Achievement", max: 30, fields: [{ k: "title", label: "Title", t: "text", max: 160 }, { k: "detail", label: "Detail", t: "text", max: 400 }, { k: "year", label: "Year", t: "text", max: 20 }, { k: "link", label: "Link (optional)", t: "url", max: 600 }] },
      testimonials,
    ] },
    { id: "media", title: "Photos, CV & video", fields: [
      { k: "headshot", label: "Profile photo / headshot", t: "image" },
      { k: "heroImage", label: "Cover / banner image (optional)", t: "image" },
      { k: "gallery", label: "Gallery (optional)", t: "images", max: 40 },
      { k: "cvAssetId", label: "CV / résumé (PDF)", t: "doc" },
      { k: "cvAllowDownload", label: "Let visitors download my CV", t: "toggle" },
      { k: "video.url", label: "YouTube or Vimeo video link (optional)", t: "url", max: 300 },
    ] },
    { id: "goals", title: "Goals & SEO", fields: [
      { k: "primaryCta", label: "Main action you want visitors to take", t: "select", options: [["contact", "Contact me"], ["projects", "See my work"], ["cv", "Download my CV"], ["booking", "Book a call (external link)"]] },
      { k: "bookingUrl", label: "Booking link (if using “Book a call”)", t: "url", max: 600 },
      ...seo,
    ] },
    { id: "style", title: "Design & inspiration", special: "style" },
    { id: "review", title: "Review & generate", special: "review" },
  ],
  business: [
    { id: "basics", title: "Your business", fields: [
      { k: "businessName", label: "Business / trading name", t: "text", max: 80 },
      { k: "tagline", label: "Tagline", t: "text", max: 160, ph: "e.g. Fast, honest home repairs" },
      { k: "industry", label: "Industry", t: "text", max: 60, ph: "e.g. Plumbing, Restaurant, Consulting" },
      { k: "description", label: "Short description (1–2 sentences)", t: "textarea", rows: 3, max: 400 },
      { k: "logo", label: "Logo (optional)", t: "image" },
    ] },
    { id: "about", title: "About & benefits", fields: [
      { k: "about", label: "About your business / history", t: "textarea", rows: 6, max: 4000 },
      { k: "benefits", label: "Why customers choose you (one per line)", t: "textarea", rows: 4, max: 1000, ph: "Licensed technicians\nSame-day visits\nFixed, upfront prices" },
      { k: "targetCustomers", label: "Who you serve", t: "text", max: 200, ph: "Homes and offices across the city" },
    ] },
    { id: "services", title: "Services", intro: "List what you offer. Prices are optional. This plan shows offerings, not a shopping cart.", fields: [
      { k: "services", label: "Services / offerings", t: "list", item: "Service", max: 24, fields: [{ k: "title", label: "Name", t: "text", max: 100 }, { k: "description", label: "Description", t: "textarea", rows: 3, max: 600 }, { k: "price", label: "Price or range (optional)", t: "text", max: 60, ph: "From $90" }, { k: "image", label: "Image (optional)", t: "image" }] },
      { k: "quoteForm", label: "Add a quote request form", t: "toggle", help: "Requests arrive in your dashboard." },
    ] },
    { id: "media", title: "Photos & team", fields: [
      { k: "heroImage", label: "Main banner photo", t: "image" },
      { k: "gallery", label: "Gallery photos", t: "images", max: 40 },
      { k: "team", label: "Team members (optional)", t: "list", item: "Person", max: 24, fields: [{ k: "name", label: "Name", t: "text", max: 80 }, { k: "role", label: "Role", t: "text", max: 80 }, { k: "bio", label: "Short bio", t: "textarea", rows: 2, max: 400 }, { k: "image", label: "Photo", t: "image" }] },
      { k: "video.url", label: "YouTube or Vimeo video (optional)", t: "url", max: 300 },
    ] },
    { id: "location", title: "Location, hours & contact", fields: [
      ...contactCore,
      { k: "address", label: "Street address", t: "text", max: 300 },
      { k: "city", label: "Town / city", t: "text", max: 80 },
      { k: "country", label: "Country", t: "text", max: 80 },
      { k: "mapQuery", label: "Map location", t: "text", max: 300, help: "Exactly what to search on Google Maps (your business name and area, or full address). Leave empty to use your address.", ph: "Bright Plumbing, 221 Sample Street, London" },
      { k: "serviceAreas", label: "Areas you serve (optional)", t: "text", max: 300 },
      hours, { k: "hoursNote", label: "Hours note (optional)", t: "text", max: 300, ph: "Closed on public holidays" },
      socials,
    ] },
    { id: "goals", title: "Goals, FAQ & reviews", fields: [
      { k: "primaryGoal", label: "Main action you want visitors to take", t: "select", options: [["form", "Send a message"], ["call", "Call us"], ["whatsapp", "WhatsApp us"], ["email", "Email us"], ["quote", "Request a quote"], ["booking", "Book online (external link)"], ["visit", "Visit us"]] },
      { k: "bookingUrl", label: "Booking link (if booking)", t: "url", max: 600 },
      faqs, testimonials, ...seo,
    ] },
    { id: "style", title: "Design & inspiration", special: "style" },
    { id: "review", title: "Review & generate", special: "review" },
  ],
  ecommerce: [
    { id: "identity", title: "Store identity", fields: [
      { k: "storeName", label: "Store name", t: "text", max: 80 },
      { k: "tagline", label: "Tagline", t: "text", max: 160 },
      { k: "industry", label: "What you sell (industry)", t: "text", max: 60, ph: "Fashion, Electronics, Groceries…" },
      { k: "description", label: "Short description", t: "textarea", rows: 3, max: 400 },
      { k: "logo", label: "Logo", t: "image" },
      { k: "heroImage", label: "Main banner image", t: "image" },
      { k: "country", label: "Country you operate from", t: "text", max: 80 },
      { k: "currency", label: "Store currency", t: "select", options: [["USD", "US Dollar (USD)"], ["EUR", "Euro (EUR)"], ["GBP", "British Pound (GBP)"], ["CAD", "Canadian Dollar (CAD)"], ["AUD", "Australian Dollar (AUD)"], ["NZD", "New Zealand Dollar (NZD)"], ["CHF", "Swiss Franc (CHF)"], ["JPY", "Japanese Yen (JPY)"], ["SGD", "Singapore Dollar (SGD)"], ["HKD", "Hong Kong Dollar (HKD)"], ["AED", "UAE Dirham (AED)"], ["INR", "Indian Rupee (INR)"], ["BRL", "Brazilian Real (BRL)"], ["MXN", "Mexican Peso (MXN)"], ["SEK", "Swedish Krona (SEK)"], ["NOK", "Norwegian Krone (NOK)"], ["DKK", "Danish Krone (DKK)"], ["PLN", "Polish Złoty (PLN)"], ["ZAR", "South African Rand (ZAR)"], ["NGN", "Nigerian Naira (NGN)"], ["KES", "Kenyan Shilling (KES)"], ["GHS", "Ghanaian Cedi (GHS)"], ["UGX", "Ugandan Shilling (UGX)"], ["TZS", "Tanzanian Shilling (TZS)"], ["RWF", "Rwandan Franc (RWF)"]], help: "Set this before adding products. Prices are shown in this currency." },
      { k: "productType", label: "Product type", t: "select", options: [["physical", "Physical products"], ["digital", "Digital products (delivered manually by you)"], ["both", "Both"]] },
    ] },
    { id: "products", title: "Products & categories", special: "products", intro: "Add products manually, import a CSV, and organise categories. You can keep adding products later from your store dashboard." },
    { id: "payments", title: "Checkout & payments", special: "store-payments" },
    { id: "delivery", title: "Delivery & pickup", special: "store-delivery" },
    { id: "policies", title: "Policies & compliance", intro: "Your customers must be able to read these before buying. Edit the starter text so it matches how you really operate.", fields: [
      { k: "store.returnsPolicy", label: "Returns & refunds policy", t: "textarea", rows: 6, max: 4000 },
      { k: "store.shippingPolicy", label: "Delivery & shipping policy", t: "textarea", rows: 5, max: 4000 },
      { k: "store.privacyNote", label: "Privacy notice for buyers", t: "textarea", rows: 4, max: 4000 },
      { k: "store.taxNote", label: "Tax note (optional)", t: "text", max: 300, ph: "Prices include VAT where applicable" },
      { k: "store.prohibitedAck", label: "I confirm I will not sell prohibited, counterfeit, illegal or age-restricted goods through this store.", t: "toggle" },
    ] },
    { id: "contact", title: "Contact, about & hours", fields: [
      ...contactCore,
      { k: "address", label: "Shop / pickup address (optional)", t: "text", max: 300 },
      { k: "city", label: "Town / city", t: "text", max: 80 },
      { k: "mapQuery", label: "Map location (optional)", t: "text", max: 300 },
      hours,
      { k: "about", label: "Your story (optional)", t: "textarea", rows: 5, max: 4000 },
      { k: "promoBanner", label: "Promotion banner text (optional, must be true)", t: "text", max: 200, ph: "Free shipping on orders over $100" },
      socials, faqs, testimonials,
      { k: "store.notifyEmail", label: "Email for order notifications (optional)", t: "email", max: 200, help: "Used when email notifications are switched on for the platform." },
      ...seo,
    ] },
    { id: "style", title: "Design & inspiration", special: "style" },
    { id: "review", title: "Review & generate", special: "review" },
  ],
};

export const STARTER_POLICIES = {
  returnsPolicy: "You can return unused items in their original packaging within 7 days of delivery for an exchange or refund. Contact us with your order number to arrange a return. Items that are damaged on arrival will be replaced at no cost.",
  shippingPolicy: "We deliver within [your city/area] in 1–3 working days. Delivery fees are shown at checkout. You can also collect your order from our shop free of charge. We will call or message you to confirm delivery.",
  privacyNote: "We use your name, phone number, email and delivery address only to process and deliver your order and to contact you about it. We do not sell or share your information with anyone except the courier delivering your order.",
};
