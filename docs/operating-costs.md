# Operating costs & unit economics

**Verified prices** (Cloudflare docs, read 2026-11-20) are kept separate from **assumptions**; usage assumptions are marked *(A)*. Re-check the prices before budgeting.

## Verified Cloudflare prices (Paid plan unless noted)

| Service | Included | Overage |
|---|---|---|
| Workers Paid | $5/month base; 10M requests and 30M CPU-ms included *(standard Workers Paid terms; confirm on the Workers pricing page)* | ~$0.30/M requests, ~$0.02/M CPU-ms |
| D1 | 25B rows read, 50M rows written, 5 GB storage per month | $0.001/M reads, $1.00/M writes, $0.75/GB-month. Max 10 GB per database |
| R2 (Standard) | 10 GB-month, 1M Class A ops, 10M Class B ops; **egress free** | $0.015/GB-month, $4.50/M Class A, $0.36/M Class B |
| Workers AI | 10,000 neurons/day free | $0.011 per 1,000 neurons. `llama-3.3-70b-instruct-fp8-fast`: 26,668 neurons/M input tokens, 204,805/M output tokens |
| Browser Run | Free plan: 10 min/day. Paid: 10 hours/month included | $0.09/browser-hour; $2/extra concurrent browser |
| Cloudflare for SaaS (Stage 2) | 100 custom hostnames | $0.10/hostname/month |

## Per-action estimates *(A)*

| Action | Assumption | Approx. cost |
|---|---|---|
| AI copy polish | ~700 input + ~500 output tokens → ~121 neurons | **≈ $0.0013** |
| AI refine | ~450 input + ~150 output tokens → ~43 neurons | **≈ $0.0005** |
| AI worst case per site | 20 calls (admin cap) | ≤ $0.03 |
| Inspiration capture | ~6 browser-seconds | ≈ $0.00015 beyond the included hours |
| Published page view | 1 Worker request + ~3 media requests, ~4 ms CPU, ~20–60 D1 rows read | ≈ $0.0000012 |
| Order placed | ~15 D1 writes | ≈ $0.000015 |

## Monthly totals *(A)*

Assumes 60% of customers are business, 25% personal and 15% e-commerce. Each site gets 400 page views/month. Average media is 15 MB per site, or 40 MB per store. Each customer averages 3 AI calls on creation.

| Customers (live sites) | Workers | D1 | R2 | AI (new sites/month ≈ 10%) | Browser Run | **Total / month** |
|---|---|---|---|---|---|---|
| 100 | $5 (within included) | $0 | $0 (≈1.9 GB, within free) | ~$0 (within the daily free tier) | $0 | **≈ $5** |
| 1,000 | $5 + ~$0 (≈1.6M req) | $0 | ≈ $0.15 (≈19 GB) | ~$0.40 | $0 | **≈ $6** |
| 10,000 | $5 + ≈ $3 requests + ≈ $1 CPU (≈16M req) | ≈ $0–1 (storage ≈ 3–5 GB) | ≈ $2.80 (≈190 GB + ops) | ~$4 | ≈ $0–1 | **≈ $15–20** |

Add **$1–2/month** for Stage 2 custom hostnames, or $0.10/hostname beyond 100. If 20% of 10,000 sites use one, that's about $190/month. Most customers will likely stay on free platform URLs.

## Revenue side
- Creation revenue is one-time: about $20–100 per site, or roughly $32 weighted average under the mix above.
- **Dodo Payments fees are not verified here.** Check the current fee schedule on the Dodo pricing page before modelling margins; merchant-of-record fees are typically a percentage plus a fixed amount per transaction.
- Cloudflare costs are far below 1% of creation revenue at every scale above. The real margin risks are payment fees, refunds and chargebacks, support time, and **ongoing hosting with no recurring revenue**. A site keeps costing a small amount every month after its one-time payment. At 10,000 sites that's about $20/month in total, which is still very low, but it should inform the future hosting-fee decision.

## Unknowns
- Actual traffic per customer site, and image sizes
- Dodo fee rates and FX spreads
- Email provider costs (Resend's free tier is likely enough early on)
- Whether the R2 subscription requires a payment method; that's set in the owner's dashboard
