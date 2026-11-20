# Deployment report

| Item | Value |
|---|---|
| Public URL | **https://imprintsites.omodingisaac123.workers.dev** |
| Worker name | `imprintsites` |
| Deployed | 2026-11-20 (UTC); latest version `712e0968-5fd8-4fb2-a3c0-63b8b61bd824` |
| Environment | `APP_ENV=production`, `PAYMENTS_MODE=test` |
| D1 database | `imprintsites-db` (`60f0763d-31e0-4c2c-871f-a24ac493af5d`, region WEUR); migration `0001_initial.sql` applied |
| Bindings | `DB` (D1), `AI` (Workers AI), `BROWSER` (Browser Run), `ASSETS` (static assets) |
| Secrets set | `SESSION_SECRET` (random, never displayed) |
| Cron | `17 3 * * *` (session, rate-limit and error-log cleanup) |
| R2 | **Not enabled** on the account (Cloudflare error 10042). Uploads currently use D1 storage |
| Plan | Workers Free at deploy time; the owner is upgrading to Workers Paid. The code is sized for Paid limits |

The account's existing D1 databases and Workers were not touched. A database briefly created during setup (`launchprint-db`) was confirmed empty and deleted after the product was renamed.

## Routes

- **Public SPA:** `/`, `/pricing`, `/templates`, `/examples`, `/how-it-works`, `/contact`, `/terms`, `/privacy`, `/refunds`, `/login`, `/signup`, `/forgot-password`, `/reset-password`
- **Authenticated SPA:** `/dashboard`, `/dashboard/new`, `/projects/:id/{setup,editor,publish,leads,store}`, `/account`, `/admin`
- **Worker:**
  - `/api/*`
  - `/s/:slug/*` (published sites)
  - `/preview/:projectId/*` (private, owner or signed link)
  - `/media/:assetId`
  - `/robots.txt`, `/sitemap.xml`, `/healthz`
- **Demo sites:**
  - `/s/demo-portfolio/` (Kernel template)
  - `/s/demo-business/` (Savanna)
  - `/s/demo-store/` (Maison)

## Production verification (run against the live URL)

`node scripts/smoke-prod.mjs https://imprintsites.omodingisaac123.workers.dev`: **36/36 passed**
- HTTPS homepage, JS bundle and all 12 SPA routes return 200. Prices are exactly 2000/3000/10000 USD cents.
- 18 templates (9 locked anonymously). All 3 demo sites return 200 with demo labels. Store search, robots, sitemap and health check pass.
- Signup (PBKDF2 100k) and project creation work.
- **Generation with real Workers AI copy polish:** `ai used=true`, 2.9 s.
- **Workers AI refine:** `engine=ai`, valid patch, 2.3 s.
- **Inspiration via Browser Run:** `method=browser`, 4.5 s. The SSRF metadata URL is blocked (400).
- Upload and serving media (D1 storage) work.
- Publishing without payment returns 402. Checkout honestly returns `503 payments_unavailable`. A missing CSRF header returns 403.
- A real demo-store checkout created an order, and its confirmation page rendered.
- The temporary project was deleted. The smoke account and its data were then removed from production D1.

Playwright against production (public tests only): **8/8 passed**, then **2/2** after the homepage redeploy. This covers:
- desktop and mobile homepage
- pricing, legal pages and the contact form
- the template gallery and examples
- all 3 demo sites on desktop and mobile, checked with axe (WCAG 2 A/AA, no serious or critical issues) and with no console errors
- a full store purchase: search → variant → cart → checkout → confirmation

Screenshots are in `tests/e2e/screenshots/prod/`. The test support ticket was deleted afterwards. Two demo-store test orders remain; they're labelled demo and change no stock.

## Not verified / blocked

| Item | Status |
|---|---|
| Dodo checkout + webhooks in production | ❌ No API key, webhook secret or product IDs. Signature verification and idempotency are tested locally with a test secret |
| Google sign-in | ❌ Needs an OAuth client ID and secret from the owner |
| R2 media | ❌ R2 not enabled on the account |
| Email notifications / password-reset emails | ❌ No email provider configured. The UI says so and offers the support form |
| Custom domains | ❌ Not implemented (Stage 2); UI shows the truthful status |
| Workers Paid limits | ⚠️ Running on Free until the owner upgrades. All smoke checks passed on Free |

## Rollback

`npx wrangler rollback` returns the Worker to the previous version. The D1 schema is additive (a single migration). Customer sites have their own version history and per-site rollback in the product.

## Update: landing-page redesign (version `7163161e`)
- **Hero:** six real CC0 photographs rotate as the background with a slow crossfade, matching the kinds of sites customers build (freelancers, cafés, boutiques, market sellers, photographers, bakeries). There are dot and pause controls (WCAG 2.2.2), the rotation is off under reduced motion, and images are lazily preloaded WebP at about 450 KB total. Credits are in `public/hero/CREDITS.txt`.
- **Layout:** a left-aligned headline, a prompt bar and a benefits row, with the $20 / $30 / $100 plan tiles overlapping the photo. The palette is neutral, with black and grey buttons. The blue gradients, glows and emoji are removed across the site and app.
- **Fix:** the contact form's anti-bot timing check compared the visitor's clock with the server's, so visitors with a skewed clock were wrongly rejected. It now uses elapsed time measured in the browser. A test was added.
- **Re-verified:** unit 57/57, integration 33/33, local Playwright 11/11, production smoke 36/36, production Playwright (public) 8/8.

## Update: landing page, demos, web addresses, $4 hosting (version `712e0968`)
- **Hero:** the tagline "Imagine it. Build it. Launch it." over six rotating CC0 photos, each showing a step of building a site: describing it, the designed site, every device, editing, customers browsing, packing orders.
- **"What you can build":** three cards. Each pairs a lifestyle photo with a floating browser window showing the real demo site and its address.
- **"Made with ImprintSites":** a dark bento wall of real screenshots of the demo sites.
- **Pricing table** near the bottom: build fee plus **$4 / month hosting & maintenance**. The generic features grid and the footer price line were removed.
- **Demo sites rebuilt with real photography** (33 CC0 photos in `public/stock/`, credits in `CREDITS.txt`):
  - portfolio: **Lens** (photographer)
  - business: **Savanna** (safari company)
  - store: **Maison** (fashion boutique, 8 photo products)
- **Web-address picker** on the new-site screen: live availability check, reserved names blocked, and an automatic free alternative (for example `name-2`) when a name is taken.
- **Fixes:** doubled page titles on sub-pages; the contact form's clock-skew bug; the slideshow showing a blank frame on manual jumps; the address picker blocking on a taken name.
- **Test passes:**
  - local, 4 rounds: unit 59/59, integration 36/36, Playwright 11/11
  - production: smoke 36/36, Playwright full suite (including the signed-in builder flows) 11/11
- Test data was removed from production afterwards. Production holds only the demo-content account and the 3 demo sites.
