import type { AppEnv } from "../env";
import { aiAvailable } from "./ai";
import { dodoConfigured, paymentsMode } from "./dodo";
import { emailConfigured } from "./email";
import { storageBackend } from "./storage";
import { PLANS } from "../../shared/pricing";
import { PUBLIC_DEMOS } from "../../shared/demo";

// One source of truth for the commercial facts the platform states publicly. /api/config and the
// help assistant both read this, so the assistant can never quote different prices or terms.

const KEYS = ["hosting_fee_status", "hosting_fee_amount", "hosting_fee_amount_personal", "hosting_fee_amount_business", "hosting_fee_amount_ecommerce", "hosting_fee_currency", "hosting_fee_interval", "operator_display_name", "operator_status_note", "support_email", "ai_generations_per_project", "assistant_daily_token_budget"] as const;

export async function loadSettings(env: AppEnv): Promise<Partial<Record<(typeof KEYS)[number], string>>> {
  const rows = await env.DB.prepare(`SELECT key, value FROM system_settings WHERE key IN (${KEYS.map(() => "?").join(",")})`).bind(...KEYS).all<{ key: string; value: string }>();
  return Object.fromEntries(rows.results.map((r) => [r.key, r.value]));
}

export async function publicConfig(env: AppEnv) {
  const s = await loadSettings(env);
  return {
    appName: env.APP_NAME,
    prices: Object.values(PLANS).map((p) => ({ type: p.type, name: p.name, priceCents: p.priceCents, currency: p.currency, billing: p.billing })),
    payments: { provider: "dodo", configured: dodoConfigured(env), mode: paymentsMode(env) },
    ai: { available: aiAvailable(env), perProjectLimit: Number(s.ai_generations_per_project || 20) },
    google: { enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) },
    browserRun: { bound: !!env.BROWSER },
    email: { configured: emailConfigured(env) },
    storage: storageBackend(env),
    hosting: { status: s.hosting_fee_status || "not_set", amount: s.hosting_fee_amount || "", amounts: { personal: s.hosting_fee_amount_personal || "", business: s.hosting_fee_amount_business || "", ecommerce: s.hosting_fee_amount_ecommerce || "" }, currency: s.hosting_fee_currency || "", interval: s.hosting_fee_interval || "" },
    operator: { name: s.operator_display_name || "Motion Imprints Technologies", note: s.operator_status_note || "", supportEmail: s.support_email || "" },
    demos: PUBLIC_DEMOS.map((d) => ({ slug: d.slug, type: d.type, url: `/s/${d.slug}/` })),
  };
}

export type PublicConfig = Awaited<ReturnType<typeof publicConfig>>;
