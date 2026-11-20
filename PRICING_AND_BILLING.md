# Pricing & billing

## Locked creation prices (one-time, USD)

| Product | Price | Source of truth |
|---|---:|---|
| Personal / Portfolio | **$20.00** (2000 cents) | `src/shared/pricing.ts` → `PLANS.personal.priceCents` |
| Business | **$30.00** (3000 cents) | `PLANS.business.priceCents` |
| E-commerce | **$100.00** (10000 cents) | `PLANS.ecommerce.priceCents` |

- `PLANS` is frozen. The server never accepts an amount from the client: checkout looks up the price by the project's site type, and unit and integration tests assert these values.
- These fees are **not subscriptions**. Changing them requires the owner's explicit approval and a code change to `pricing.ts`, the `site_types` seed and the Dodo products.

## What the fee buys

Publishing for that website at `/s/<slug>/` on the platform, unlimited manual editing and republishing, version rollback, and export. AI suggestions are capped per site; the default is 20 and it's set in admin under `ai_generations_per_project`.

## Hosting & maintenance: USD 4 per published site per month (owner-approved 2026-11-20)

- This covers hosting at the site's web address over https, backups, security and platform updates, and support. It's stated explicitly as **$4 per site per month** on the home page, pricing, how-it-works, the new-site screen, the publish page, the FAQ, the Terms and the Refund policy.
- It's stored in `system_settings`: `hosting_fee_amount=4`, `hosting_fee_currency=USD`, `hosting_fee_interval=month`, `hosting_fee_status=announced` (migrations `0002`, `0003`). Admins can change these under Admin → Settings, and every page reads them.
- **Billing status:** `announced`. Monthly collection is **not built yet**; it needs a Dodo subscription product plus an opt-in flow. Until then, the site tells customers they'll agree to the monthly plan before any monthly charge. Switch the status to `active` only once that flow is live and tested.
- Customers can cancel any time. The site goes offline at the end of the paid month, and export is always available.

## Domains

Each site gets a web address it chooses (`/s/<name>`), checked for availability and set up automatically with https at publish. Custom domains are not included and not yet supported. Registration and renewal are paid by the customer to their registrar. See `docs/domain-publishing.md`.

## Payment provider (builder's own service only)

- **Provider:** Dodo Payments, through a provider abstraction in `src/worker/lib/dodo.ts`.
- **Mode:** `PAYMENTS_MODE=test` (`test.dodopayments.com`). Test entitlements (`payment_test`) unlock publishing only while in test mode. In `live` mode only `payment_live` and `admin_demo` count.
- **Flow:**
  1. `POST /api/billing/projects/:id/checkout` creates a `builder_checkout_sessions` row and calls `POST /checkouts` with the product ID and metadata `{checkout_id, project_id, user_id}`.
  2. The customer is redirected to Dodo's checkout.
  3. `POST /api/webhooks/dodo` verifies the Standard Webhooks signature (5-minute tolerance) and stores `webhook-id` for idempotency.
  4. It then **re-fetches the payment** via `GET /payments/{id}` and checks its status, USD currency, an amount at or above the locked price, and that the metadata matches our session and mode.
  5. Only then does it grant an entitlement.
- **Refunds:** `refund.succeeded` revokes the entitlement and unpublishes the site when no other entitlement exists.
- A redirect back to `/projects/:id/publish?checkout=…` **never** unlocks anything by itself; the page only polls status.

## Marketplace segregation

Customer storefront revenue **never** flows through the platform's Dodo account:
- Stores use the seller's own offline methods (COD, pickup, transfer, WhatsApp).
- Future card payments must use each seller's own verified gateway account, recorded in `merchant_payment_connections`, with secrets per seller. Dodo is not used for split payments or marketplace payouts.
