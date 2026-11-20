import type { FieldSpec } from "../components/forms";

const v = (opts: [string, string][]): FieldSpec => ({ k: "variant", label: "Layout", t: "select", options: [["", "Template default"], ...opts] });
const heading: FieldSpec = { k: "data.heading", label: "Heading", t: "text", max: 160 };
const intro: FieldSpec = { k: "data.intro", label: "Intro text", t: "textarea", rows: 2, max: 600 };

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero banner", about: "About", text: "Text block", services: "Services", projects: "Projects / portfolio", experience: "Experience",
  education: "Education", achievements: "Achievements", skills: "Skills", gallery: "Gallery", testimonials: "Testimonials", team: "Team",
  faq: "FAQ", hours: "Opening hours", contact: "Contact & form", quote: "Quote request form", cta: "Call to action", resume: "CV download",
  video: "Video", products: "Products", collections: "Categories", banner: "Promo banner",
};

export const SECTION_SPECS: Record<string, FieldSpec[]> = {
  hero: [v([["split", "Split"], ["centered", "Centred"], ["editorial", "Editorial"], ["fullbleed", "Full-screen image"], ["terminal", "Terminal"], ["mosaic", "Image mosaic"], ["stacked", "Stacked"], ["poster", "Poster"], ["minimal", "Minimal with avatar"]]),
    { k: "data.eyebrow", label: "Small label above heading", t: "text", max: 80 }, { k: "data.heading", label: "Main heading", t: "text", max: 160 }, { k: "data.subheading", label: "Supporting text", t: "textarea", rows: 3, max: 400 },
    { k: "data.primaryCta", label: "Main button", t: "link" }, { k: "data.secondaryCta", label: "Second button", t: "link" }, { k: "data.image", label: "Image", t: "image" }],
  about: [v([["split", "Image + text"], ["columns", "Text columns"], ["card", "Card"]]), heading, { k: "data.body", label: "Text", t: "textarea", rows: 8, max: 4000 }, { k: "data.image", label: "Image", t: "image" }, { k: "data.highlights", label: "Highlights", t: "strings" }],
  text: [heading, { k: "data.body", label: "Text", t: "textarea", rows: 10, max: 6000 }],
  services: [v([["grid", "Cards"], ["list", "List"], ["numbered", "Numbered"], ["menu", "Menu (dotted)"]]), heading, intro,
    { k: "data.items", label: "Items", t: "list", item: "Item", max: 24, fields: [{ k: "title", label: "Name", t: "text", max: 100 }, { k: "description", label: "Description", t: "textarea", rows: 3, max: 600 }, { k: "price", label: "Price (optional)", t: "text", max: 60 }, { k: "image", label: "Image", t: "image" }] }],
  projects: [v([["cards", "Cards"], ["alternating", "Alternating"], ["index", "Index list"]]), heading, intro,
    { k: "data.items", label: "Projects", t: "list", item: "Project", max: 30, fields: [{ k: "title", label: "Title", t: "text", max: 120 }, { k: "description", label: "Description", t: "textarea", rows: 4, max: 1500 }, { k: "role", label: "Role", t: "text", max: 100 }, { k: "period", label: "Date", t: "text", max: 60 }, { k: "tags", label: "Tags", t: "strings" }, { k: "link", label: "Link", t: "url", max: 600 }, { k: "images", label: "Images", t: "images", max: 12 }] }],
  experience: [v([["timeline", "Timeline"], ["table", "Table"]]), heading, { k: "data.items", label: "Roles", t: "list", item: "Role", fields: [{ k: "role", label: "Role", t: "text", max: 100 }, { k: "org", label: "Organisation", t: "text", max: 100 }, { k: "period", label: "Period", t: "text", max: 60 }, { k: "location", label: "Location", t: "text", max: 80 }, { k: "description", label: "Description", t: "textarea", rows: 3, max: 1200 }] }],
  education: [heading, { k: "data.items", label: "Entries", t: "list", item: "Entry", fields: [{ k: "title", label: "Qualification", t: "text", max: 140 }, { k: "org", label: "Institution", t: "text", max: 120 }, { k: "period", label: "Year", t: "text", max: 60 }, { k: "description", label: "Details", t: "textarea", rows: 2, max: 600 }] }],
  achievements: [heading, { k: "data.items", label: "Items", t: "list", item: "Item", fields: [{ k: "title", label: "Title", t: "text", max: 160 }, { k: "detail", label: "Detail", t: "text", max: 400 }, { k: "year", label: "Year", t: "text", max: 20 }, { k: "link", label: "Link", t: "url", max: 600 }] }],
  skills: [heading, { k: "data.groups", label: "Skill groups", t: "list", item: "Group", max: 10, fields: [{ k: "name", label: "Group name (optional)", t: "text", max: 60 }, { k: "items", label: "Skills", t: "strings" }] }],
  gallery: [v([["grid", "Grid"], ["masonry", "Masonry"], ["strip", "Scrolling strip"]]), heading, intro, { k: "data.images", label: "Images", t: "images", max: 40 }],
  testimonials: [v([["cards", "Cards"], ["big", "Large quotes"]]), heading, { k: "data.items", label: "Testimonials (real only)", t: "list", item: "Testimonial", max: 12, fields: [{ k: "quote", label: "Quote", t: "textarea", rows: 3, max: 800 }, { k: "name", label: "Name", t: "text", max: 80 }, { k: "role", label: "Role", t: "text", max: 100 }] }],
  team: [heading, { k: "data.members", label: "Members", t: "list", item: "Person", max: 24, fields: [{ k: "name", label: "Name", t: "text", max: 80 }, { k: "role", label: "Role", t: "text", max: 80 }, { k: "bio", label: "Bio", t: "textarea", rows: 2, max: 400 }, { k: "image", label: "Photo", t: "image" }] }],
  faq: [heading, { k: "data.items", label: "Questions", t: "list", item: "Question", max: 30, fields: [{ k: "q", label: "Question", t: "text", max: 200 }, { k: "a", label: "Answer", t: "textarea", rows: 3, max: 1200 }] }],
  hours: [v([["table", "Table"], ["card", "Card"]]), heading, { k: "data.rows", label: "Hours", t: "list", item: "Row", max: 10, fields: [{ k: "days", label: "Days", t: "text", max: 60 }, { k: "hours", label: "Hours", t: "text", max: 60 }] }, { k: "data.note", label: "Note", t: "text", max: 300 }],
  contact: [heading, { k: "data.intro", label: "Intro", t: "textarea", rows: 2, max: 500 }, { k: "data.showForm", label: "Show contact form", t: "toggle" }, { k: "data.showMap", label: "Show map (uses your map location / address)", t: "toggle" }],
  quote: [heading, { k: "data.intro", label: "Intro", t: "textarea", rows: 2, max: 500 }, { k: "data.services", label: "Service options in the form", t: "strings" }],
  cta: [heading, { k: "data.body", label: "Text", t: "textarea", rows: 2, max: 500 }, { k: "data.cta", label: "Button", t: "link" }],
  resume: [heading, { k: "data.body", label: "Text", t: "textarea", rows: 2, max: 600 }, { k: "data.assetId", label: "CV file (PDF)", t: "doc" }, { k: "data.label", label: "Button text", t: "text", max: 60 }],
  video: [heading, { k: "data.provider", label: "Provider", t: "select", options: [["youtube", "YouTube"], ["vimeo", "Vimeo"]] }, { k: "data.videoId", label: "Video ID", t: "text", max: 20, help: "The ID from the video link, e.g. dQw4w9WgXcQ" }, { k: "data.caption", label: "Caption", t: "text", max: 300 }],
  products: [v([["grid", "Grid"], ["large", "Large images"], ["compact", "Compact"]]), heading, intro, { k: "data.mode", label: "Which products", t: "select", options: [["featured", "Featured products"], ["all", "All products with search & filters"], ["collection", "One category"]] }, { k: "data.collectionHandle", label: "Category handle (for “one category”)", t: "text", max: 60 }, { k: "data.limit", label: "How many (featured)", t: "number" }],
  collections: [v([["tiles", "Image tiles"], ["chips", "Buttons"]]), heading, intro],
  banner: [{ k: "data.text", label: "Banner text (must be true, no fake urgency)", t: "text", max: 200 }, { k: "data.link", label: "Link", t: "link" }],
};

export const NEW_SECTION_DATA: Record<string, any> = {
  hero: { eyebrow: "", heading: "Your headline", subheading: "", primaryCta: { label: "Contact us", href: "/contact" } },
  about: { heading: "About", body: "", highlights: [] }, text: { heading: "Heading", body: "" },
  services: { heading: "Services", intro: "", items: [] }, projects: { heading: "Projects", intro: "", items: [] },
  experience: { heading: "Experience", items: [] }, education: { heading: "Education", items: [] }, achievements: { heading: "Achievements", items: [] },
  skills: { heading: "Skills", groups: [] }, gallery: { heading: "Gallery", intro: "", images: [] }, testimonials: { heading: "What people say", items: [] },
  team: { heading: "Our team", members: [] }, faq: { heading: "FAQ", items: [] }, hours: { heading: "Opening hours", rows: [], note: "" },
  contact: { heading: "Contact", intro: "", showForm: true, showMap: false }, quote: { heading: "Request a quote", intro: "", services: [] },
  cta: { heading: "Ready to start?", body: "", cta: { label: "Get in touch", href: "/contact" } }, resume: { heading: "My CV", body: "", label: "Download CV" },
  video: { heading: "", provider: "youtube", videoId: "", caption: "" }, products: { heading: "Products", intro: "", mode: "featured", collectionHandle: "", limit: 8 },
  collections: { heading: "Shop by category", intro: "" }, banner: { text: "" },
};

const FONT_OPTS: [string, string][] = [["inter", "Inter"], ["manrope", "Manrope"], ["plus-jakarta", "Plus Jakarta Sans"], ["outfit", "Outfit"], ["space-grotesk", "Space Grotesk"], ["dm-sans", "DM Sans"], ["work-sans", "Work Sans"], ["poppins", "Poppins"], ["playfair", "Playfair Display"], ["fraunces", "Fraunces"], ["cormorant", "Cormorant Garamond"], ["dm-serif", "DM Serif Display"], ["libre-baskerville", "Libre Baskerville"], ["lora", "Lora"], ["jetbrains-mono", "JetBrains Mono"], ["space-mono", "Space Mono"], ["syne", "Syne"], ["archivo-black", "Archivo Black"], ["bricolage", "Bricolage Grotesque"], ["instrument-serif", "Instrument Serif"]];

export const THEME_SPECS: FieldSpec[] = [
  { k: "theme.mode", label: "Mode", t: "select", options: [["light", "Light"], ["dark", "Dark"]] },
  { k: "theme.colors.primary", label: "Primary colour", t: "color" }, { k: "theme.colors.accent", label: "Accent colour", t: "color" },
  { k: "theme.colors.bg", label: "Background", t: "color" }, { k: "theme.colors.surface", label: "Surface / alternate background", t: "color" },
  { k: "theme.colors.text", label: "Text", t: "color" }, { k: "theme.colors.muted", label: "Secondary text", t: "color" },
  { k: "theme.fontHeading", label: "Heading font", t: "select", options: FONT_OPTS }, { k: "theme.fontBody", label: "Body font", t: "select", options: FONT_OPTS },
  { k: "theme.headingScale", label: "Heading size", t: "select", options: [["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "Extra large"]] },
  { k: "theme.density", label: "Spacing", t: "select", options: [["compact", "Compact"], ["comfortable", "Comfortable"], ["airy", "Airy"]] },
  { k: "theme.radius", label: "Corners", t: "select", options: [["none", "Square"], ["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "Extra round"]] },
  { k: "theme.headerStyle", label: "Header / navigation", t: "select", options: [["bar", "Bar"], ["centered", "Centred logo"], ["split", "With contact bar"], ["floating", "Floating"], ["sidebar", "Sidebar (desktop)"], ["minimal", "Minimal"]] },
  { k: "theme.cardStyle", label: "Cards", t: "select", options: [["flat", "Flat"], ["outline", "Outline"], ["elevated", "Shadow"], ["glass", "Glass"]] },
  { k: "theme.ornament", label: "Decoration", t: "select", options: [["none", "None"], ["grain", "Paper grain"], ["grid", "Grid lines"], ["dots", "Dots"], ["blobs", "Soft glows"], ["lines", "Accent lines"]] },
  { k: "theme.animation", label: "Animation", t: "select", options: [["none", "None"], ["subtle", "Subtle"], ["lively", "Lively"]] },
];

export const SITE_SPECS: FieldSpec[] = [
  { k: "brand.name", label: "Site / business name", t: "text", max: 80 }, { k: "brand.tagline", label: "Tagline", t: "text", max: 160 }, { k: "brand.logo", label: "Logo", t: "image" },
  { k: "seo.title", label: "Search title", t: "text", max: 70 }, { k: "seo.description", label: "Search description", t: "textarea", rows: 2, max: 170 },
  { k: "contact.email", label: "Email", t: "email", max: 200 }, { k: "contact.phone", label: "Phone", t: "tel", max: 40 }, { k: "contact.whatsapp", label: "WhatsApp", t: "tel", max: 40 },
  { k: "contact.address", label: "Address", t: "text", max: 300 }, { k: "contact.city", label: "City", t: "text", max: 80 }, { k: "contact.country", label: "Country", t: "text", max: 80 },
  { k: "contact.mapQuery", label: "Map location", t: "text", max: 300 },
  { k: "contact.socials", label: "Social links", t: "list", item: "Link", max: 12, fields: [{ k: "network", label: "Name", t: "text", max: 30 }, { k: "url", label: "URL", t: "url", max: 400 }] },
  { k: "footer.text", label: "Footer note", t: "text", max: 300 },
];

export const STORE_POLICY_SPECS: FieldSpec[] = [
  { k: "store.returnsPolicy", label: "Returns & refunds policy", t: "textarea", rows: 5, max: 4000 },
  { k: "store.shippingPolicy", label: "Delivery & shipping policy", t: "textarea", rows: 4, max: 4000 },
  { k: "store.privacyNote", label: "Privacy notice", t: "textarea", rows: 4, max: 4000 },
  { k: "store.taxNote", label: "Tax note", t: "text", max: 300 },
  { k: "store.checkoutNote", label: "Checkout note", t: "textarea", rows: 2, max: 600 },
  { k: "store.requirePhone", label: "Require phone at checkout", t: "toggle" },
  { k: "store.requireEmail", label: "Require email at checkout", t: "toggle" },
  { k: "store.lowStockThreshold", label: "Low-stock threshold", t: "number" },
  { k: "store.prohibitedAck", label: "I will not sell prohibited goods", t: "toggle" },
];
