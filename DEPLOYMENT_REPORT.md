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

## 24 November 2026: Signature templates (version 80b0606a)

- **41 new Signature templates** (59 in total):
  - 25 shop templates on 4 layouts: Editorial, Quiet, Fine Jewellery, Interiors.
  - 8 personal templates: Statement, Prose, Marquee, Spotlight, Dossier, Ledger, Executive, Laureate.
  - 8 business templates: Chambers, Capital, Counsel, Quorum, Workshop, Bench, Retreat, Coast.
- **Template gallery:** shop category tabs, Signature templates first, six shown at a time with "See more". Member templates now show static previews.
- **No-AI-slop rule enforced** (`src/shared/quality.ts`):
  - tests fail on slop in any template or demo copy;
  - AI copy polish discards suggestions that contain slop.
- **Photos:** 87 new CC0 StockSnap photos, credited in `public/stock/CREDITS.txt`.
- **Verification:**
  - unit 408/408;
  - integration 61/61 (local);
  - Playwright 12/12 (local and production);
  - production smoke test 39/39;
  - test data removed with `scripts/cleanup-test-data.sql`.

## 25 November 2026: personal Signature templates (version 6afdefaa)

- **30 new personal templates**, one for each five-star reference site, each with its own hero design: Founder, Essay, Chapters, Tiles, Warm Bento, Growth, Hello, Contour, Keynote, Creator, Shapes, Iconline, Author, Split Name, Prologue, Library Card, Poem, Cinema, Gazette, Boarding Pass, Badge, Deco, Slides, Roles, Oh Hi, Studio, Landscape, Bento, Champion and Book Cover. That brings the total to 89 templates, 44 of them personal.
- **Gallery:** shows 12 at a time with "Showing X of Y" and "See more".
- **Photos:** 25 new CC0 photos.
- **Verification:**
  - unit 588/588;
  - integration 61/61 (local);
  - Playwright 12/12 (local and production);
  - production smoke test 39/39;
  - test data removed with `scripts/cleanup-test-data.sql`.

## 25 November 2026: business Signature templates (version ba246f55)

- **10 new business templates**, one per five-star business reference: Skyline, Expedition, Atlas, Agency, Lettering, Catalogue, Monolith, Canal, Real Work and Contractor. That brings the total to 99 templates, 24 of them business.
- **Owner-supplied photos** from the owner's ATS and Motion Imprints sites appear only in template previews. `saveDraft` strips them from every customer draft, and a unit test checks this.
- **Verification:**
  - unit 650/650;
  - integration 61/61 (local);
  - Playwright 12/12 (local and production);
  - production smoke test 39/39;
  - test data removed.

## 25 November 2026: premium personal templates (version b882096c)

- **49 premium personal templates**, one per four-star reference site, each with its own hero design. That brings the total to 148 templates, 93 of them personal.
- **Privacy fix:** sample names and taglines that echoed the source sites' owners or wording were replaced across the earlier batches too. A new unit test blocks any word taken from a source domain or owner name.
- **Verification:**
  - unit 896/896;
  - integration 61/61 (local);
  - Playwright 12/12 (local) and 11/12 on production. The production run hit the signup rate limit, so all 148 live previews were checked directly instead: every one loads with its content;
  - production smoke test 39/39;
  - test data removed.

## 25 November 2026: premium business templates (version 702fd1f6)

- **39 premium business templates**, one per four-star business reference. That brings the total to 187 templates: 93 personal, 63 business and 31 shop.
- **Verification:**
  - unit 1091/1091;
  - integration 61/61 (local);
  - Playwright 12/12 (local and production);
  - production smoke test 39/39;
  - all 187 live previews checked;
  - test data removed.

## 25 November 2026: home page shows the templates (version db4fc9d8)

- **"Made with ImprintSites" replaced** by "Our templates": six live, non-clickable previews of the Signature templates per kind of site (Personal, Business, Online store tabs), a count, and "See all templates". The anchor `#made` still works, so old `/examples` links land here.
- **Verification:**
  - unit 1091/1091;
  - integration 61/61;
  - Playwright 12/12 (local) plus the production run;
  - production smoke test 39/39;
  - test data removed.

## 25 November 2026: shop batch 2 (version dc47a6ac)

- **36 shop templates**, one per five-star storefront in Beauty (13), Bags and eyewear (7), Footwear (6), Stationery (4), Fragrance (2), Wellness (2), Kids (1) and Streetwear (1). That brings the total to 223 templates: 93 personal, 63 business and 67 shop.
- **Three new storefront layouts:** Hero Object, Lifestyle and Wordmark, with the heroes objecthero, sunlit and wordgrid. There's also a new Wellness category tab.
- **Photos:** 52 new CC0 product photos. Shots showing other brands' logos or bottles were left out.
- **Verification:**
  - unit 1307/1307;
  - integration 61/61;
  - Playwright 12/12 (local) plus the production run;
  - production smoke test 39/39;
  - all 223 live previews checked;
  - test data removed.

## 25 November 2026: landing templates section, business first (version cac8fc9d)

- **Landing page:** "Our templates" now uses the gallery's own cards (preview, name, colours, description, badges, buttons). It opens on Business, and the tabs read Business, Personal, Online store. There are six cards per tab and a "See all N templates" button.
- **The owner's personal picks** appear under Personal, in this order: Essay, Tiles, Poem, Full Bleed, Kernel, Lens.
- **Business first** in the gallery's "All" view and type buttons.
- **Kernel's description** no longer mentions the grid background, which was removed under the no-slop rule.
- **Verification:**
  - unit 1307/1307;
  - integration 61/61;
  - Playwright 12/12 (local) plus the production run;
  - production smoke test 39/39;
  - test data removed.

## 25 November 2026: "Ask ImprintSites AI" assistant (version e3301281)

- A floating "Ask ImprintSites AI" pill with the logo sits on every platform page (marketing, sign-in, dashboard, editor, admin). It opens a chat panel; on the editor and setup pages it shrinks to the logo only, so the canvas stays clear.
- Answers come from DeepSeek (`deepseek-chat`) through `POST /api/assistant`. The key is the Worker secret `DEEPSEEK_API_KEY` and never reaches the browser. Optional `DEEPSEEK_MODEL` overrides the model.
- The system prompt holds the product facts (the locked $20/$30/$100 prices, hosting amounts from settings, template counts, what is coming soon) and rules: don't guess, never ask for passwords or card details, stay on topic.
- Limits: 30 questions an hour per visitor, 120 for signed-in users; messages up to 2,000 characters; 25-second timeout. The CSRF header is required. Replies are shown as plain text.
- **Not switched on yet:** the secret isn't set, so the endpoint returns 503 `not_configured` and the panel says so. To switch it on: `npx wrangler secret put DEEPSEEK_API_KEY`.
- Tests: unit 1308, integration 62, Playwright 13 (local), smoke 39/39 plus the assistant e2e on production. Smoke records were cleaned up.

## 25 November 2026: shop batch 3 (version ceae685f)

- 60 new shop templates, one per remaining five-star storefront: fashion and menswear 13, jewellery 4, furniture and home 9, coffee, drinks and food 15, tech 9, sport 5, makers 5. Library: 283 templates (personal 93, business 63, online store 127).
- Four new shop layouts: **pop** (colour block hero, tilted photo card, bordered product cards), **sport** (full-screen action photo, italic uppercase type, category strip), **tabletop** (tall photo beside a priced menu of products) and **atelier** (staggered product grid, three-photo workshop hero, commission note).
- New product kits with fictional demo shops: coffee, drinks, food, tech, gadgets, cycling, ski, golf, city bikes, ceramics, florist, woodwork and candles. 84 new CC0 photos are credited in `public/stock/CREDITS.txt`.
- Shop hero subheadings now use the first sentence of the shop's story, so they no longer repeat the headline (batch 2 fixed as well).
- Tests: unit 1668, integration 62, Playwright 13 (local, including every template), smoke 39/39, all 283 live previews return 200. Smoke records were cleaned up.

## 25 November 2026: four-star shop top-up (version dfbb5ae3)

- 16 four-star shops, ranked "standard" so they appear after the five-star ones: wellness 4, kids 4, stationery 2, drinks 2, streetwear 2 (filed under fashion), fragrance 1 and coffee 1. A new wine kit backs the natural-wine shop.
- Library: 299 templates (personal 93, business 63, online store 143). Every planned five-star site and the agreed four-star fills are now live.
- Shop categories now have at least 5 designs each, except fragrance with 3: only one four-star fragrance source exists.
- Tests: unit 1764, integration 62, Playwright 13 (local, including every template), smoke 39/39, all 299 live previews return 200. Smoke records were cleaned up.

## 25 November 2026: review fixes and the help assistant switched on (version b1ec1c98)

- Production migrations 0007 (assistant usage) and 0008 (per-reservation ledger) applied.
- Live: every fix from the Codex review of 5a23f67, plus Codex's own follow-up fixes from its 6174c29 verification. Highlights: signed-out member templates show only a hero thumbnail; owner photos never reach customer sites; templates make no unrequested offers; phone layouts fit at 320, 390 and 768 px.
- "Ask ImprintSites AI" is on, with the owner's DeepSeek key stored as the Worker secret `DEEPSEEK_API_KEY`. The model is `deepseek-flash`. Each page has its own detailed starter questions and a page guide. Answers are detailed and formatted. A service-wide daily allowance of 1,500,000 tokens applies, changeable in Admin settings (0 pauses the assistant).
- Checks: unit 2,389, integration 64, Playwright 15 (local); smoke 39/39; all 299 thumbnails 200; full member pages gated when signed out; old photo URLs serve images; live answers checked on the store manager and How it works pages, and logged in the usage table. Smoke records were cleaned up.
