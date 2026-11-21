import type { SiteType } from "./pricing";
import { FONT_KEYS, parseSiteDoc, type FontKey, type ImageRef, type Page, type Section, type SiteDoc, type StoreSettings, type Theme } from "./schema";
import { getTemplate } from "./templates";
import { whatsappLink } from "./util";

// ────────────────────────────────────────────────────────────────────────────
// Deterministic site generator. Uses ONLY facts supplied by the customer:
// it never invents testimonials, credentials, opening hours, prices,
// coordinates or product facts. Empty inputs simply omit sections.
// ────────────────────────────────────────────────────────────────────────────

export interface StyleAnswers {
  primary?: string; accent?: string; bg?: string; text?: string;
  mode?: "light" | "dark"; fontHeading?: string; fontBody?: string;
  radius?: Theme["radius"]; density?: Theme["density"]; animation?: Theme["animation"];
  headerStyle?: Theme["headerStyle"]; headingScale?: Theme["headingScale"];
}

export interface CommonAnswers {
  email?: string; phone?: string; whatsapp?: string; whatsappFloat?: boolean; address?: string; city?: string; country?: string; mapQuery?: string;
  socials?: { network: string; url: string }[];
  seoTitle?: string; seoDescription?: string; lang?: string;
  style?: StyleAnswers;
  inspiration?: { sourceHost?: string; notes?: string; tokens?: StyleAnswers };
  logo?: ImageRef; logoOnly?: boolean; heroImage?: ImageRef;
  testimonials?: { quote: string; name: string; role?: string }[];
  faqs?: { q: string; a: string }[];
  gallery?: ImageRef[];
  video?: { provider?: "youtube" | "vimeo"; url?: string };
  footerText?: string;
}

export interface PersonalAnswers extends CommonAnswers {
  name?: string; title?: string; tagline?: string; bio?: string; location?: string;
  skills?: string; skillGroups?: { name: string; items: string }[];
  experience?: { role: string; org?: string; period?: string; location?: string; description?: string }[];
  education?: { title: string; org?: string; period?: string; description?: string }[];
  achievements?: { title: string; detail?: string; year?: string; link?: string }[];
  projects?: { title: string; description?: string; role?: string; period?: string; tags?: string; link?: string; images?: ImageRef[] }[];
  headshot?: ImageRef;
  cvAssetId?: string; cvAllowDownload?: boolean;
  primaryCta?: "contact" | "projects" | "cv" | "booking"; bookingUrl?: string;
}

export interface BusinessAnswers extends CommonAnswers {
  businessName?: string; tagline?: string; description?: string; industry?: string; about?: string;
  benefits?: string; targetCustomers?: string; serviceAreas?: string;
  services?: { title: string; description?: string; price?: string; image?: ImageRef }[];
  team?: { name: string; role?: string; bio?: string; image?: ImageRef }[];
  hours?: { days: string; hours: string }[]; hoursNote?: string;
  primaryGoal?: "call" | "whatsapp" | "email" | "form" | "quote" | "booking" | "visit"; bookingUrl?: string;
  quoteForm?: boolean;
}

export interface EcommerceAnswers extends CommonAnswers {
  storeName?: string; tagline?: string; description?: string; industry?: string; about?: string;
  currency?: string; productType?: "physical" | "digital" | "both";
  promoBanner?: string; featuredHeading?: string;
  hours?: { days: string; hours: string }[];
  store?: Partial<StoreSettings>;
}

export type AnyAnswers = PersonalAnswers & BusinessAnswers & EcommerceAnswers;

const s = (v: unknown, max = 4000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const lines = (v: unknown) => s(v, 4000).split(/\n|;/).map((x) => x.trim()).filter(Boolean);
const csv = (v: unknown) => s(v, 2000).split(/,|\n/).map((x) => x.trim()).filter(Boolean);
const hexOk = (v: unknown) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const fontOk = (v: unknown): v is FontKey => typeof v === "string" && (FONT_KEYS as readonly string[]).includes(v);

let counter = 0;
function sid(kind: string): string {
  counter = (counter + 1) % 1e6;
  return `${kind}-${counter.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function applyStyle(theme: Theme, st?: StyleAnswers): Theme {
  if (!st) return theme;
  const t: Theme = { ...theme, colors: { ...theme.colors } };
  if (st.mode === "dark" && theme.mode === "light") {
    t.mode = "dark";
    t.colors = { ...t.colors, bg: "#0e1116", surface: "#171b22", text: "#eef1f5", muted: "#9aa3b1" };
  } else if (st.mode === "light" && theme.mode === "dark") {
    t.mode = "light";
    t.colors = { ...t.colors, bg: "#ffffff", surface: "#f4f5f7", text: "#14171c", muted: "#5b6472" };
  }
  if (hexOk(st.primary)) t.colors.primary = st.primary!;
  if (hexOk(st.accent)) t.colors.accent = st.accent!;
  if (hexOk(st.bg)) t.colors.bg = st.bg!;
  if (hexOk(st.text)) t.colors.text = st.text!;
  if (fontOk(st.fontHeading)) t.fontHeading = st.fontHeading;
  if (fontOk(st.fontBody)) t.fontBody = st.fontBody;
  if (st.radius) t.radius = st.radius;
  if (st.density) t.density = st.density;
  if (st.animation) t.animation = st.animation;
  if (st.headerStyle) t.headerStyle = st.headerStyle;
  if (st.headingScale) t.headingScale = st.headingScale;
  return t;
}

function img(ref: ImageRef | undefined, alt = ""): ImageRef | undefined {
  if (!ref || (!ref.assetId && !ref.art && !ref.stock)) return undefined;
  return { assetId: ref.assetId, art: ref.art, stock: ref.stock, alt: ref.alt || alt, caption: ref.caption || "" };
}

function parseVideo(v?: { provider?: string; url?: string }): { provider: "youtube" | "vimeo"; videoId: string } | null {
  const u = s(v?.url, 300);
  if (!u) return null;
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,15})/);
  if (yt) return { provider: "youtube", videoId: yt[1] };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d{5,12})/);
  if (vm) return { provider: "vimeo", videoId: vm[1] };
  return null;
}

function sec<K extends Section["kind"]>(kind: K, data: Extract<Section, { kind: K }>["data"], extra: Partial<Section> = {}): Section {
  return { id: sid(kind), kind, hidden: false, aiSuggested: false, variant: "", ...extra, data } as Section;
}

function contactBlock(a: CommonAnswers) {
  return {
    email: s(a.email, 200), phone: s(a.phone, 40), whatsapp: s(a.whatsapp, 40), whatsappFloat: a.whatsappFloat === true, address: s(a.address, 300),
    city: s(a.city, 80), country: s(a.country, 80), mapQuery: s(a.mapQuery, 300),
    socials: (a.socials ?? []).filter((x) => s(x?.url)).slice(0, 12).map((x) => ({ network: s(x.network, 30), url: s(x.url, 400) })),
  };
}

function commonTail(a: CommonAnswers, home: Section[]) {
  const t = (a.testimonials ?? []).filter((x) => s(x.quote) && s(x.name));
  if (t.length) home.push(sec("testimonials", { heading: "Kind words", items: t.map((x) => ({ quote: s(x.quote, 800), name: s(x.name, 80), role: s(x.role, 100) })) }));
}

function page(id: string, slug: string, title: string, sections: Section[], inNav = true): Page {
  return { id, slug, title, inNav, sections };
}

export function generateSiteDoc(type: SiteType, templateId: string | undefined, answers: AnyAnswers): SiteDoc {
  const tpl = getTemplate(templateId, type);
  let theme: Theme = { ...tpl.theme, colors: { ...tpl.theme.colors } };
  theme = applyStyle(theme, answers.inspiration?.tokens);
  theme = applyStyle(theme, answers.style);
  const a = answers;
  const pages: Page[] = [];
  let brandName = "";
  let tagline = "";
  let seoDesc = "";

  if (type === "personal") {
    brandName = s(a.name, 80) || "Your Name";
    tagline = s(a.tagline, 160) || s(a.title, 160);
    const home: Section[] = [];
    const cta = a.primaryCta ?? "contact";
    const primary =
      cta === "booking" && s(a.bookingUrl) ? { label: "Book a call", href: s(a.bookingUrl, 600) }
      : cta === "cv" && a.cvAssetId && a.cvAllowDownload !== false ? { label: "View my CV", href: "/experience" }
      : cta === "projects" && a.projects?.length ? { label: "See my work", href: "/#work" }
      : { label: "Get in touch", href: "/contact" };
    const secondary = cta !== "projects" && a.projects?.length ? { label: "See my work", href: "/#work" } : cta !== "contact" ? { label: "Contact me", href: "/contact" } : undefined;
    home.push(sec("hero", {
      eyebrow: [s(a.title, 60), s(a.location, 60)].filter(Boolean).join(" · "),
      heading: s(a.tagline, 160) ? s(a.tagline, 160) : brandName,
      subheading: s(a.tagline, 160) ? `${brandName}${s(a.title) ? `, ${s(a.title, 100)}` : ""}` : s(a.title, 300),
      primaryCta: primary, secondaryCta: secondary, image: img(a.headshot ?? a.heroImage, brandName),
    }));
    if (s(a.bio)) home.push(sec("about", { heading: "About me", body: s(a.bio, 4000), image: img(a.headshot, brandName), highlights: [] }));
    const projects = (a.projects ?? []).filter((p) => s(p.title));
    if (projects.length) {
      const ps = sec("projects", {
        heading: "Selected work", intro: "",
        items: projects.slice(0, 30).map((p) => ({
          title: s(p.title, 120), description: s(p.description, 1500), role: s(p.role, 100), period: s(p.period, 60),
          tags: csv(p.tags).slice(0, 12), link: s(p.link, 600) || undefined,
          images: (p.images ?? []).map((i) => img(i, s(p.title, 120))).filter(Boolean).slice(0, 12) as ImageRef[],
        })),
      });
      ps.id = "work";
      home.push(ps);
    }
    commonTail(a, home);
    home.push(sec("cta", { heading: "Let's work together", body: s(a.email) ? "I'd love to hear about your project." : "", cta: { label: "Get in touch", href: "/contact" } }));
    pages.push(page("home", "", "Home", home));

    const xp: Section[] = [];
    const exp = (a.experience ?? []).filter((x) => s(x.role));
    if (exp.length) xp.push(sec("experience", { heading: "Experience", items: exp.map((x) => ({ role: s(x.role, 100), org: s(x.org, 100), period: s(x.period, 60), location: s(x.location, 80), description: s(x.description, 1200) })) }));
    const edu = (a.education ?? []).filter((x) => s(x.title));
    if (edu.length) xp.push(sec("education", { heading: "Education & certifications", items: edu.map((x) => ({ title: s(x.title, 140), org: s(x.org, 120), period: s(x.period, 60), description: s(x.description, 600) })) }));
    const groups = (a.skillGroups ?? []).map((g) => ({ name: s(g.name, 60), items: csv(g.items).slice(0, 30) })).filter((g) => g.items.length);
    if (!groups.length && csv(a.skills).length) groups.push({ name: "", items: csv(a.skills).slice(0, 30) });
    if (groups.length) xp.push(sec("skills", { heading: "Skills", groups }));
    const ach = (a.achievements ?? []).filter((x) => s(x.title));
    if (ach.length) xp.push(sec("achievements", { heading: "Achievements & publications", items: ach.map((x) => ({ title: s(x.title, 160), detail: s(x.detail, 400), year: s(x.year, 20), link: s(x.link, 600) || undefined })) }));
    if (a.cvAssetId && a.cvAllowDownload !== false) xp.push(sec("resume", { heading: "Download my CV", body: "A full copy of my CV in one document.", assetId: a.cvAssetId, label: "Download CV" }));
    if (xp.length) pages.push(page("experience", "experience", "Experience", xp));

    const media: Section[] = [];
    const gal = (a.gallery ?? []).map((i) => img(i)).filter(Boolean) as ImageRef[];
    if (gal.length) media.push(sec("gallery", { heading: "Gallery", intro: "", images: gal.slice(0, 40) }));
    const vid = parseVideo(a.video);
    if (vid) media.push(sec("video", { heading: "Watch", ...vid, caption: "" }));
    if (media.length) pages.push(page("gallery", "gallery", "Gallery", media));

    pages.push(page("contact", "contact", "Contact", [sec("contact", { heading: "Get in touch", intro: s(a.location) ? `Based in ${s(a.location, 80)}.` : "", showForm: true, showMap: false })]));
    seoDesc = s(a.seoDescription, 170) || tagline || s(a.bio, 160);
  }

  if (type === "business") {
    brandName = s(a.businessName, 80) || "Your Business";
    tagline = s(a.tagline, 160);
    const services = (a.services ?? []).filter((x) => s(x.title));
    const goal = a.primaryGoal ?? "form";
    const wa = whatsappLink(a.whatsapp);
    const primary =
      goal === "call" && s(a.phone) ? { label: `Call ${s(a.phone, 40)}`, href: `tel:${s(a.phone).replace(/[^+0-9]/g, "")}` }
      : goal === "whatsapp" && wa ? { label: "Chat on WhatsApp", href: wa }
      : goal === "email" && s(a.email) ? { label: "Email us", href: `mailto:${s(a.email, 200)}` }
      : goal === "quote" ? { label: "Request a quote", href: "/services#quote" }
      : goal === "booking" && s(a.bookingUrl) ? { label: "Book now", href: s(a.bookingUrl, 600) }
      : goal === "visit" ? { label: "Find us", href: "/contact" }
      : { label: "Contact us", href: "/contact" };
    const home: Section[] = [];
    home.push(sec("hero", {
      eyebrow: [s(a.industry, 60), s(a.city, 60)].filter(Boolean).join(" · "),
      heading: tagline || brandName, subheading: s(a.description, 400),
      primaryCta: primary, secondaryCta: services.length ? { label: "Our services", href: "/services" } : undefined,
      image: img(a.heroImage, brandName),
    }));
    if (services.length) home.push(sec("services", { heading: "What we do", intro: s(a.targetCustomers) ? `For ${s(a.targetCustomers, 200)}` : "", items: services.slice(0, 6).map((x) => ({ title: s(x.title, 100), description: s(x.description, 600), price: s(x.price, 60), image: img(x.image, s(x.title)) })) }));
    const benefits = lines(a.benefits).slice(0, 8);
    if (s(a.about) || benefits.length) home.push(sec("about", { heading: `About ${brandName}`, body: s(a.about, 4000), image: img(a.gallery?.[0]), highlights: benefits }));
    commonTail(a, home);
    home.push(sec("cta", { heading: goal === "quote" ? "Tell us what you need" : "Ready when you are", body: s(a.serviceAreas) ? `Serving ${s(a.serviceAreas, 300)}.` : "", cta: primary }));
    pages.push(page("home", "", "Home", home));

    const about: Section[] = [];
    if (s(a.about)) about.push(sec("about", { heading: "Our story", body: s(a.about, 4000), image: img(a.gallery?.[1] ?? a.gallery?.[0]), highlights: benefits }, { variant: "split" }));
    const team = (a.team ?? []).filter((x) => s(x.name));
    if (team.length) about.push(sec("team", { heading: "Our team", members: team.map((m) => ({ name: s(m.name, 80), role: s(m.role, 80), bio: s(m.bio, 400), image: img(m.image, s(m.name)) })) }));
    const faqs = (a.faqs ?? []).filter((x) => s(x.q) && s(x.a));
    if (faqs.length) about.push(sec("faq", { heading: "Frequently asked questions", items: faqs.map((x) => ({ q: s(x.q, 200), a: s(x.a, 1200) })) }));
    if (about.length) pages.push(page("about", "about", "About", about));

    if (services.length || a.quoteForm) {
      const sv: Section[] = [];
      if (services.length) sv.push(sec("services", { heading: "Services", intro: "", items: services.map((x) => ({ title: s(x.title, 100), description: s(x.description, 600), price: s(x.price, 60), image: img(x.image, s(x.title)) })) }));
      if (a.quoteForm !== false) { const q = sec("quote", { heading: "Request a quote", intro: "Tell us about your needs and we'll get back to you.", services: services.map((x) => s(x.title, 80)) }); q.id = "quote"; sv.push(q); }
      pages.push(page("services", "services", "Services", sv));
    }
    const gal = (a.gallery ?? []).map((i) => img(i)).filter(Boolean) as ImageRef[];
    const vid = parseVideo(a.video);
    if (gal.length || vid) {
      const g: Section[] = [];
      if (gal.length) g.push(sec("gallery", { heading: "Gallery", intro: "", images: gal.slice(0, 40) }));
      if (vid) g.push(sec("video", { heading: "Watch", ...vid, caption: "" }));
      pages.push(page("gallery", "gallery", "Gallery", g));
    }
    const contact: Section[] = [sec("contact", { heading: "Contact us", intro: s(a.serviceAreas) ? `We serve ${s(a.serviceAreas, 300)}.` : "", showForm: true, showMap: !!(s(a.mapQuery) || s(a.address)) })];
    const hours = (a.hours ?? []).filter((h) => s(h.days) && s(h.hours));
    if (hours.length) contact.push(sec("hours", { heading: "Opening hours", rows: hours.map((h) => ({ days: s(h.days, 60), hours: s(h.hours, 60) })), note: s(a.hoursNote, 300) }));
    pages.push(page("contact", "contact", "Contact", contact));
    seoDesc = s(a.seoDescription, 170) || s(a.description, 160) || tagline;
  }

  if (type === "ecommerce") {
    brandName = s(a.storeName, 80) || "Your Store";
    tagline = s(a.tagline, 160);
    const home: Section[] = [];
    if (s(a.promoBanner)) home.push(sec("banner", { text: s(a.promoBanner, 200), link: { label: "Shop now", href: "/shop" } }));
    home.push(sec("hero", { eyebrow: s(a.industry, 60), heading: tagline || brandName, subheading: s(a.description, 400), primaryCta: { label: "Shop now", href: "/shop" }, secondaryCta: s(a.about) ? { label: "Our story", href: "/about" } : undefined, image: img(a.heroImage, brandName) }));
    home.push(sec("collections", { heading: "Shop by category", intro: "" }));
    home.push(sec("products", { heading: s(a.featuredHeading, 120) || "Featured products", intro: "", mode: "featured", collectionHandle: "", limit: 8 }));
    if (s(a.about)) home.push(sec("about", { heading: `About ${brandName}`, body: s(a.about, 4000), image: img(a.gallery?.[0]), highlights: [] }));
    commonTail(a, home);
    pages.push(page("home", "", "Home", home));
    pages.push(page("shop", "shop", "Shop", [sec("products", { heading: "", intro: "", mode: "all", collectionHandle: "", limit: 48 })]));
    const about: Section[] = [];
    if (s(a.about)) about.push(sec("about", { heading: "Our story", body: s(a.about, 4000), image: img(a.gallery?.[1] ?? a.gallery?.[0]), highlights: [] }));
    const faqs = (a.faqs ?? []).filter((x) => s(x.q) && s(x.a));
    if (faqs.length) about.push(sec("faq", { heading: "Frequently asked questions", items: faqs.map((x) => ({ q: s(x.q, 200), a: s(x.a, 1200) })) }));
    if (about.length) pages.push(page("about", "about", "About", about));
    const contact: Section[] = [sec("contact", { heading: "Contact us", intro: "Questions about an order or a product? Get in touch.", showForm: true, showMap: !!(s(a.mapQuery) || s(a.address)) })];
    const hours = (a.hours ?? []).filter((h) => s(h.days) && s(h.hours));
    if (hours.length) contact.push(sec("hours", { heading: "Opening hours", rows: hours.map((h) => ({ days: s(h.days, 60), hours: s(h.hours, 60) })), note: "" }));
    pages.push(page("contact", "contact", "Contact", contact));
    seoDesc = s(a.seoDescription, 170) || s(a.description, 160) || tagline;
  }

  const st = a.store ?? {};
  const store: StoreSettings | undefined = type === "ecommerce" ? {
    currency: /^[A-Z]{3}$/.test(s(a.currency)) ? s(a.currency) : "USD",
    paymentMethods: (st.paymentMethods ?? []).slice(0, 8),
    fulfillment: (st.fulfillment ?? []).slice(0, 10),
    requirePhone: st.requirePhone ?? true,
    requireEmail: st.requireEmail ?? false,
    lowStockThreshold: st.lowStockThreshold ?? 3,
    checkoutNote: s(st.checkoutNote, 600), taxNote: s(st.taxNote, 300),
    returnsPolicy: s(st.returnsPolicy, 4000), shippingPolicy: s(st.shippingPolicy, 4000), privacyNote: s(st.privacyNote, 4000),
    prohibitedAck: !!st.prohibitedAck, notifyEmail: s(st.notifyEmail, 200),
  } : undefined;

  const doc: SiteDoc = {
    schemaVersion: 1,
    type,
    templateId: tpl.id,
    brand: { name: brandName, tagline, logo: img(a.logo, brandName), ...(a.logoOnly && a.logo?.assetId ? { logoOnly: true } : {}) },
    seo: { title: s(a.seoTitle, 70) || (tagline ? `${brandName} — ${tagline}`.slice(0, 70) : brandName), description: seoDesc.slice(0, 170), lang: /^[a-z]{2}(-[A-Z]{2})?$/.test(s(a.lang)) ? s(a.lang) : "en" },
    theme,
    contact: contactBlock(a),
    pages,
    footer: { text: s(a.footerText, 300) },
    store,
    inspiration: a.inspiration?.sourceHost ? { sourceHost: s(a.inspiration.sourceHost, 200), notes: s(a.inspiration.notes, 600) } : undefined,
  };
  const parsed = parseSiteDoc(doc);
  if (!parsed.ok) throw new Error(`Generator produced an invalid document: ${parsed.error}`);
  return parsed.doc;
}

/** Switch template while keeping all content; theme resets to the new template's defaults + user style. */
export function switchTemplate(doc: SiteDoc, templateId: string, style?: StyleAnswers): SiteDoc {
  const tpl = getTemplate(templateId, doc.type);
  const pages = doc.pages.map((p) => ({ ...p, sections: p.sections.map((x) => ({ ...x, variant: "" })) }));
  return { ...doc, templateId: tpl.id, theme: applyStyle({ ...tpl.theme, colors: { ...tpl.theme.colors } }, style), pages };
}
