import type { AppEnv } from "../env";
import type { SiteType } from "../../shared/pricing";
import { fromB64, hmac, b64, timingSafeEqual } from "./crypto";

// Dodo Payments adapter for the platform's OWN service (website creation fees).
// Customer storefront revenue never flows through this account.
// Docs: POST {base}/checkouts, GET {base}/payments/{id}, Standard Webhooks signatures.

export function paymentsMode(env: AppEnv): "test" | "live" {
  return String(env.PAYMENTS_MODE) === "live" ? "live" : "test";
}

export function dodoBase(env: AppEnv): string {
  return paymentsMode(env) === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

export function productIdFor(env: AppEnv, type: SiteType): string | undefined {
  return { personal: env.DODO_PRODUCT_PERSONAL, business: env.DODO_PRODUCT_BUSINESS, ecommerce: env.DODO_PRODUCT_ECOMMERCE }[type];
}

export function dodoConfigured(env: AppEnv): boolean {
  return !!(env.DODO_API_KEY && env.DODO_WEBHOOK_SECRET && env.DODO_PRODUCT_PERSONAL && env.DODO_PRODUCT_BUSINESS && env.DODO_PRODUCT_ECOMMERCE);
}

export async function createCheckout(env: AppEnv, input: { productId: string; email: string; name: string; returnUrl: string; metadata: Record<string, string> }): Promise<{ sessionId: string; checkoutUrl: string }> {
  const r = await fetch(`${dodoBase(env)}/checkouts`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.DODO_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      product_cart: [{ product_id: input.productId, quantity: 1 }],
      customer: { email: input.email, name: input.name || input.email },
      return_url: input.returnUrl,
      metadata: input.metadata,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Dodo checkout failed with HTTP ${r.status}`);
  const j = (await r.json()) as { session_id?: string; checkout_url?: string | null };
  if (!j.session_id || !j.checkout_url) throw new Error("Dodo checkout response missing session_id/checkout_url");
  return { sessionId: j.session_id, checkoutUrl: j.checkout_url };
}

export interface DodoPayment {
  payment_id: string; status: string; total_amount: number; currency: string;
  metadata?: Record<string, unknown>; checkout_session_id?: string | null;
  refunds?: unknown[];
}

export async function getPayment(env: AppEnv, paymentId: string): Promise<DodoPayment> {
  const r = await fetch(`${dodoBase(env)}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: `Bearer ${env.DODO_API_KEY}` }, signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Dodo get payment failed with HTTP ${r.status}`);
  return (await r.json()) as DodoPayment;
}

/**
 * Standard Webhooks verification: HMAC-SHA256 over "{id}.{timestamp}.{body}",
 * key = base64-decoded secret (after stripping "whsec_"); header may carry several "v1,<sig>" entries.
 */
export async function verifyWebhook(secret: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, rawBody: string, nowSec = Math.floor(Date.now() / 1000), toleranceSec = 300): Promise<boolean> {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > toleranceSec) return false;
  const key = fromB64(secret.startsWith("whsec_") ? secret.slice(6) : secret);
  const expected = b64(await hmac(key, `${id}.${timestamp}.${rawBody}`));
  return signature.split(" ").some((part) => {
    const [ver, sig] = part.split(",");
    return ver === "v1" && !!sig && timingSafeEqual(sig, expected);
  });
}
