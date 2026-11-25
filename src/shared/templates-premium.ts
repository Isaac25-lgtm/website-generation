import type { TemplateDef } from "./templates";
import type { Theme } from "./schema";

// Premium personal templates: one per four-star reference site (structure only; nothing copied).

type Pal = [bg: string, surface: string, text: string, muted: string, primary: string, accent: string];
type Row = [id: string, name: string, hero: string, pal: Pal, h: Theme["fontHeading"], b: Theme["fontBody"], header: Theme["headerStyle"], description: string, industries: string, extra?: Partial<{ dark: boolean; v: TemplateDef["variants"]; css: string; radius: Theme["radius"]; tier: "public" | "member" }>];

const LIGHT: Pal = ["#ffffff", "#f3f3f1", "#141414", "#5e5e5b", "#141414", "#141414"];

const ROWS: Row[] = [
  ["p-desktop", "Desktop", "desktop", ["#f3efe6", "#e9e3d6", "#1c1b18", "#5f5a50", "#2a6f97", "#2a6f97"], "space-grotesk", "inter", "bar", "Your site as a retro computer desktop: icons for each page and a window with your introduction and a download-CV button.", "art director, designer, creative", { tier: "public" }],
  ["p-retro", "Retro", "desktop", ["#eef2f5", "#e2e8ee", "#14202b", "#55626e", "#3a7d44", "#3a7d44"], "space-mono", "inter", "bar", "A playful desktop interface in green: folders for your work and a window that introduces you.", "builder, developer, maker"],
  ["p-globe", "Globe", "globe", ["#f5f7ff", "#e8edff", "#101433", "#545a7a", "#1f3dff", "#ff5a36"], "inter-tight", "inter", "bar", "Electric blue with a halftone globe and a big name. For growth and product designers who work worldwide.", "growth designer, product designer, brand designer", { tier: "public" }],
  ["p-planet", "Planet", "planet", ["#fbf6ec", "#f1e9d8", "#24201a", "#665e50", "#24201a", "#e86a33"], "fraunces", "dm-sans", "centered", "A cream dotted page, a little planet and your name in playful italic. Warm and memorable.", "builder, writer, indie maker"],
  ["p-behind", "Behind", "nameback", ["#ffffff", "#f4f1e8", "#131313", "#5c5c58", "#131313", "#f3c623"], "archivo", "inter", "bar", "Your first name huge and yellow behind your portrait, with three stat cards beside it. Bold creator energy.", "content creator, presenter, personal brand"],
  ["p-portrait", "Portrait", "fullportrait", ["#f6f2ec", "#ece5da", "#221c16", "#655a4e", "#221c16", "#8c6b3f"], "cormorant", "inter", "centered", "A full-screen portrait with a serif name and quiet navigation. For designers whose face is the brand.", "costume designer, stylist, artist"],
  ["p-scatter", "Scatter", "scatter", ["#fbf7f4", "#f1e8e2", "#2a1517", "#6c5a5c", "#7a1f2b", "#7a1f2b"], "playfair", "inter", "minimal", "Your name centred in a serif, with work scattered around it like prints on a table.", "designer, illustrator, photographer"],
  ["p-lockscreen", "Lock Screen", "lockscreen", ["#f4f5f7", "#e8eaee", "#121417", "#585d66", "#121417", "#5a7cff"], "inter-tight", "inter", "bar", "A phone lock screen where each notification is one of your projects.", "designer, app designer, product designer", { radius: "lg" }],
  ["p-levels", "Levels", "levels", ["#0f1020", "#191a33", "#f1f1fb", "#a6a8c6", "#f1f1fb", "#ffcc3d"], "space-mono", "inter", "bar", "Your career as a video game: Player 1, each role a level with its own progress bar.", "designer, game designer, developer", { dark: true }],
  ["p-fruit", "Fruit", "playshapes", ["#f7f8fc", "#eceef6", "#14213d", "#56607a", "#14213d", "#ff8a65"], "bricolage", "inter", "bar", "Navy with soft, playful shapes and a big rounded name. Friendly and confident.", "designer, illustrator, creative", { radius: "xl" }],
  ["p-weight", "Weight", "contour", ["#f1f2ee", "#e5e7e1", "#121412", "#5a6058", "#3e5c3a", "#3e5c3a"], "archivo", "inter", "bar", "A giant name in heavy and light weights over contour lines. Strong and technical.", "engineer, architect, developer"],
  ["p-stickies", "Sticky Notes", "stickies", ["#fdfbf6", "#efebe1", "#1f1d18", "#615c51", "#1f1d18", "#1f1d18"], "dm-sans", "dm-sans", "bar", "A board of sticky notes: who you are, what you do and what you've made.", "product thinker, strategist, product manager"],
  ["p-initials", "Initials", "initials", ["#0c0c0c", "#161616", "#f1f1ef", "#a8a8a4", "#f1f1ef", "#f1f1ef"], "inter-tight", "inter", "minimal", "Cinematic black with your initials enormous and your full name beneath.", "senior designer, art director, filmmaker", { dark: true }],
  ["p-ticker", "Ticker", "ticker", ["#fff8ef", "#f6ead8", "#141414", "#5e5850", "#141414", "#ff5d8f"], "archivo-black", "inter", "bar", "Bold shapes, a big name and a news ticker running everything you do. For speakers and strategists.", "strategist, speaker, consultant"],
  ["p-clients", "Clients", "clients", ["#ffffff", "#f2f4ff", "#0d0f1a", "#545a72", "#2337f5", "#2337f5"], "playfair", "inter", "bar", "Electric blue, with your projects or clients set in giant italic, one per line.", "web developer, freelancer, agency of one"],
  ["p-storyteller", "Storyteller", "creator", ["#faf5ec", "#efe6d6", "#221a12", "#665a4c", "#7a3b1d", "#7a3b1d"], "dm-serif", "inter", "bar", "Cream page, a bold serif headline and a portrait card. For brand storytellers and content strategists.", "brand storyteller, content strategist, copywriter"],
  ["p-swiss", "Swiss", "swiss", LIGHT, "inter-tight", "inter", "minimal", "A strict twelve-column Swiss grid: name, role and a calm, readable bio.", "designer, interface designer, typographer", { tier: "public" }],
  ["p-sidebar", "Sidebar", "profilegrid", ["#fafafa", "#f0f0f0", "#161616", "#5c5c5c", "#161616", "#3b82f6"], "inter", "inter", "minimal", "A profile column that stays in view beside a tidy grid of your work.", "design engineer, developer, designer"],
  ["p-outline", "Outline", "outline", ["#0d0d0b", "#171714", "#efe7d2", "#bdb39b", "#c8a24a", "#c8a24a"], "bodoni-moda", "inter", "bar", "Black and gold, with your surname in outlined capitals. Executive and assured.", "design leader, executive, creative director", { dark: true }],
  ["p-wordmark", "Wordmark", "wordmark", LIGHT, "inter-tight", "inter", "minimal", "Your name set as a huge Swiss wordmark, with minimal navigation and one line about you.", "designer, art director, developer"],
  ["p-monogram", "Monogram", "monogram", ["#f7f3ec", "#ede6da", "#2a241c", "#6a6052", "#2a241c", "#8b6a42"], "cormorant", "inter", "centered", "A refined monogram, a serif name and an italic line, on warm neutrals.", "designer, consultant, stylist"],
  ["p-uppercase", "Uppercase", "studiodark", ["#0e0e10", "#18181b", "#f2f2ef", "#a3a3a6", "#f2f2ef", "#ff6b35"], "archivo", "inter", "minimal", "Dark, with your role set in giant uppercase. For designers and makers with a confident voice.", "designer, maker, art director", { dark: true, css: ".hero.studiodark h1{text-transform:uppercase;font-stretch:80%}" }],
  ["p-datelist", "Date List", "datelist", LIGHT, "inter", "inter", "minimal", "Ultra-minimal: your name, one line and a dated list of projects. Nothing else.", "designer, engineer, researcher", { tier: "public" }],
  ["p-tripane", "Tripane", "tripane", ["#f8f3ee", "#efe5dc", "#20160f", "#64564a", "#20160f", "#e0602a"], "dm-serif", "dm-sans", "bar", "Headline on the left, an arched portrait in the middle and your call to action on the right. A coach's layout.", "marketing strategist, coach, consultant"],
  ["p-avatar", "Avatar", "intro", ["#fbfaf7", "#f1efe9", "#1b1d22", "#5c5f67", "#1b1d22", "#3f7d5c"], "lora", "inter", "minimal", "A clean name, a round portrait and a readable introduction. Friendly and clear.", "engineer, writer, analyst"],
  ["p-resume", "Résumé Card", "resumecard", ["#ffffff", "#f1f3f6", "#121722", "#576072", "#121722", "#2b59c3"], "manrope", "inter", "minimal", "A centred résumé card with your portrait, roles and dates, ready to read like a printed CV.", "developer, founder, job seeker", { tier: "public" }],
  ["p-centeravatar", "Centre", "centeravatar", ["#fcfcfb", "#f2f2ef", "#121212", "#5d5d5a", "#121212", "#121212"], "inter-tight", "inter", "bar", "A centred portrait and statement, then filter tabs over your work.", "product designer, founding designer, UX designer"],
  ["p-desk", "Desk", "desk", ["#fbf4e6", "#f2e6cf", "#1e1a13", "#615848", "#1e1a13", "#ffb703"], "bricolage", "inter", "bar", "A big friendly name beside a photo of your desk with a bright role tag.", "full-stack engineer, developer, maker", { radius: "xl" }],
  ["p-editorial", "Editorial", "editorialname", ["#f6f5f1", "#ebe9e2", "#151513", "#5e5d58", "#151513", "#151513"], "newsreader", "inter", "minimal", "A large serif name, a role line and a wide editorial photograph.", "growth designer, writer, editor"],
  ["p-maker", "Maker", "sentence", ["#f7f2e8", "#ede5d4", "#24201a", "#625a4c", "#24201a", "#a14e2a"], "fraunces", "inter", "minimal", "Cream, with one serif sentence about what you make, and neatly organised sections below.", "maker, consultant, engineer", { css: ".hero.sentence h1{font-weight:400}" }],
  ["p-triple", "Triple", "stacked3", ["#ffffff", "#f3f3f3", "#111111", "#7a7a7a", "#0f62fe", "#0f62fe"], "archivo", "inter", "bar", "Three short sentences stacked in bold beside a portrait: what you try, make and share.", "maker, tester, engineer"],
  ["p-mockups", "Mockups", "mockups", ["#f8f7f5", "#eeece8", "#141414", "#5b5a56", "#141414", "#141414"], "instrument-serif", "inter", "bar", "A bold headline with an italic serif half, and your work in three phone frames.", "mobile engineer, app designer, product designer"],
  ["p-airy", "Airy", "centername", ["#fbfbfa", "#f1f1ee", "#2a2a28", "#6a6a66", "#2a2a28", "#2a2a28"], "cormorant", "inter", "centered", "A soft, centred serif name with plenty of air around it.", "writer, artist, multi-interest"],
  ["p-podcast", "Podcast", "champion", ["#0e0e0e", "#181818", "#f5f5f2", "#a9a9a4", "#ffd400", "#ffd400"], "archivo", "inter", "bar", "Bold condensed white and yellow over your portrait. For podcast hosts and creators.", "podcast host, creator, broadcaster", { dark: true }],
  ["p-photogrid", "Photo Grid", "photogrid", LIGHT, "inter", "inter", "minimal", "A clean, tight grid of photographs straight after your name. For photographers.", "photographer, filmmaker, visual artist", { tier: "public", v: { gallery: "grid" } }],
  ["p-calm", "Calm", "essay", ["#fbfbf9", "#f1f1ed", "#1c1c1a", "#5f5f5a", "#1c1c1a", "#1c1c1a"], "inter", "inter", "minimal", "A calm layout: name, one paragraph and quiet snapshots of your work.", "product designer, designer, researcher"],
  ["p-quietnav", "Quiet", "sentence", ["#ffffff", "#f4f4f2", "#1d1d1b", "#62625e", "#1d1d1b", "#1d1d1b"], "newsreader", "inter", "sidebar", "A minimal serif statement with quiet navigation down the left.", "product designer, writer, consultant", { css: ".hero.sentence h1{font-weight:400;font-size:clamp(1.8rem,3.4vw,2.8rem)}" }],
  ["p-column", "Column", "essay", ["#ffffff", "#f4f4f4", "#111111", "#5d5d5d", "#111111", "#111111"], "inter-tight", "inter", "minimal", "A single text column beside your name, then a row of product shots.", "product designer, engineer"],
  ["p-faintgrid", "Faint Grid", "gridpaper", ["#fbfbfa", "#f2f2ef", "#151515", "#5f5f5b", "#151515", "#151515"], "space-grotesk", "inter", "minimal", "A text-first bio on a faint grid, like notes on graph paper.", "product designer, engineer, analyst"],
  ["p-twotone", "Two Tone", "twotone", ["#ecebe7", "#e1dfd9", "#151513", "#8a8780", "#151513", "#151513"], "inter-tight", "inter", "floating", "Warm grey, a large two-tone statement and a floating pill menu.", "product designer, spatial designer"],
  ["p-note", "Handnote", "handnote", ["#111113", "#1b1b1e", "#f2f2ef", "#a5a5a2", "#f2f2ef", "#ffb86b"], "instrument-serif", "inter", "bar", "Dark, with a big statement, a handwritten sign-off and an availability badge.", "product designer, UX designer", { dark: true }],
  ["p-fullbleed", "Full Bleed", "fullportrait", ["#111111", "#1b1b1b", "#f2f2f2", "#a8a8a8", "#f2f2f2", "#f2f2f2"], "inter-tight", "inter", "minimal", "A full-bleed portrait with almost no chrome: just your name and one line.", "product designer, engineer, founder", { dark: true }],
  ["p-chat", "Chat", "chat", ["#f5f6f8", "#eceef2", "#14171c", "#5a606b", "#2f6fed", "#2f6fed"], "inter", "inter", "bar", "Your introduction as a short chat conversation in an app window.", "product manager, designer, developer", { radius: "lg" }],
  ["p-dashboard", "Dashboard", "bento", ["#eef2ec", "#ffffff", "#17211a", "#5a6a5e", "#2f5d45", "#2f5d45"], "manrope", "inter", "minimal", "A sage-green dashboard of cards: intro, location, skills, work and current role.", "product manager, operator, analyst", { radius: "lg", css: ".hero.bento .talk{background:#2f5d45;color:#fff}" }],
  ["p-profile", "Profile", "profilesplit", ["#ffffff", "#f4f5f7", "#121417", "#5b616b", "#121417", "#121417"], "inter", "inter", "minimal", "Two columns: your profile and highlights on the left, a featured case study on the right.", "senior product designer, designer"],
  ["p-services", "Services", "statementcards", ["#ffffff", "#f3f3f3", "#121212", "#5e5e5e", "#121212", "#121212"], "archivo", "inter", "bar", "A bold statement with three large image cards and clear services below.", "visual designer, brand designer, art director", { v: { projects: "cards" } }],
  ["p-blog", "Blog", "blog", ["#fffdf8", "#f4efe4", "#1d1a16", "#615a50", "#8c1c13", "#8c1c13"], "libre-baskerville", "lora", "bar", "A classic editorial blog: masthead, dated posts and long-form writing.", "writer, blogger, web pioneer", { tier: "public" }],
  ["p-island", "Island", "hotspots", ["#e9f3f1", "#dbeae6", "#10231f", "#4f665f", "#1d7a65", "#ff8f3f"], "bricolage", "inter", "bar", "A scene you can explore: a photo with glowing hotspots leading to your work, story and contact.", "game maker, web maker, creative developer"],
  ["p-violet", "Violet", "sentence", ["#f6f3ff", "#ebe5ff", "#1d1533", "#5f5675", "#5b3cc4", "#5b3cc4"], "instrument-serif", "inter", "floating", "Solid violet accents, a serif statement and a floating menu. Calm, not flashy.", "designer, builder, founder", { css: ".hero.sentence h1{font-weight:400;color:var(--primary-ink)}" }],
];

export const PREMIUM_PERSONAL_TEMPLATES: TemplateDef[] = ROWS.map(([id, name, hero, c, h, b, header, description, industries, x = {}]) => ({
  id, name, type: "personal", tier: x.tier ?? "member", rank: "premium",
  styles: [hero, x.dark ? "dark" : "light"], industries: industries.split(", "), description,
  theme: {
    mode: x.dark ? "dark" : "light",
    colors: { bg: c[0], surface: c[1], text: c[2], muted: c[3], primary: c[4], accent: c[5] },
    fontHeading: h, fontBody: b, radius: x.radius ?? "sm", density: "airy", headingScale: "lg", animation: "subtle",
    headerStyle: header, cardStyle: "flat", ornament: "none",
  },
  variants: { about: "columns", projects: "cards", experience: "table", footer: "simple", ...x.v, hero },
  art: "arcs",
  css: x.css ?? "",
}));
