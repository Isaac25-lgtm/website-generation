// LOCKED creation prices. One-time fees in USD minor units (cents).
// Changing these requires explicit owner approval (see PRICING_AND_BILLING.md).
// The server never accepts an amount from the client; it always reads from here.

export const HOSTING_DEFAULTS = { personal: "3", business: "4", ecommerce: "5" } as const;

export function hostingNotice(status = "not_set"): string {
  return ({
    active: "The hosting fee is marked active. Automatic recurring collection is unavailable.",
    announced: "Hosting has been announced but is not being charged automatically.",
    not_set: "The hosting fee has not been announced. Automatic recurring collection is unavailable.",
  } as Record<string, string>)[status] ?? "Contact support to confirm the hosting status.";
}

export const SITE_TYPES = ["personal", "business", "ecommerce"] as const;
export type SiteType = (typeof SITE_TYPES)[number];

export interface Plan {
  type: SiteType;
  name: string;
  shortName: string;
  priceCents: number;
  currency: "USD";
  billing: "one_time";
  summary: string;
  includes: string[];
}

export const PLANS: Record<SiteType, Plan> = Object.freeze({
  personal: {
    type: "personal",
    name: "Personal / Portfolio",
    shortName: "Personal",
    priceCents: 2000,
    currency: "USD",
    billing: "one_time",
    summary: "A polished personal site for your work, CV and projects.",
    includes: [
      "About, experience, skills and education sections",
      "Portfolio projects with photo galleries and links",
      "Downloadable CV / résumé",
      "Working contact form delivered to your dashboard",
      "90+ complete personal templates",
      "Unlimited manual edits and republishing",
    ],
  },
  business: {
    type: "business",
    name: "Business",
    shortName: "Business",
    priceCents: 2500, // owner, 25 Nov 2026 (was $30)
    currency: "USD",
    billing: "one_time",
    summary: "A professional multi-page presence that brings in enquiries.",
    includes: [
      "Home, About, Services, Gallery and Contact pages",
      "Services with images and optional price ranges",
      "Contact and quote-request forms with a leads inbox",
      "Map, opening hours, WhatsApp and call buttons",
      "60+ complete business templates",
      "Unlimited manual edits and republishing",
    ],
  },
  ecommerce: {
    type: "ecommerce",
    name: "E-commerce",
    shortName: "E-commerce",
    priceCents: 10000,
    currency: "USD",
    billing: "one_time",
    summary: "A real online store with catalogue, cart, checkout and order management.",
    includes: [
      "Product catalogue with variants, inventory and CSV import",
      "Search, category filters, cart and checkout",
      "Orders dashboard with status tracking and stock control",
      "Pay on delivery, pickup, bank transfer or WhatsApp ordering",
      "140+ complete store templates",
      "Card payments inside your store: coming soon",
    ],
  },
} as const);

export function priceFor(type: SiteType): number {
  const plan = PLANS[type];
  if (!plan) throw new Error(`Unknown site type: ${type}`);
  return plan.priceCents;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function isSiteType(v: unknown): v is SiteType {
  return typeof v === "string" && (SITE_TYPES as readonly string[]).includes(v);
}
