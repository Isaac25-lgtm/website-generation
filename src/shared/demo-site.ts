import type { ImageRef } from "./schema";
import type { Persona } from "./demo";

// Fictional people and businesses for the Signature personal and business templates.
// Every name and detail is invented; photos are CC0 (public/stock/CREDITS.txt).
// Copy follows the no-AI-slop rule (quality.ts): plain and specific.

const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });

export const SITE_PERSONAS: Record<string, Persona> = {
  // ───────────── Personal ─────────────
  "p-statement": { answers: {
    name: "Helena Varga", title: "Strategy advisor", location: "Vienna, Austria",
    tagline: "I help founders decide what to build next, and what to stop doing.",
    bio: "For twelve years I ran strategy at two software companies, from thirty people to six hundred. Now I work with a small number of founders each year, usually in the months after a funding round, when the list of possible projects is longest.\n\nMost engagements last a quarter. We meet every week, and I write a short decision memo after every session.",
    email: "hello@example.com", headshot: st("pro-portrait-woman-head", "Portrait of Helena Varga"), primaryCta: "contact",
    projects: [
      { title: "Pricing reset for a logistics platform", role: "Advisor", period: "2025", description: "Moved a mid-market product from per-seat to usage pricing over two quarters.", tags: "Pricing, B2B" },
      { title: "Market entry plan, Nordic region", role: "Advisor", period: "2024", description: "Sequenced the launch of a payments product across four countries.", tags: "Expansion" },
      { title: "Portfolio review for a design-tools company", role: "Advisor", period: "2024", description: "Retired three products and refocused the team on one.", tags: "Product strategy" },
    ],
    experience: [{ role: "Independent strategy advisor", org: "Self-employed", period: "2022 — now", location: "Vienna", description: "Quarter-long engagements with founders after a funding round." }, { role: "VP Strategy", org: "Software company (fictional)", period: "2016 — 2022", description: "Planning, pricing and market entry." }],
    achievements: [{ title: "Guest lecturer, strategy programme (sample)", year: "2025" }],
    socials: [{ network: "LinkedIn", url: "https://www.linkedin.com/" }],
  } },
  "p-prose": { answers: {
    name: "Tomás Abreu", title: "Writer and editor", location: "Porto, Portugal",
    tagline: "I write long-form stories about food, work and the places in between.",
    bio: "My features have run in magazines and newspapers in Europe and South America. I also edit annual reports and books for foundations that want their work read, not skimmed.\n\nI take on two editing projects a season.",
    email: "letters@example.com", headshot: st("pro-writer-woman", "A writer working at a laptop"), primaryCta: "contact",
    projects: [
      { title: "The last sardine canneries", role: "Writer", period: "2025", description: "A 6,000-word feature on the families still canning by hand.", tags: "Feature" },
      { title: "Annual report, education foundation", role: "Editor", period: "2024", description: "Turned 80 pages of programme notes into a 32-page narrative.", tags: "Editing" },
      { title: "A cookbook from the Douro valley", role: "Co-author", period: "2023", description: "Recipes and interviews from twelve vineyard kitchens.", tags: "Book" },
    ],
    experience: [{ role: "Freelance writer and editor", org: "Self-employed", period: "2018 — now", description: "Features, books and reports." }],
    education: [{ title: "MA, Journalism", org: "University (fictional)", period: "2016" }],
  } },
  "p-marquee": { answers: {
    name: "Jonah Reyes", title: "Brand designer", location: "Mexico City",
    tagline: "Brand identities for restaurants, hotels and independent shops.",
    bio: "I design names, logos, signage and menus for hospitality businesses, usually from the first sketch to the day the doors open. I work alone, with a small group of trusted printers and sign makers.",
    email: "studio@example.com", headshot: st("pro-consultant-man", "Jonah Reyes in a studio corridor"), primaryCta: "projects",
    projects: [
      { title: "Hotel identity and wayfinding", role: "Lead designer", period: "2025", description: "Logo, room signage and printed guides for a 40-room hotel.", tags: "Identity, Signage", images: [st("stay-lobby", "A hotel lobby")] },
      { title: "Ceramics studio rebrand", role: "Designer", period: "2024", description: "A new wordmark, packaging and shop signs for a pottery studio.", tags: "Identity, Packaging", images: [st("make-ceramics-shelf", "Shelves of ceramics")] },
      { title: "Office building signage", role: "Designer", period: "2024", description: "Lobby directory and floor signage in brushed steel.", tags: "Wayfinding", images: [st("biz-glass", "A glass office facade")] },
    ],
    experience: [{ role: "Independent brand designer", org: "Self-employed", period: "2019 — now", description: "Identity and signage for hospitality clients." }],
    skills: "Brand identity, Naming, Signage, Packaging, Menus",
  } },
  "p-spotlight": { answers: {
    name: "Amara Okafor", title: "Speaker and leadership coach", location: "London · Lagos",
    tagline: "Talks and workshops on leading teams through change.",
    bio: "I spent fifteen years leading operations teams in banking before I started coaching. Today I speak at conferences and run workshops for leadership teams on difficult conversations, feedback and change.\n\nTalks are 30 to 60 minutes; workshops run for half a day or a full day.",
    email: "bookings@example.com", headshot: st("pro-speaker-woman", "Amara Okafor presenting at a whiteboard"), primaryCta: "booking", bookingUrl: "https://example.com/book",
    projects: [
      { title: "Leading through a merger", role: "Keynote", period: "2025", description: "Opening talk for 400 managers on the first year after a merger.", tags: "Keynote", images: [st("pro-speaker-man", "A speaker presenting to a room")] },
      { title: "Feedback that lands", role: "Workshop", period: "2025", description: "A half-day workshop for senior leaders, run monthly.", tags: "Workshop", images: [st("biz-boardroom", "A leadership team in a boardroom")] },
      { title: "One-to-one coaching", role: "Coaching", period: "Ongoing", description: "Six sessions over three months for new directors.", tags: "Coaching", images: [st("biz-window-table", "A coaching session by a window")] },
    ],
    experience: [{ role: "Coach and speaker", org: "Self-employed", period: "2020 — now", location: "London", description: "Keynotes, workshops and coaching." }, { role: "Head of Operations", org: "Bank (fictional)", period: "2008 — 2020", description: "Led teams of up to 300 people." }],
  } },
  "p-dossier": { answers: {
    name: "Kenji Watanabe", title: "Senior software engineer · Toronto", location: "Toronto, Canada",
    tagline: "I build data platforms that stay fast as they grow.",
    bio: "Backend and data engineer with ten years of experience in payments and logistics. I care about clear schemas, small services and dashboards that people trust.",
    email: "kenji@example.com", headshot: st("pro-laptop-man", "Kenji Watanabe at a laptop"), primaryCta: "contact",
    projects: [
      { title: "Event pipeline rebuild", role: "Tech lead", period: "2025", description: "Replaced a nightly batch with a streaming pipeline; reports now update within a minute.", tags: "Kafka, PostgreSQL" },
      { title: "Fraud rules engine", role: "Engineer", period: "2023", description: "A rules service checking 2 million payments a day.", tags: "Go, Redis" },
    ],
    experience: [
      { role: "Senior software engineer", org: "Payments company (fictional)", period: "2021 — now", location: "Toronto", description: "Data platform and reporting." },
      { role: "Software engineer", org: "Logistics startup (fictional)", period: "2016 — 2021", location: "Vancouver", description: "Routing and tracking services." },
    ],
    education: [{ title: "BASc, Computer Engineering", org: "University (fictional)", period: "2016" }],
    skillGroups: [{ name: "Languages", items: "Go, Python, TypeScript, SQL" }, { name: "Systems", items: "PostgreSQL, Kafka, Redis, Kubernetes" }],
    achievements: [{ title: "Conference talk: schemas that last (sample)", year: "2024" }],
    socials: [{ network: "GitHub", url: "https://github.com/" }, { network: "LinkedIn", url: "https://www.linkedin.com/" }],
  } },
  "p-ledger": { answers: {
    name: "Dr. Ingrid Solberg", title: "Cardiologist and clinical researcher", location: "Bergen, Norway",
    tagline: "Clinical research on heart failure in older adults.",
    bio: "I am a consultant cardiologist and lead a research group studying heart failure care for patients over seventy-five. Our trials test simpler treatment plans that patients can follow at home.",
    email: "office@example.com", headshot: st("pro-glasses-woman", "Portrait of Dr. Ingrid Solberg"), primaryCta: "contact",
    experience: [
      { role: "Consultant cardiologist", org: "University hospital (fictional)", period: "2017 — now", location: "Bergen", description: "Heart failure clinic and research group lead." },
      { role: "Research fellow", org: "Cardiology institute (fictional)", period: "2013 — 2017", description: "Trials in home-based care." },
    ],
    education: [{ title: "PhD, Clinical Medicine", org: "University (fictional)", period: "2013" }, { title: "MD", org: "University (fictional)", period: "2008" }],
    achievements: [
      { title: "Home-based follow-up after heart failure admission (journal article, sample)", year: "2025", detail: "Sample publication entry." },
      { title: "Simplified medication plans in older adults (journal article, sample)", year: "2023", detail: "Sample publication entry." },
      { title: "Young investigator award (sample)", year: "2019" },
    ],
    skills: "Clinical trials, Heart failure, Echocardiography, Biostatistics",
  } },
  "p-executive": { answers: {
    name: "Martin Hale", title: "Chief Operating Officer", location: "Zurich, Switzerland",
    tagline: "Twenty-five years running operations for consumer brands, from factory floor to boardroom.",
    bio: "I have run supply chains, factories and customer operations for three consumer companies across Europe and Asia. I now sit on two boards and advise companies preparing for international expansion.",
    email: "office@example.com", headshot: st("pro-exec-man", "Martin Hale seated in his office"), primaryCta: "contact",
    projects: [
      { title: "Asia manufacturing move", role: "COO", period: "2019 — 2021", description: "Moved production for 1,200 products to two new plants without a stock-out." },
      { title: "Customer operations rebuild", role: "COO", period: "2016 — 2018", description: "Brought service in-house across eight countries." },
    ],
    experience: [
      { role: "Board member", org: "Two consumer companies (fictional)", period: "2022 — now", location: "Zurich" },
      { role: "Chief Operating Officer", org: "Consumer brand (fictional)", period: "2014 — 2022", location: "Zurich", description: "Supply chain, manufacturing and customer operations." },
    ],
    achievements: [
      { title: "Operations leader of the year (sample)", detail: "Industry association award", year: "2021" },
      { title: "Supply chain excellence (sample)", detail: "Manufacturing award, finalist", year: "2019" },
      { title: "Visiting fellow, business school (sample)", detail: "Operations programme", year: "2018" },
    ],
  } },
  "p-laureate": { answers: {
    name: "Rafael Moreno", title: "Architect and partner", location: "Madrid, Spain",
    tagline: "Public buildings and housing that age well.",
    bio: "I lead a practice of twenty architects designing libraries, schools and social housing in Spain and Latin America. Our buildings are known for daylight, local materials and low running costs.",
    email: "studio@example.com", headshot: st("pro-suit-window", "Rafael Moreno by a window"), primaryCta: "contact",
    projects: [
      { title: "Municipal library, Seville", role: "Lead architect", period: "2024", description: "A 4,000 m² library built around a shaded courtyard." },
      { title: "Social housing, Valencia", role: "Partner", period: "2022", description: "120 homes in timber and brick, rated nearly zero-energy." },
    ],
    experience: [{ role: "Founding partner", org: "Architecture practice (fictional)", period: "2008 — now", location: "Madrid" }],
    achievements: [
      { title: "National architecture award (sample)", detail: "Public buildings", year: "2024" },
      { title: "Housing design prize (sample)", detail: "Social housing, winner", year: "2022" },
      { title: "Biennale exhibition (sample)", detail: "Invited participant", year: "2020" },
    ],
  } },

  // ───────────── Business ─────────────
  "b-chambers": { answers: {
    businessName: "Ashford Whitley LLP", tagline: "Commercial law for owner-run businesses.", industry: "Law firm", city: "Manchester", country: "United Kingdom", servicesHeading: "Practice areas",
    description: "Contracts, employment, property and disputes for companies with 10 to 500 people.",
    about: "Ashford Whitley is a firm of fourteen lawyers. Every client has a named partner who answers their own phone, and every piece of advice comes with a fixed fee agreed in advance.",
    benefits: "A named partner for every client\nFixed fees, agreed in writing\nAdvice in plain English",
    heroImage: st("biz-towers", "Office towers seen from street level"), gallery: [st("biz-boardroom", "A meeting in the firm's boardroom"), st("biz-window-table", "A client meeting by a window")],
    services: [
      { title: "Commercial contracts", description: "Supply, distribution and services agreements, drafted and negotiated." },
      { title: "Employment", description: "Contracts, policies, disputes and tribunal claims." },
      { title: "Commercial property", description: "Leases, purchases and landlord disputes." },
      { title: "Disputes", description: "Negotiation, mediation and litigation." },
    ],
    team: [{ name: "Eleanor Ashford", role: "Managing partner", bio: "Commercial contracts.", image: st("pro-portrait-woman", "Eleanor Ashford") }, { name: "Daniel Whitley", role: "Partner", bio: "Disputes and employment.", image: st("pro-advisor-man", "Daniel Whitley") }],
    faqs: [{ q: "How are your fees set?", a: "We agree a fixed fee in writing before any work starts." }, { q: "Do you work outside Manchester?", a: "Yes, for clients across England and Wales." }],
    phone: "+44 161 496 0000", email: "enquiries@example.com", address: "1 Sample Square", mapQuery: "Spinningfields, Manchester", primaryGoal: "form", quoteForm: false,
    hours: [{ days: "Monday – Friday", hours: "8:30 – 17:30" }],
  } },
  "b-capital": { answers: {
    businessName: "Linden Row Capital", tagline: "Long-term investment in residential property.", industry: "Property investment", city: "Amsterdam", country: "Netherlands", servicesHeading: "How we invest",
    description: "We buy, restore and manage apartment buildings in Dutch and German cities, for pension funds and family offices.",
    about: "Linden Row has invested in residential property since 2009. We hold buildings for the long term, restore them to high energy standards and manage them ourselves.",
    benefits: "Buildings held for ten years or more\nEnergy upgrades on every purchase\nIn-house management",
    heroImage: st("biz-facade-bw", "A modern apartment facade"), gallery: [st("biz-dark-boardroom", "The investment committee room"), st("biz-glass", "A glass facade")],
    services: [
      { title: "Acquisition", description: "Apartment buildings of 20 to 200 homes in city centres." },
      { title: "Restoration", description: "Energy upgrades and renovation, finished within eighteen months." },
      { title: "Management", description: "Lettings, maintenance and tenant care by our own team." },
    ],
    team: [{ name: "Pieter de Vries", role: "Managing director", image: st("pro-exec-man", "Pieter de Vries") }, { name: "Sofia Brandt", role: "Head of acquisitions", image: st("pro-glasses-woman", "Sofia Brandt") }],
    email: "investors@example.com", phone: "+31 20 555 0100", primaryGoal: "email",
  } },
  "b-counsel": { answers: {
    businessName: "Northgate Advisory", tagline: "Independent advice for boards and owners.", industry: "Strategy advisory", city: "New York", country: "United States",
    description: "We advise boards and owners on sales, succession and strategy. We do not take commission and we do not sell products.",
    about: "Northgate is five senior advisers who have each run a business. We take a small number of engagements at a time and work on each one ourselves.",
    benefits: "Independent: no commission, no products\nSenior advisers on every engagement\nA written recommendation at the end",
    heroImage: st("biz-dark-boardroom", "A quiet boardroom at dusk"), gallery: [st("pro-advisor-man", "An adviser in conversation"), st("biz-boardroom", "A board meeting")],
    services: [
      { title: "Sale preparation", description: "Getting a company ready for sale over twelve to eighteen months." },
      { title: "Succession", description: "Planning the handover of a family business." },
      { title: "Board advisory", description: "An independent view for boards facing a large decision." },
    ],
    email: "office@example.com", primaryGoal: "email",
  } },
  "b-quorum": { answers: {
    businessName: "Fernhill Partners", tagline: "Financial advice for families, across generations.", industry: "Financial advice", city: "Edinburgh", country: "United Kingdom",
    description: "Independent financial planning, investment and estate advice for families and their businesses.",
    about: "Fernhill Partners advises around ninety families. Fees are fixed and published, and we meet every client at least twice a year.",
    benefits: "Fixed, published fees\nTwo reviews a year as standard\nAdvice for every generation",
    heroImage: st("stay-lobby", "A calm reception room"), gallery: [st("biz-window-table", "A meeting by a window"), st("pro-advisor-man", "An adviser")],
    services: [
      { title: "Financial planning", description: "A written plan for income, savings and retirement." },
      { title: "Investment management", description: "Diversified portfolios, reviewed twice a year." },
      { title: "Estate planning", description: "Wills, trusts and gifts, with your solicitor." },
    ],
    email: "families@example.com", phone: "+44 131 496 0000", primaryGoal: "form", quoteForm: false,
  } },
  "b-workshop": { answers: {
    businessName: "Hollis & Grain", tagline: "Furniture and joinery, made to order in our workshop.", industry: "Joinery", city: "Bristol", country: "United Kingdom",
    description: "Kitchens, tables, shelving and built-in furniture in solid wood.",
    about: "Hollis & Grain is a workshop of six makers. We design every piece with the client, build it by hand and fit it ourselves.\n\nMost commissions take eight to twelve weeks.",
    benefits: "Designed with you\nBuilt by hand in Bristol\nFitted by the makers",
    heroImage: st("make-bench", "A maker at the workbench"), gallery: [st("make-apron", "A craftsman in a leather apron"), st("make-tools", "Hand tools on the workshop wall"), st("home-kitchen", "A finished kitchen"), st("home-coffee-table", "A finished coffee table")],
    services: [
      { title: "Kitchens", description: "Solid-wood kitchens, designed and fitted.", image: st("home-kitchen", "A solid-wood kitchen") },
      { title: "Tables", description: "Dining and coffee tables in oak, ash and walnut.", image: st("home-coffee-table", "A wooden coffee table") },
      { title: "Shelving and storage", description: "Built-in shelves, wardrobes and window seats.", image: st("home-pendant-shelves", "Built-in shelves") },
    ],
    email: "workshop@example.com", primaryGoal: "quote", quoteForm: true,
    faqs: [{ q: "How long does a commission take?", a: "Usually eight to twelve weeks from the agreed design." }, { q: "Do you work outside Bristol?", a: "Yes, across the south-west of England." }],
  } },
  "b-bench": { answers: {
    businessName: "Clay Room", tagline: "A ceramics studio with classes, kilns and open studio time.", industry: "Ceramics studio", city: "Melbourne", country: "Australia", servicesHeading: "Classes and membership",
    description: "Wheel and hand-building classes for beginners, and studio membership for potters.",
    about: "Clay Room opened in a former print works in 2019. We run small classes of eight, rent shelf space and kiln firings to members, and sell work made in the studio.",
    benefits: "Classes of eight people\nKiln firings every week\nOpen studio for members",
    heroImage: st("make-potter", "A potter shaping clay on the wheel"), gallery: [st("make-ceramics-shelf", "Finished pieces on studio shelves"), st("home-bud-vases", "Two bud vases")],
    services: [
      { title: "Beginner wheel course", description: "Six weekly sessions on the wheel, all materials included.", price: "A$420", image: st("make-potter", "A student at the wheel") },
      { title: "Hand-building workshop", description: "A Saturday workshop making a set of bowls.", price: "A$140", image: st("make-ceramics-shelf", "Hand-built bowls") },
      { title: "Studio membership", description: "Open studio hours, a shelf and weekly firings.", price: "A$190 a month", image: st("home-white-jug", "A glazed jug") },
    ],
    email: "hello@example.com", primaryGoal: "form", quoteForm: false,
    hours: [{ days: "Tuesday – Sunday", hours: "10:00 – 21:00" }],
  } },
  "b-retreat": { answers: {
    businessName: "Casa Olmo", tagline: "Twelve rooms in a palm garden by the sea.", industry: "Boutique hotel", city: "Tulum", country: "Mexico", servicesHeading: "Rooms",
    description: "A small hotel with a long pool, a palm garden and a kitchen that cooks from its own beds.",
    about: "Casa Olmo is a restored hacienda with twelve rooms. Breakfast is served by the pool, and dinner is cooked from what grows in the garden.",
    benefits: "Twelve rooms only\nBreakfast and dinner from the garden\nA short walk to the beach",
    heroImage: st("stay-pool", "A long pool lined with palms"), gallery: [st("stay-room-green", "A guest room with a green wall"), st("stay-white-bed", "A white bed by a window"), st("stay-resort", "The gardens from above"), st("stay-rooftop", "A rooftop pool")],
    services: [
      { title: "Garden rooms", description: "Ground-floor rooms opening onto the palm garden.", price: "From $240 a night", image: st("stay-room-green", "A garden room") },
      { title: "Sea-view rooms", description: "First-floor rooms with a view to the coast.", price: "From $310 a night", image: st("stay-white-bed", "A sea-view room") },
      { title: "The farmhouse suite", description: "Two rooms and a private terrace.", price: "From $520 a night", image: st("stay-rooftop", "A private terrace") },
    ],
    email: "stay@example.com", primaryGoal: "form", quoteForm: true,
    faqs: [{ q: "When are you open?", a: "All year, except September." }, { q: "Do you welcome children?", a: "Guests over twelve are welcome." }],
  } },
  "b-coast": { answers: {
    businessName: "Blue Harbour Resort", tagline: "Beach villas on a quiet bay.", industry: "Beach resort", city: "Bali", country: "Indonesia", servicesHeading: "Villas",
    description: "Thirty villas with private pools, a beach club and a dive centre.",
    about: "Blue Harbour opened in 2016 on a bay with no other hotels. Every villa has its own pool, and the reef is a short swim from the beach.",
    benefits: "Private pool in every villa\nDive centre on the beach\nAirport transfers included",
    heroImage: st("stay-resort", "The resort and its pools from above"), gallery: [st("stay-pool", "The main pool"), st("stay-rooftop", "A villa pool"), st("stay-white-bed", "A villa bedroom")],
    services: [
      { title: "Garden villa", description: "One bedroom, a plunge pool and an outdoor shower.", price: "From $260 a night", image: st("stay-white-bed", "A garden villa bedroom") },
      { title: "Pool villa", description: "Two bedrooms and a 10-metre pool.", price: "From $420 a night", image: st("stay-rooftop", "A villa pool") },
      { title: "Beach house", description: "Three bedrooms on the sand.", price: "From $780 a night", image: st("stay-pool", "The beach house pool") },
    ],
    email: "reservations@example.com", primaryGoal: "form", quoteForm: true,
  } },
};
