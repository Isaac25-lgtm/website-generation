# Dodo Payments integration

**Status:** built and tested with a local test secret. **Not yet connected** to a Dodo account; no keys or products exist. No approval from Dodo is claimed.

## What's implemented
- `src/worker/lib/dodo.ts`:
  - `createCheckout()`: `POST {base}/checkouts` with `product_cart`, `customer`, `return_url` and `metadata`
  - `getPayment()`: `GET {base}/payments/{id}`
  - `verifyWebhook()`: Standard Webhooks: HMAC-SHA256 over `id.timestamp.body`, `whsec_` base64 key, multiple `v1,` signatures, 5-minute tolerance
- `src/worker/routes/billing.ts`:
  - checkout endpoint
  - webhook endpoint `POST /api/webhooks/dodo`, idempotent by `webhook-id`
  - `payment.succeeded` → re-fetch the payment → check status, USD and amount ≥ the locked price, and that the metadata matches our checkout session and mode → grant the entitlement
  - `refund.succeeded` → revoke the entitlement and unpublish
- Base URLs: `PAYMENTS_MODE=test` → `https://test.dodopayments.com`; `live` → `https://live.dodopayments.com`. Test-mode entitlements don't count in live mode.

## Owner setup (test mode first)
1. In Dodo **test mode**, create three **one-time** products: *ImprintSites Personal website* ($20), *Business website* ($25) and *E-commerce website* ($100). Note their product IDs.
2. Under Developer → Webhooks, add the endpoint `https://imprintsites.omodingisaac123.workers.dev/api/webhooks/dodo` with the events `payment.succeeded`, `payment.failed`, `payment.cancelled` and `refund.succeeded`. Copy the signing secret.
3. Set the secrets. Paste each value only at the Wrangler prompt, never in chat:
   ```bash
   npx wrangler secret put DODO_API_KEY            # dodo_test_...
   npx wrangler secret put DODO_WEBHOOK_SECRET     # whsec_...
   npx wrangler secret put DODO_PRODUCT_PERSONAL
   npx wrangler secret put DODO_PRODUCT_BUSINESS
   npx wrangler secret put DODO_PRODUCT_ECOMMERCE
   ```
4. Make a test purchase with Dodo's test card from a project's Publish page. Confirm in Admin → Payments that the webhook shows `processed`, the payment `succeeded`, and that the Publish button unlocks. Then test a refund.
5. Only after Dodo approves the account, and after the operator details and legal pages have been reviewed, change `PAYMENTS_MODE` to `live` in `wrangler.jsonc`, switch to the live key and products, and redeploy.

## How the public site meets Dodo's live-website checklist
Visitors without an account can find each of these on the live URL:

| Requirement | Where |
|---|---|
| Pricing | `/pricing` (one-time USD prices, also on the home page) |
| Terms of Service | `/terms` |
| Privacy Policy | `/privacy` |
| Refund & Cancellation Policy | `/refunds` |
| Contact route | `/contact`, a working form whose tickets are stored and visible in Admin; a support email can be added in admin settings |

The footer links to all of them on every page. The product description, prices and delivery method (instant digital delivery: the site is published on payment) are consistent across all pages.

## Truthful answers for the Product Information form
- **Product:** a self-serve SaaS website builder. Customers create personal, business or e-commerce websites from guided forms and templates, then publish them on our platform.
- **Delivery:** instant and digital. Publishing unlocks automatically on a confirmed payment.
- **Automation level:** fully software-driven. Generation is template- and rules-based, with optional AI text suggestions on Cloudflare Workers AI that the customer reviews. There's **no manual design labour** in the product.
- **AI content:** limited to optional wording suggestions and design-token refinements. No image, voice or video generation, no impersonation, and no scraping or copying of other sites: inspiration analysis reads only high-level style and respects robots.txt.
- **Compliance-sensitive areas:** user-generated sites. Content rules are in the Terms, there's a takedown and report route, and admins can suspend sites.
- **Pricing:** one-time $20, $25 or $100. No subscription.
- **Stage:** live builder with path-based publishing. Card checkout pending your approval. Customer-store card payments and custom domains are not yet available and are labelled as such on the site.

## Merchant-acceptance notes
Dodo lists "AI Content Generation tools" as *needs review*, and prohibits "manual digital services" and "unfinished websites sold at premium prices". The product is built to sit clearly on the acceptable side of these:
- It's automated software, not manual labour.
- Publishing is functional and demoable.
- Unavailable features are labelled honestly.

Be precise about this in the application.

## Moving from individual to registered company
Keep the account in the individual's name until registration completes. Then follow Dodo's authorised entity-change or KYB process. Update `operator_display_name` and `operator_status_note` in Admin → Settings and the legal pages. Every settings change is recorded in the audit log.
