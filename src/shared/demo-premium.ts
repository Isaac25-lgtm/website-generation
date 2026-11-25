import type { ImageRef } from "./schema";
import type { Persona } from "./demo";

// Fictional people for the premium personal templates, built from profession kits so every
// template is a complete site (home, experience and contact pages) with real CC0 photos.

const st = (name: string, alt: string): ImageRef => ({ stock: name, alt, caption: "" });
const job = (title: string, role: string, period: string, description: string, image: ImageRef, tags = "") => ({ title, role, period, description, images: [image], tags });

type Kit = { projects: ReturnType<typeof job>[]; experience: { role: string; org: string; period: string; description?: string }[]; skills: string; gallery?: ImageRef[] };

const KITS: Record<string, Kit> = {
  design: {
    projects: [
      job("Booking app redesign", "Lead designer", "2025", "Cut the booking flow from nine steps to four.", st("work-wireframes", "Wireframes on paper"), "Product, Mobile"),
      job("Identity for a coffee roaster", "Designer", "2024", "Name, logo and packaging for a new roastery.", st("work-sketches", "Logo sketches"), "Brand"),
      job("Design system", "Design lead", "2023", "Components shared by eight product teams.", st("work-pattern", "A geometric pattern"), "Systems"),
    ],
    experience: [{ role: "Senior designer", org: "Product studio (fictional)", period: "2021 — now" }, { role: "Designer", org: "Agency (fictional)", period: "2016 — 2021" }],
    skills: "Product design, Brand identity, Prototyping, Design systems, Workshops",
  },
  engineer: {
    projects: [
      job("Payments dashboard", "Engineer", "2025", "Orders, refunds and payouts in one place.", st("biz-analytics", "Charts on a laptop"), "TypeScript, PostgreSQL"),
      job("Delivery tracking", "Tech lead", "2024", "Live tracking for 3,000 daily deliveries.", st("biz-glass", "An office building"), "Go, Maps"),
      job("Open-source form library", "Maintainer", "2023", "Accessible forms for React apps.", st("work-wireframes", "Form sketches"), "Open source"),
    ],
    experience: [{ role: "Senior engineer", org: "Logistics company (fictional)", period: "2021 — now" }, { role: "Engineer", org: "Fintech startup (fictional)", period: "2017 — 2021" }],
    skills: "TypeScript, Go, PostgreSQL, React, System design",
  },
  writer: {
    projects: [
      job("A book about small habits", "Author", "2025", "Twelve essays on doing a little every day.", st("obj-open-book", "An open book"), "Book"),
      job("Weekly letter", "Writer", "Weekly", "One practical idea every Sunday.", st("obj-journal", "A notebook"), "Newsletter"),
      job("Magazine features", "Writer", "2024", "Long reads on food and work.", st("obj-old-books", "Old books"), "Features"),
    ],
    experience: [{ role: "Writer", org: "Independent", period: "2019 — now" }, { role: "Editor", org: "Magazine (fictional)", period: "2013 — 2019" }],
    skills: "Writing, Editing, Interviews, Newsletters, Workshops",
  },
  photo: {
    projects: [
      job("Lake communities", "Photographer", "2025", "A year with fishing families.", st("photo-fisherman-gold", "Fisherman at golden hour"), "Documentary"),
      job("Portraits of makers", "Photographer", "2024", "Artists photographed where they work.", st("photo-street-artist", "A street artist"), "Portraits"),
      job("Coastline", "Photographer", "2023", "Sea and light along the coast.", st("photo-sea", "The sea"), "Landscape"),
    ],
    experience: [{ role: "Photographer", org: "Independent", period: "2016 — now" }],
    skills: "Portraits, Documentary, Editorial, Film, Retouching",
    gallery: [st("photo-portrait-smile", "Portrait"), st("photo-teal-lake", "Lake"), st("photo-misty-mountains", "Mountains"), st("photo-elder", "Elder"), st("photo-boat", "Boat"), st("photo-kayak", "Kayak")],
  },
  speaker: {
    projects: [
      job("Keynote: leading change", "Speaker", "2025", "A 40-minute talk for leadership teams.", st("pro-speaker-man", "On stage"), "Keynote"),
      job("Strategy workshops", "Facilitator", "2025", "Half-day sessions for boards.", st("biz-boardroom", "A boardroom"), "Workshop"),
      job("Podcast series", "Host", "Weekly", "Conversations with founders.", st("obj-journal", "Notes"), "Podcast"),
    ],
    experience: [{ role: "Strategist and speaker", org: "Independent", period: "2018 — now" }, { role: "Head of strategy", org: "Agency (fictional)", period: "2011 — 2018" }],
    skills: "Strategy, Keynotes, Workshops, Brand, Podcasting",
  },
};

type Row = [id: string, name: string, title: string, location: string, tagline: string, bio: string, headshot: string, kit: keyof typeof KITS];

const ROWS: Row[] = [
  ["p-desktop", "Femi Adewale", "Art director", "Ibadan", "Art direction for record labels, fashion and film.", "I art-direct campaigns and album artwork, and I keep my CV one click away.", "pro-young-man", "design"],
  ["p-retro", "Marta Novak", "Builder", "Ljubljana", "I build small tools and write about how they work.", "Developer building small, useful tools for other developers.", "pro-glasses-woman", "engineer"],
  ["p-globe", "Rafael Duarte", "Growth designer", "Porto Alegre", "Brand, product and growth design for companies selling across borders.", "I help companies grow in new markets with clear brands and simple products.", "pro-consultant-man", "design"],
  ["p-planet", "Astrid Holm", "Builder and writer", "Aarhus", "I make small things for the internet and write about them.", "Builder and writer working on tools for people who write.", "pro-coast-woman", "writer"],
  ["p-behind", "Leah Bouchard", "Content creator", "Montreal", "Videos and stories about food, travel and small businesses.", "I make short films about food and the people who make it.", "pro-smile-woman", "speaker"],
  ["p-portrait", "Carla Benedetti", "Costume designer", "Turin", "Costume design for theatre, film and opera.", "Costume designer with twenty productions across Europe.", "pro-city-woman", "design"],
  ["p-scatter", "Hugo Lefèvre", "Designer", "Nantes", "Design for books, posters and exhibitions.", "Graphic designer working with publishers and museums.", "", "design"],
  ["p-lockscreen", "Noor Haddad", "App designer", "Beirut", "I design apps people open every day.", "Mobile designer for banking, travel and health apps.", "pro-pinkhair-woman", "design"],
  ["p-levels", "Andrés Molina", "Designer", "Medellín", "Ten years of design, one level at a time.", "Product and game designer.", "pro-young-man", "design"],
  ["p-fruit", "Ben Carver", "Designer", "Denver", "Bright, friendly design for brands people like.", "Designer and illustrator for food and drink brands.", "pro-coffee-man", "design"],
  ["p-weight", "Chidi Nwosu", "Engineer", "Enugu", "I build reliable systems for payments and logistics.", "Backend engineer with nine years in payments.", "pro-blazer-laptop-man", "engineer"],
  ["p-stickies", "Kaisa Mets", "Product thinker", "Tartu", "Product strategy, research and a lot of sticky notes.", "Product manager helping teams decide what to build.", "pro-window-woman", "speaker"],
  ["p-initials", "Daniel Ho", "Senior product designer", "Taipei", "Product design for travel and finance.", "Senior designer working across Hong Kong and London.", "", "design"],
  ["p-ticker", "Owen Pryce", "Strategist & speaker", "Cardiff", "Strategy talks and workshops for brands that want to stay relevant.", "Strategist, speaker and podcast host.", "pro-red-sweater-man", "speaker"],
  ["p-clients", "Joost Verbeek", "Web developer", "Rotterdam", "Websites for architects, galleries and studios.", "Independent web developer building fast, accessible sites.", "", "engineer"],
  ["p-storyteller", "Abena Owusu", "Brand storyteller", "Bristol", "Stories that make people remember your brand.", "I write brand stories, scripts and launch campaigns.", "pro-fence-woman", "writer"],
  ["p-swiss", "Lukas Brunner", "Interface designer", "Basel", "Interfaces that are calm, clear and easy to use.", "Brand and interface designer working with software and design studios. I care about grids, type and small details.", "", "design"],
  ["p-sidebar", "Elif Aydın", "Design engineer", "Izmir", "I design and build interfaces.", "Design engineer working between Figma and code.", "pro-coast-woman", "engineer"],
  ["p-outline", "Adjoa Frimpong", "Design leader", "Accra", "Eighteen years leading design for banks, telecoms and retail.", "Design director building teams across Africa and Europe.", "pro-portrait-woman-head", "design"],
  ["p-wordmark", "Nate Holm", "Designer", "Seattle", "Design for brands, books and the web.", "Independent designer.", "", "design"],
  ["p-monogram", "Kelechi Eze", "Designer", "Port Harcourt", "Considered identities for hospitality and fashion.", "Designer working on identities for hotels, restaurants and labels.", "", "design"],
  ["p-uppercase", "Rohan Mehta", "Designer & maker", "Pune", "Designer and maker", "I design products and build them.", "", "design"],
  ["p-datelist", "Cian Byrne", "Designer & engineer", "Galway", "Selected work, newest first.", "Designer and engineer.", "", "engineer"],
  ["p-tripane", "Efua Mensah", "Digital marketing strategist", "Takoradi", "Marketing plans that small businesses can actually follow.", "I help small businesses plan their marketing and stick to it.", "pro-smile-woman", "speaker"],
  ["p-avatar", "Yaw Darko", "Engineer & writer", "Cape Coast", "Engineer writing about building software in West Africa.", "Software engineer and writer.", "pro-young-man", "writer"],
  ["p-resume", "Arvind Rao", "Founder & developer", "Hyderabad", "Developer and founder of a small web studio.", "Fifteen years building websites and web apps for clients in Asia and Europe.", "pro-laptop-man", "engineer"],
  ["p-centeravatar", "Tobi Adeyinka", "Founding product designer", "Abeokuta", "Founding designer for early-stage startups.", "I join startups early and design the first versions of their products.", "pro-advisor-man", "design"],
  ["p-desk", "Moussa Diallo", "Full-stack engineer", "Saint-Louis", "I build web apps from database to button.", "Full-stack engineer working with small teams.", "obj-journal", "engineer"],
  ["p-editorial", "Jonas Keller", "Growth designer", "Leipzig", "Design that helps products grow.", "Growth designer for subscription products.", "fashion-street", "design"],
  ["p-maker", "Simran Gill", "Maker & consultant", "Calgary", "Furniture, prototypes and advice for people starting to make things.", "Maker and product consultant.", "make-bench", "design"],
  ["p-triple", "Erik Sand", "Maker", "Gothenburg", "I try it. I make it. I write it up.", "Maker and tester of hardware and software.", "pro-coffee-man", "engineer"],
  ["p-mockups", "Pranav Iyer", "Mobile engineer", "Bengaluru", "Mobile apps that feel fast and simple.", "Mobile engineer building iOS and Android apps.", "", "engineer"],
  ["p-airy", "Wen Jiahui", "Writer & artist", "Hangzhou", "Writing, drawing and slow work.", "Writer and artist.", "", "writer"],
  ["p-podcast", "Leo Navarro", "Podcast host", "San Diego", "A weekly show about people who build things.", "Host of a weekly interview podcast.", "pro-red-sweater-man", "speaker"],
  ["p-photogrid", "Ruth Okonkwo", "Portrait photographer", "Winnipeg", "Portraits, film and stills.", "Portrait photographer.", "", "photo"],
  ["p-calm", "Paolo Greco", "Product designer", "Bari", "Calm software for busy people.", "Product designer working on productivity tools.", "pro-coffee-man", "design"],
  ["p-quietnav", "Thandi Nkosi", "Product designer", "Durban", "I design products that respect people's time.", "Product designer.", "", "design"],
  ["p-column", "Saruul Bat", "Product designer", "Almaty", "Product design for health and education.", "Product designer working on health and education products.", "pro-desk-woman", "design"],
  ["p-faintgrid", "Ifeoma Obi", "Product designer", "Owerri", "Product designer who writes things down.", "I design products for fintech and education, and I document everything.", "", "design"],
  ["p-twotone", "Mei Tan", "Spatial product designer", "Penang", "Designing products for spaces and the people in them.", "Product designer working on spatial and physical interfaces.", "", "design"],
  ["p-note", "Bisi Ogun", "Product designer", "Ilorin", "I turn messy problems into products people enjoy.", "Product designer.", "", "design"],
  ["p-fullbleed", "Tamás Kiss", "Product designer & engineer", "Debrecen", "Product designer and engineer.", "I design and build products.", "pro-older-man", "engineer"],
  ["p-chat", "Can Demir", "Product manager", "Bursa", "Product manager who likes to talk to customers.", "I run discovery and delivery for software teams.", "", "speaker"],
  ["p-dashboard", "Tom Ashby", "Product manager", "Sheffield", "Product, operations and the numbers in between.", "Product manager for operations software.", "photo-teal-lake", "engineer"],
  ["p-profile", "Aisyah Rahim", "Senior product designer", "Johor Bahru", "Senior product designer.", "Product designer for banking and e-commerce.", "pro-reader-woman", "design"],
  ["p-services", "Greta Vogel", "Visual designer", "Bremen", "Brand and visual design that people remember.", "Visual designer for brands and campaigns.", "", "design"],
  ["p-blog", "Walter Simms", "Writer & web designer", "Philadelphia", "Notes on making websites that last.", "Writer, designer and editor.", "", "writer"],
  ["p-island", "Iker Salas", "Game & web maker", "Guadalajara", "Small worlds you can explore.", "I make small games and interactive websites.", "home-white-room", "engineer"],
  ["p-violet", "Zhou Ning", "Designer & builder", "Chengdu", "I design and build tools for creative people.", "Designer and builder.", "", "design"],
];

export const PREMIUM_PERSONAS: Record<string, Persona> = Object.fromEntries(ROWS.map(([id, name, title, location, tagline, bio, headshot, kit]) => {
  const k = KITS[kit];
  return [id, { answers: {
    name, title, location, tagline, bio, email: "hello@example.com",
    headshot: headshot ? st(headshot.replace("-x", ""), name) : undefined,
    projects: k.projects, experience: k.experience, skills: k.skills, gallery: k.gallery,
  } }];
}));
