import type { ImageRef, SiteDoc } from "../schema";
import type { TemplateDef } from "../templates";

export type RenderMode = "published" | "preview" | "template" | "export";

export interface VariantView {
  id: string;
  title: string;
  option1: string | null;
  option2: string | null;
  priceMinor: number;
  available: boolean;
  /** null when inventory is not tracked */
  stock: number | null;
  backorder: boolean;
}

export interface ProductView {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceMinor: number;
  compareAtMinor: number | null;
  currency: string;
  images: ImageRef[];
  tags: string[];
  collections: string[];
  featured: boolean;
  productType: "physical" | "digital";
  option1Name: string | null;
  option2Name: string | null;
  maxPerOrder: number;
  variants: VariantView[];
  createdAt: number;
}

export interface CollectionView {
  id: string;
  name: string;
  handle: string;
  description: string;
}

export interface OrderView {
  id: string;
  number: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentMethod: string;
  fulfillmentLabel: string;
  customerName: string;
  currency: string;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  createdAt: number;
  items: { title: string; variantTitle: string | null; quantity: number; unitMinor: number; lineMinor: number }[];
  isDemo: boolean;
}

export interface AssetMeta {
  alt?: string;
  attribution?: string | null;
  license?: string | null;
  mime?: string;
}

export interface RenderCtx {
  mode: RenderMode;
  /** URL prefix of the site, e.g. "/s/my-shop". "" when exported to a domain root. */
  basePath: string;
  projectId: string;
  /** Origin for API calls from the rendered site. "" = same origin. */
  apiBase: string;
  assetUrl: (assetId: string) => string;
  assets?: Record<string, AssetMeta>;
  store?: { products: ProductView[]; collections: CollectionView[] };
  order?: OrderView | null;
  query?: URLSearchParams;
  nonce?: string;
  isDemo?: boolean;
  platformName: string;
  platformUrl: string;
  /** Render without any scripts (used for decorative thumbnails). */
  staticMode?: boolean;
  /** cache-busting stamp for the HTML (form anti-bot timing) */
  renderedAt?: number;
}

export interface RenderInput {
  doc: SiteDoc;
  template: TemplateDef;
  ctx: RenderCtx;
}

export interface RenderResult {
  status: number;
  html: string;
}
