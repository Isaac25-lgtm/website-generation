import type { ImageRef } from "./schema";
import type { Persona } from "./demo";

// Fictional businesses for the one-per-reference Signature business templates. Names and details are invented.
// Photos are CC0, except "owner-*" photos: supplied by the platform owner for template previews only
// (they are stripped from every customer site; see src/shared/owner-photos.ts).

const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });
const svc = (title: string, description: string, image?: ImageRef, price = "") => ({ title, description, price, image });

export const BUSINESS_PERSONAS: Record<string, Persona> = {
  "b-skyline": { answers: {
    businessName: "Altamar Estates", tagline: "Homes chosen one by one.", industry: "Luxury property", city: "Panama City", country: "Panama",
    description: "Exceptional properties in the most sought-after markets, chosen with care.",
    about: "Altamar works with a small number of buyers each year, across five countries. Every property is visited by a partner before it is offered.",
    benefits: "Five countries\nSix partner firms\nOver forty homes sold\nEvery home visited by a partner\nOne point of contact",
    heroImage: st("biz-towers", "City towers at dusk"), gallery: [st("home-loft", "An apartment living room"), st("stay-rooftop", "A rooftop pool")],
    services: [svc("Buying", "Search, viewings and negotiation for buyers."), svc("Selling", "Discreet sales to qualified buyers."), svc("Relocation", "Schools, banking and moving, arranged.")],
    email: "office@example.com", primaryGoal: "form", quoteForm: false,
  } },
  "b-expedition": { answers: {
    businessName: "Polar Line Expeditions", tagline: "Eight days at the bottom of the world, with a camp of twelve guests and four guides.", industry: "Polar journeys", city: "Cape Town", country: "South Africa",
    description: "Small-group flights and camps deep in the polar interior, with expert guides.",
    about: "We started flying guests south in 2009. Every season we take fewer people, stay longer and leave less behind.",
    benefits: "Groups of twelve\nExpert polar guides\nFully supported camps",
    heroImage: st("photo-misty-mountains", "Fog over mountains"), gallery: [st("photo-teal-lake", "A glacier lake"), st("safari-camp", "Camp at night"), st("photo-sea", "The coast")],
    services: [svc("The Interior", "Eight days at a remote camp.", st("photo-misty-mountains", "Mountains"), "From $38,000"), svc("Emperor Colony", "Four days with an emperor colony.", st("photo-sea", "The coast"), "From $29,000"), svc("Summit Expedition", "Fourteen days, guided climb.", st("safari-trek", "A climber on a ridge"), "From $54,000")],
    email: "travel@example.com", primaryGoal: "form", quoteForm: true, servicesHeading: "Journeys",
  } },
  "b-atlas": { answers: {
    businessName: "lumen atlas", tagline: "City Library, Reading Hall", industry: "Architecture photography", city: "Lisbon", country: "Portugal",
    description: "Architecture and interiors photographed for architects, developers and magazines.",
    about: "Lumen Atlas is two photographers working with architects across Europe. We photograph buildings in daylight and at dusk, and deliver within a week.",
    heroImage: st("biz-facade-bw", "A modern building facade"),
    gallery: [st("home-loft", "Loft interior"), st("biz-towers", "Towers"), st("stay-lobby", "Hotel lobby"), st("biz-glass", "Glass facade"), st("home-white-room", "White room"), st("home-dining", "Dining room")],
    services: [svc("Architecture", "Exteriors and interiors for completed projects.", undefined, "Day rate"), svc("Interiors", "Rooms, details and materials.", undefined, "Half day"), svc("Construction progress", "Monthly visits through the build.", undefined, "Monthly")],
    email: "studio@example.com", primaryGoal: "email",
  } },
  "b-agency": { answers: {
    businessName: "Northfield", tagline: "Digital Design", industry: "Design studio", city: "Amsterdam", country: "Netherlands",
    description: "A design studio for property, hospitality and retail companies.",
    about: "Northfield is twenty designers and developers. We design brands, websites and digital products for property, hospitality and retail companies.",
    services: [svc("Brand identity", "Strategy, naming and visual identity."), svc("Websites", "Design and build of fast, accessible sites."), svc("Digital products", "Apps and tools for customers and staff.")],
    gallery: [st("biz-glass", "Office building"), st("stay-lobby", "Hotel lobby"), st("home-loft", "Loft")],
    email: "hello@example.com", primaryGoal: "email", servicesHeading: "Work",
  } },
  "b-lettering": { answers: {
    businessName: "Hart & Vale", tagline: "Hand-drawn logos for restaurants, shops and publishers.", industry: "Branding studio", city: "Toronto", country: "Canada",
    description: "Logos, lettering and identities for restaurants, shops and publishers.",
    about: "Hart & Vale is a two-person studio drawing custom lettering and logos by hand, then finishing them digitally.",
    services: [svc("Logos and lettering", "Custom marks drawn by hand."), svc("Identity systems", "Type, colour and guidelines."), svc("Packaging", "Labels and boxes.")],
    gallery: [st("work-sketches", "Lettering sketches"), st("work-drawing", "Drawing"), st("obj-journal", "Sketchbook")],
    email: "studio@example.com", primaryGoal: "email",
  } },
  "b-catalogue": { answers: {
    businessName: "Oaken & Lime", tagline: "We make furniture and fittings for kitchens, bathrooms and shops, in solid wood and stone.", industry: "Manufacturer", city: "Porto", country: "Portugal",
    description: "Download our catalogue of 120 pieces, or ask us to quote for a project.",
    about: "Oaken & Lime is a family workshop of thirty people. We supply architects, shops and homeowners, and make every piece to order.",
    benefits: "Made to order\nSolid wood and stone\nDelivered across Europe",
    heroImage: st("home-kitchen", "A finished kitchen"), gallery: [st("home-dining", "Dining room"), st("home-pendant-shelves", "Shelves"), st("make-bench", "The workshop")],
    services: [svc("Kitchens", "Cabinets and worktops.", st("home-kitchen", "Kitchen")), svc("Bathrooms", "Vanities and storage.", st("home-white-room", "Bathroom")), svc("Shop fittings", "Counters and shelving.", st("fashion-boutique-rails", "Shop interior")), svc("Tables", "Dining and work tables.", st("home-tulip-table", "Table"))],
    email: "sales@example.com", primaryGoal: "quote", quoteForm: true,
  } },
  "b-monolith": { answers: {
    businessName: "Forma", tagline: "We design buildings and objects that are simple to make and hard to forget.", industry: "Architecture · Objects", city: "Oslo", country: "Norway",
    description: "An architecture and product studio.",
    about: "Forma is eight architects and designers. We work on houses, small public buildings and a range of furniture.",
    heroImage: st("work-pattern", "A sculptural white pattern"), gallery: [st("biz-facade-bw", "Facade"), st("home-white-room", "Interior"), st("home-butterfly-chair", "Chair")],
    services: [svc("Architecture", "Houses and small public buildings."), svc("Interiors", "Fit-outs and furniture."), svc("Objects", "Furniture and lighting.")],
    email: "studio@example.com", primaryGoal: "email",
  } },
  "b-canal": { answers: {
    businessName: "Harbour House Museum", tagline: "Five hundred years of the harbour", industry: "Museum", city: "Hamburg", country: "Germany",
    description: "Exhibitions, harbour walks and school programmes about the port and its people.",
    about: "Harbour House tells the story of the port through ship models, cargo records and the dock workers who ran it. Guided walks leave from the museum every day.",
    heroImage: st("photo-boat", "A boat on still water"), gallery: [st("photo-teal-lake", "Water"), st("photo-kayak", "From a boat"), st("biz-facade-bw", "The museum building")],
    services: [svc("The permanent exhibition", "Ship models, maps and cargo records.", undefined, "€16"), svc("Harbour walk", "Ninety minutes along the docks with a guide.", undefined, "€22"), svc("School programmes", "Lessons for ages 8 to 16.", undefined, "On request")],
    email: "visit@example.com", primaryGoal: "visit", hours: [{ days: "Daily", hours: "10:00 – 17:00" }], servicesHeading: "Visit",
  } },
  "b-realwork": { answers: {
    businessName: "Keystone Systems", tagline: "Systems that fit the way you work", industry: "IT and data services", city: "Nairobi", country: "Kenya",
    description: "Reporting, records and payment systems for clinics, schools, cooperatives and growing companies.",
    about: "Keystone Systems is a team of engineers, analysts and designers. We start every project by sitting with the people who will use the system.",
    benefits: "We visit before we design\nTraining for every user\nSupport after launch",
    heroImage: st("biz-team", "A team planning together"), gallery: [st("biz-workshop", "A workshop"), st("biz-review", "Reviewing figures")],
    services: [svc("Data and reporting", "Dashboards and reports from the data you already collect.", st("owner-mi-laptop", "Working on a laptop")), svc("Systems for clinics and schools", "Records, scheduling and stock, built for your workflow.", st("biz-office", "An office")), svc("Payments and finance", "Billing, collections and reconciliations.", st("owner-mi-payment", "A card payment"))],
    email: "hello@example.com", primaryGoal: "form", quoteForm: true,
  } },
  "b-contractor": { answers: {
    businessName: "Ridgeline Engineering", tagline: "Steel, plant and pipework, built and installed", industry: "Engineering contractor", city: "Houston", country: "United States",
    description: "Civil, mechanical, fabrication and industrial support for factories, mills and plants across the region.",
    about: "Ridgeline Engineering builds and installs the structures and equipment that industrial sites depend on, from foundations to commissioning.",
    benefits: "Own workshop and lifting equipment\nCertified welders\nSafety-first sites",
    heroImage: st("owner-ats-lifting", "A crane lifting steelwork on site"),
    gallery: [st("owner-ats-tower", "Tower erection"), st("owner-ats-process", "Process plant"), st("owner-ats-stacks", "Insulated stacks"), st("owner-ats-pumps", "Pumps and pipework")],
    services: [svc("Civil works", "Concrete bases, plinths and industrial floors for new plant.", st("owner-ats-civil", "Civil works")), svc("Mechanical and plant installation", "Machine installation and plant assembly.", st("owner-ats-plant", "Plant installation")), svc("Structural steel and warehouses", "Steel erection, sheeting and warehouse buildings.", st("owner-ats-steel", "Structural steel")), svc("Process pipework", "Mild and stainless-steel process pipework.", st("owner-ats-pipework", "Pipework")), svc("Storage tanks and silos", "Fabrication and installation of storage tanks.", st("owner-ats-silos", "Silos"))],
    phone: "+1 713 555 0148", email: "projects@example.com", primaryGoal: "call", quoteForm: true,
  } },
};
