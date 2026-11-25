# AGENTS.md: handoff for coding agents (Codex and others)

**Current handoff, 25 November 2026.** Start with the [Claude handoff for the fixes after 6174c29](docs/claude-handoff-6174c29-fixes.md). It covers the fixes in `528c02f`, verification through `8ed61fb`, and the remaining paid-launch work.

Earlier verification of the [first fix pass](docs/fixes-integrity-review-5a23f67.md) is in the [6174c29 review](docs/integrity-verification-6174c29.md).

Earlier: [full audit from the template library onwards](docs/codex-audit-templates-5a23f67.md), review commit `5a23f67`.

**Earlier: the [verification handoff](docs/codex-verification-db3d932.md) (21 November 2026, commit `db3d932`): check the fixes to your [1e5c9c6 review](docs/integrity-review-1e5c9c6.md) and the new WhatsApp/logo options.**

**Current handoff (20 November 2026).** Read the [Claude engineering handoff](docs/claude-handoff.md) and [production audit](docs/production-audit.md) for the release decision, verified findings and proposed Python backend / React frontend split. The remaining sections record the original TypeScript build and its historical release procedure.

**Since then (local, uncommitted until the owner reviews):**

- Audit findings #1–#3 are fixed, with regression tests.
- A Python read path exists in `backend/` (Django + DRF + Neon PostgreSQL); see [backend/README.md](backend/README.md).
- Shared `contracts/` are generated from the TypeScript schema.
- The owner has little local disk space, so use hosted services (Neon) rather than local databases. Keep `backend/.env` out of git.

Written 2026-11-20 at the end of the first build session. Read this file first, then `BUILD_STATUS.md` and `DEPLOYMENT_REPORT.md`.

## 1. What this is

**ImprintSites AI** is a no-code website builder SaaS by Motion Imprints Technologies. The parent company may rename to "Motion Analytics", so the product name deliberately stands on its own. Customers describe a site, pick a template (or paste an inspiration URL), edit it in a live editor, pay, and publish.

- **Live:** https://imprintsites.omodingisaac123.workers.dev (Cloudflare Worker `imprintsites`, latest version `712e0968-5fd8-4fb2-a3c0-63b8b61bd824`)
- **Demo sites:** `/s/demo-portfolio/` (Lens template, Lisbon photographer), `/s/demo-business/` (Meridian, Kingsway Advisory, London), `/s/demo-store/` (Maison, Maison Nia, Paris, EUR)
- **Brand:** wordmark "ImprintSites" plus a blue "AI", tagline **"Imagine it. Build it. Launch it."**, logo `public/logo-mark.svg`.
- **Original spec:** the owner's master prompt *"Motion Imprints Website Builder: Claude Code Master Build Prompt"*. It isn't in the repo; the key rules are restated in section 3.

## 2. Status at handoff

All of the following work and are tested locally and on production:

- **Public marketing site:**
  - home: photo hero with rotating slides, "what you can build" cards, how-it-works, a "Made with ImprintSites" bento wall, an inspiration section, pricing, FAQ
  - pages: pricing, templates (9 public and 9 member-only), how-it-works, contact form, Terms, Privacy, Refunds (examples are shown only on the home page as a picture wall; `/examples` redirects there)
- **Auth:** email/password, sessions, CSRF protection and rate limits. Google OAuth code is complete but has no client ID yet.
- **Wizards and generator:** three intake wizards (personal, business, and an extended e-commerce flow) and a deterministic generator.
  - The generator turns answers into a SiteDoc JSON. It never invents facts.
  - Optional Workers AI copy polish. AI output is schema-validated and flagged for the user's review.
- **Editor:** pages and sections, inspector, theme, undo/redo, checkpoints, template switching, scaled device previews, and "refine" (Workers AI, with a rule-based fallback).
- **Inspiration URL analysis:** Browser Run, then an HTML/CSS fallback, then a screenshot fallback. Hardened against SSRF; respects robots.txt.
- **Publishing:**
  - path-based URLs `/s/<slug>/`, with version history, rollback, unpublish and ZIP export
  - signed private preview links
  - web-address picker with a live availability check and an automatic `name-2` suggestion when a name is taken
- **Stores:**
  - products, variants, inventory, categories and CSV import
  - search and filters, cart, checkout, orders, status flow, restocking, CSV export
  - a D1 trigger makes overselling impossible
- **Leads:** contact and quote forms deliver to the owner's dashboard.
- **Admin:** overview, users, projects (audited demo grants and suspensions), tickets, payments, orders, settings, audit log.
- **Billing code:** Dodo checkout, Standard Webhooks verification, idempotency, server-side payment re-check, and refund handling.

**Blocked on the owner** (see `docs/cloudflare-setup.md`):

1. Workers Paid plan. The owner said they'd upgrade; the code is sized for Paid limits.
2. **R2 not enabled.** Wrangler error 10042. Uploads fall back to D1 BLOB storage, capped at 6 MB per file and 60 MB per project. After the owner enables it:
   - run `npx wrangler r2 bucket create imprintsites-media`
   - uncomment `r2_buckets` in `wrangler.jsonc`
   - redeploy
3. Google OAuth: needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set as Wrangler secrets.
4. Dodo Payments: needs these secrets, set in **test mode** first:
   - `DODO_API_KEY`
   - `DODO_WEBHOOK_SECRET`
   - `DODO_PRODUCT_PERSONAL`, `DODO_PRODUCT_BUSINESS`, `DODO_PRODUCT_ECOMMERCE`

   See `docs/dodo-integration.md`.
5. The owner needs an admin account: they sign up on the site, then run `node scripts/make-admin.mjs <email>`.
6. Optional: Resend email (`RESEND_API_KEY`, `EMAIL_FROM`).

**Not built yet** (next priorities):

- **Monthly hosting billing.** The hosting fee ($3 personal / $4 business / $5 online store, per site per month) is displayed everywhere with status `announced`, but nothing collects it. It needs a Dodo subscription product plus an opt-in flow. Only then switch `hosting_fee_status` to `active`.
- **Custom domains (Stage 2).** Needs an owned zone plus Cloudflare for SaaS custom hostnames. See `docs/domain-publishing.md`. The UI currently says "coming soon" and only collects interest.
- **Card payments inside customer stores.** Each seller would connect their own card payment provider. Never route seller revenue through the platform's Dodo account.
- **Smaller items:**
  - Turnstile on public forms
  - Cache API for non-store published pages
  - prerendering marketing pages for SEO
  - email notifications

## 3. Non-negotiable owner rules

- **Prices:** build fees are **$20 / $25 / $100 USD, one-time** (business changed from $30 to $25 by the owner on 25 Nov 2026), locked in `src/shared/pricing.ts` (frozen object) and never taken from the client.
  - Hosting & maintenance per site per month is **$3 personal, $4 business, $5 online store** (owner, 2026-11-21). Always state the numbers; the owner explicitly rejected vague wording like "flat fee".
  - The hosting values are stored in `system_settings` (migrations 0002 and 0003), and the UI reads them via `hostingPrice()` in `src/client/lib.tsx`.
- **Truthfulness:**
  - Never fake payments, deployments, AI calls, testimonials, reviews, sales numbers, logos or "verified" badges.
  - Unavailable features must say so in the UI ("coming soon" or "not configured").
  - Demo content is fictional and always labelled as a demo.
- **No invented legal details:** don't make up company registration, phone numbers or addresses. Operator details come from admin settings.
- **Inspiration feature:** reads high-level style only. Never copy another site's text, images, logos or code.
- **Images:** only user uploads, CC0 photos (`public/stock`, `public/hero`, with credits in each `CREDITS.txt`), Openverse imports with attribution, or self-generated SVG art. No scraped imagery.
- **Owner approval required:**
  - purchases, plan upgrades and domain registration
  - destructive production operations
  - live charges
  - committing secrets (never commit `.dev.vars`)

## 4. Owner's design preferences (learned through feedback)

- Wants a **natural, non-generic look**. Explicitly rejected AI-template styling: blue gradients everywhere, glows, grid backgrounds, emoji, "NEW" pills, generic feature grids.
- Current system: neutral greys, black primary buttons, Outfit headings and Inter body text. Blue appears only in the logo, links and one soft accent.
- **Inspiration sources the owner gave:**
  - the Emergent landing page (centred prompt, Google sign-in gating)
  - the Forbes Advisor hero (real photo, bold left-aligned white text, check-mark row)
  - Framer's "Shipped with Framer" bento wall
  - Lovable-quality templates
- **Imagery must relate to what the product does** (building websites): screens, sketches, devices, customers, orders. Not random scenery.
- Pricing belongs near the bottom as a normal pricing table.
- The owner wants **multiple full test passes before anything is called "ready"**, plus visual checks of real screenshots.

## 5. Architecture (one Worker)

```
src/shared/   used by Worker + client: schema.ts (SiteDoc, Zod), pricing.ts, templates.ts (18), generate.ts,
              refine.ts, demo.ts (personas + public demos), render/ (HTML renderer, CSS, platform runtime JS)
src/worker/   index.ts (Hono app, cron), routes/ (auth, projects, assets, commerce, public, billing, admin, sites),
              lib/ (auth, crypto, storage R2/D1, ssrf, ai, dodo, inspiration, site, zip, email), seed.ts (demo sites)
src/client/   React SPA (react-router): pages/ (marketing, auth, legal), app/ (dashboard, wizard, editor, store, admin)
migrations/   D1 SQL (0001 schema, 0002/0003/0006 hosting fee, 0004 stock edit ids, 0005 unique variant SKUs)
```

- **Routing:** `wrangler.jsonc` → `assets.run_worker_first` sends `/api/*`, `/s/*`, `/preview/*`, `/media/*`, robots, sitemap and healthz to the Worker. Everything else is served by the SPA.
- **Bindings:** `DB` (D1 `imprintsites-db`, id `60f0763d-31e0-4c2c-871f-a24ac493af5d`), `AI`, `BROWSER`, `ASSETS`. `MEDIA` (R2) is commented out until R2 is enabled.
- **Customer sites:** server-rendered from the SiteDoc. The only JavaScript in them is the platform runtime (`render/runtime.ts`), which carries a CSP nonce; everything else is escaped.
- **Images in a SiteDoc:** `ImageRef` is one of three kinds:
  - `assetId`: an upload, served at `/media/:id`
  - `stock`: a CC0 photo at `/stock/<name>.webp`, name restricted to `[a-z0-9-]`
  - `art`: generated SVG
- **Demo seeding:** `seed.ts` runs lazily on the first request to `/api/examples` or `/s/demo-*`. To make changes to `demo.ts` personas reach live demos, **bump `SEED_VERSION`**. Old demos owned by `usr_demo_owner_system` are deleted and recreated.
- **Bento screenshots:** `public/showcase/*.webp` come from `node scripts/make-showcase.mjs <url>`. Re-run it after visual changes to the demos, then rebuild.

## 6. Commands

```bash
npm install
npm run typecheck                      # tsc -b (client + worker)
npm run build                          # tsc + vite build -> dist/
npm run db:migrate:local               # local D1 (.wrangler/state)
npx vite preview --port 8788 --strictPort   # full Worker + SPA locally (reads .dev.vars)
npm run test:unit                      # vitest: 59 tests
npm run test:integration               # needs the preview server; TEST_BASE_URL defaults to http://localhost:8788 (36 tests)
npx playwright test                    # 11 browser tests, uses installed Chrome; screenshots -> tests/e2e/screenshots
npm run db:migrate:remote && npx wrangler deploy   # production
node scripts/smoke-prod.mjs https://imprintsites.omodingisaac123.workers.dev   # 36 prod checks
TEST_BASE_URL=<prod url> SHOTS_DIR=tests/e2e/screenshots/prod npx playwright test   # full suite on prod
npx wrangler d1 execute DB --remote --file scripts/cleanup-test-data.sql --yes      # ALWAYS run after prod tests
```

**Release procedure used so far** (keep it):

1. typecheck, then build
2. restart the local preview server
3. clear local rate limits: `npx wrangler d1 execute DB --local --command "DELETE FROM rate_limits"`
4. run unit, integration and Playwright, and look at the screenshots
5. migrate remote, deploy, and wait until the live `index.html` references the new `/assets/index-*.js`
6. run the smoke test and the production Playwright suite
7. run the cleanup SQL
8. update `DEPLOYMENT_REPORT.md` and `BUILD_STATUS.md`

## 7. Environment gotchas (Windows machine)

- Use Git Bash or PowerShell. The npm cache is a symlink to `F:\Relocated_Development_Caches\npm-cache` because drive C: is nearly full. Install heavy things on F:.
- **The network is flaky.** Wrangler and DNS sometimes fail with `fetch failed` or `EAI_AGAIN`; retry. Playwright console checks ignore `ERR_NAME_NOT_RESOLVED` for this reason.
- `vite preview` breaks when `dist/` is rebuilt underneath it, so always restart it after `npm run build`. To stop the old server:

  ```powershell
  Get-NetTCPConnection -LocalPort 8788 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
  ```

- Vitest sets `process.env.BASE_URL`, which is why the integration tests use `TEST_BASE_URL`.
- Rate limits are stored in D1, so repeated test runs from one IP hit limits. Clear `rate_limits` locally before test runs. In production the limits are real; space out test runs.
- Workers AI and Browser Run are called remotely even in local preview (Wrangler login required). They consume the free daily quota.
- Image tools: Python with Pillow is available (WebP conversion). Openverse API is used to find CC0 photos; StockSnap blocks full-resolution downloads, so the photos are 960px wide.

## 8. Git

- **Remote:** https://github.com/Isaac25-lgtm/website-generation (branch `main`). The initial commit contains the full project as described here.
- **Never committed** (`.gitignore`): `.dev.vars` (secrets), `.wrangler/` (local D1 state), `node_modules/`, `dist/`, `test-results/`, test screenshots. Curated README screenshots live in `docs/screenshots/`.
- Commit or push only when the owner asks. Before every push, check that no secrets are staged (the secret names are listed in `.dev.vars.example`).

## 9. Key docs

- `README.md`: setup and overview
- `BUILD_STATUS.md`: feature checklist and test results
- `DEPLOYMENT_REPORT.md`: deploy history and verification evidence
- `PRICING_AND_BILLING.md`: locked pricing, $3/$4/$5 hosting, Dodo flow, marketplace segregation
- `SECURITY_NOTES.md`: trust boundaries, controls, residual risks
- `docs/cloudflare-setup.md`: owner actions
- `docs/dodo-integration.md`
- `docs/domain-publishing.md`
- `docs/operating-costs.md`
- `docs/architecture.md`
- `docs/quality-checklist.md`
