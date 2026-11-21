import { z } from "zod";
import { SITE_TYPES } from "./pricing";

// ────────────────────────────────────────────────────────────────────────────
// SiteDoc: the single, strictly validated description of a customer website.
// AI output, the deterministic generator, the editor and the renderer all
// speak this format. The renderer turns it into accessible HTML/CSS; no
// executable code from users or models is ever embedded in a site.
// ────────────────────────────────────────────────────────────────────────────

const t = (max: number) => z.string().max(max).default("");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected #rrggbb colour");
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const optUrl = z.string().max(600).optional();

export const FONT_KEYS = [
  "inter", "manrope", "plus-jakarta", "outfit", "space-grotesk", "dm-sans", "work-sans", "poppins",
  "playfair", "fraunces", "cormorant", "dm-serif", "libre-baskerville", "lora",
  "jetbrains-mono", "space-mono", "syne", "archivo-black", "bricolage", "instrument-serif",
] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const ImageRef = z.object({
  assetId: id.optional(),       // uploaded/licensed asset served from /media/:id
  art: z.string().max(60).optional(), // seed for self-generated SVG artwork
  stock: z.string().regex(/^[a-z0-9-]{1,48}$/).optional(), // platform-hosted CC0 photo at /stock/<name>.webp (demos & previews)
  alt: t(300),
  caption: t(200),
});
export type ImageRef = z.infer<typeof ImageRef>;

export const Link = z.object({ label: t(60), href: t(600) });
export type Link = z.infer<typeof Link>;

export const Theme = z.object({
  mode: z.enum(["light", "dark"]).default("light"),
  colors: z.object({
    bg: hex, surface: hex, text: hex, muted: hex, primary: hex, accent: hex,
  }),
  fontHeading: z.enum(FONT_KEYS),
  fontBody: z.enum(FONT_KEYS),
  radius: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
  density: z.enum(["compact", "comfortable", "airy"]).default("comfortable"),
  headingScale: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  animation: z.enum(["none", "subtle", "lively"]).default("subtle"),
  headerStyle: z.enum(["bar", "centered", "split", "floating", "sidebar", "minimal"]).default("bar"),
  cardStyle: z.enum(["flat", "outline", "elevated", "glass"]).default("outline"),
  ornament: z.enum(["none", "grain", "grid", "blobs", "lines", "dots"]).default("none"),
});
export type Theme = z.infer<typeof Theme>;

const base = { id, hidden: z.boolean().default(false), aiSuggested: z.boolean().default(false), variant: z.string().max(30).default("") };

export const Section = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("hero"), data: z.object({
    eyebrow: t(80), heading: t(160), subheading: t(400),
    primaryCta: Link.optional(), secondaryCta: Link.optional(), image: ImageRef.optional(),
  }) }),
  z.object({ ...base, kind: z.literal("about"), data: z.object({
    heading: t(120), body: t(4000), image: ImageRef.optional(), highlights: z.array(t(120)).max(8).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("text"), data: z.object({ heading: t(120), body: t(6000) }) }),
  z.object({ ...base, kind: z.literal("services"), data: z.object({
    heading: t(120), intro: t(600),
    items: z.array(z.object({ title: t(100), description: t(600), price: t(60), image: ImageRef.optional() })).max(24).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("projects"), data: z.object({
    heading: t(120), intro: t(600),
    items: z.array(z.object({
      title: t(120), description: t(1500), role: t(100), period: t(60),
      tags: z.array(t(40)).max(12).default([]), link: optUrl, images: z.array(ImageRef).max(12).default([]),
    })).max(30).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("experience"), data: z.object({
    heading: t(120),
    items: z.array(z.object({ role: t(100), org: t(100), period: t(60), location: t(80), description: t(1200) })).max(30).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("education"), data: z.object({
    heading: t(120),
    items: z.array(z.object({ title: t(140), org: t(120), period: t(60), description: t(600) })).max(30).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("achievements"), data: z.object({
    heading: t(120),
    items: z.array(z.object({ title: t(160), detail: t(400), year: t(20), link: optUrl })).max(30).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("skills"), data: z.object({
    heading: t(120), groups: z.array(z.object({ name: t(60), items: z.array(t(40)).max(30).default([]) })).max(10).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("gallery"), data: z.object({
    heading: t(120), intro: t(400), images: z.array(ImageRef).max(40).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("testimonials"), data: z.object({
    heading: t(120), items: z.array(z.object({ quote: t(800), name: t(80), role: t(100) })).max(12).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("team"), data: z.object({
    heading: t(120), members: z.array(z.object({ name: t(80), role: t(80), bio: t(400), image: ImageRef.optional() })).max(24).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("faq"), data: z.object({
    heading: t(120), items: z.array(z.object({ q: t(200), a: t(1200) })).max(30).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("hours"), data: z.object({
    heading: t(120), rows: z.array(z.object({ days: t(60), hours: t(60) })).max(10).default([]), note: t(300),
  }) }),
  z.object({ ...base, kind: z.literal("contact"), data: z.object({
    heading: t(120), intro: t(500), showForm: z.boolean().default(true), showMap: z.boolean().default(false),
  }) }),
  z.object({ ...base, kind: z.literal("quote"), data: z.object({
    heading: t(120), intro: t(500), services: z.array(t(80)).max(20).default([]),
  }) }),
  z.object({ ...base, kind: z.literal("cta"), data: z.object({ heading: t(160), body: t(500), cta: Link.optional() }) }),
  z.object({ ...base, kind: z.literal("resume"), data: z.object({
    heading: t(120), body: t(600), assetId: id.optional(), label: t(60),
  }) }),
  z.object({ ...base, kind: z.literal("video"), data: z.object({
    heading: t(120), provider: z.enum(["youtube", "vimeo"]).default("youtube"),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{0,20}$/).default(""), caption: t(300),
  }) }),
  z.object({ ...base, kind: z.literal("products"), data: z.object({
    heading: t(120), intro: t(400), mode: z.enum(["featured", "all", "collection"]).default("featured"),
    collectionHandle: t(60), limit: z.number().int().min(1).max(48).default(8),
  }) }),
  z.object({ ...base, kind: z.literal("collections"), data: z.object({ heading: t(120), intro: t(400) }) }),
  z.object({ ...base, kind: z.literal("banner"), data: z.object({ text: t(200), link: Link.optional() }) }),
]);
export type Section = z.infer<typeof Section>;
export type SectionKind = Section["kind"];
export const SECTION_KINDS = Section.options.map((o) => o.shape.kind.value) as SectionKind[];

export const Page = z.object({
  id,
  slug: z.string().regex(/^[a-z0-9-]{0,40}$/), // "" = home
  title: t(80),
  inNav: z.boolean().default(true),
  sections: z.array(Section).max(30),
});
export type Page = z.infer<typeof Page>;

export const PaymentMethod = z.object({
  id,
  kind: z.enum(["cod", "pay_on_pickup", "bank_transfer", "mobile_money", "whatsapp"]),
  label: t(60),
  instructions: t(800),
});
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const FulfillmentOption = z.object({
  id,
  kind: z.enum(["delivery", "pickup", "digital"]),
  label: t(80),
  priceMinor: z.number().int().min(0).max(1e9).default(0),
  details: t(400),
});
export type FulfillmentOption = z.infer<typeof FulfillmentOption>;

export const StoreSettings = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  paymentMethods: z.array(PaymentMethod).max(8).default([]),
  fulfillment: z.array(FulfillmentOption).max(10).default([]),
  requirePhone: z.boolean().default(true),
  requireEmail: z.boolean().default(false),
  lowStockThreshold: z.number().int().min(0).max(1000).default(3),
  checkoutNote: t(600),
  taxNote: t(300),
  returnsPolicy: t(4000),
  shippingPolicy: t(4000),
  privacyNote: t(4000),
  prohibitedAck: z.boolean().default(false),
  notifyEmail: t(200),
});
export type StoreSettings = z.infer<typeof StoreSettings>;

export const SiteDoc = z.object({
  schemaVersion: z.literal(1).default(1),
  type: z.enum(SITE_TYPES),
  templateId: z.string().max(40),
  brand: z.object({ name: t(80), tagline: t(160), logo: ImageRef.optional(), /** Header shows the logo alone (it already contains the name). */ logoOnly: z.boolean().optional() }),
  seo: z.object({ title: t(70), description: t(170), lang: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("en") }),
  theme: Theme,
  contact: z.object({
    email: t(200), phone: t(40), whatsapp: t(40), address: t(300), city: t(80), country: t(80),
    mapQuery: t(300),
    /** Floating "WhatsApp" chat button on every page. Absent on sites made before the option existed (see whatsappFloatOn). */
    whatsappFloat: z.boolean().optional(),
    socials: z.array(z.object({ network: t(30), url: t(400) })).max(12).default([]),
  }),
  pages: z.array(Page).min(1).max(12),
  footer: z.object({ text: t(300) }),
  store: StoreSettings.optional(),
  inspiration: z.object({ sourceHost: t(200), notes: t(600) }).optional(),
});
export type SiteDoc = z.infer<typeof SiteDoc>;

export function parseSiteDoc(input: unknown): { ok: true; doc: SiteDoc } | { ok: false; error: string } {
  const r = SiteDoc.safeParse(input);
  if (r.success) {
    const ids = new Set<string>();
    for (const p of r.data.pages) {
      if (ids.has("page:" + p.id)) return { ok: false, error: `Duplicate page id ${p.id}` };
      ids.add("page:" + p.id);
    }
    const slugs = r.data.pages.map((p) => p.slug);
    if (new Set(slugs).size !== slugs.length) return { ok: false, error: "Two pages share the same URL slug" };
    if (!slugs.includes("")) return { ok: false, error: "The site needs a home page" };
    return { ok: true, doc: r.data };
  }
  const issue = r.error.issues[0];
  return { ok: false, error: `${issue.path.join(".") || "document"}: ${issue.message}` };
}

// ── Intake (wizard answers). Loosely typed per site type, validated at generation time. ──
export const IntakeItem = z.record(z.string(), z.unknown());
export const Intake = z.object({
  type: z.enum(SITE_TYPES),
  templateId: z.string().max(40).optional(),
  answers: z.record(z.string(), z.unknown()).default({}),
});
export type Intake = z.infer<typeof Intake>;
