import type { Context } from "hono";

// Secrets are optional at runtime. `wrangler types` marks any secret found in a local .dev.vars as required,
// so they are omitted from the generated Env and redeclared here; the type is the same with or without .dev.vars.
type SecretKeys = "SESSION_SECRET" | "PUBLIC_BASE_URL" | "ADMIN_EMAILS" | "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "DODO_API_KEY" | "DODO_WEBHOOK_SECRET"
  | "DODO_PRODUCT_PERSONAL" | "DODO_PRODUCT_BUSINESS" | "DODO_PRODUCT_ECOMMERCE" | "RESEND_API_KEY" | "EMAIL_FROM" | "TURNSTILE_SECRET" | "DEEPSEEK_API_KEY" | "DEEPSEEK_MODEL";

export interface AppEnv extends Omit<Env, SecretKeys> {
  MEDIA?: R2Bucket;
  SESSION_SECRET?: string;
  PUBLIC_BASE_URL?: string;
  ADMIN_EMAILS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DODO_API_KEY?: string;
  DODO_WEBHOOK_SECRET?: string;
  DODO_PRODUCT_PERSONAL?: string;
  DODO_PRODUCT_BUSINESS?: string;
  DODO_PRODUCT_ECOMMERCE?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  TURNSTILE_SECRET?: string;
  DEEPSEEK_API_KEY?: string; // "Ask ImprintSites AI" help assistant; unset = assistant says it is not switched on
  DEEPSEEK_MODEL?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  email_verified: number;
  status: string;
  google_sub: string | null;
  has_password: number;
  isAdmin: boolean;
}

export type HonoEnv = { Bindings: AppEnv; Variables: { user: SessionUser | null; requestId: string } };
export type Ctx = Context<HonoEnv>;

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string, public extra?: Record<string, unknown>) {
    super(message);
  }
}

export const now = () => Date.now();

export function baseUrl(c: Ctx): string {
  const fromEnv = c.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const u = new URL(c.req.url);
  return `${u.protocol}//${u.host}`;
}
