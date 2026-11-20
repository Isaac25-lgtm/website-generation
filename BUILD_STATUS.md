# Build status

Updated 2026-11-20. Legend: ✅ built and tested · ⚠️ works with a limitation · ❌ blocked on an external dependency.

## Checklist

| Area | Status | Evidence |
|---|---|---|
| Public site: home (photographic rotating hero), pricing, templates, examples, how-it-works, contact, terms, privacy, refunds | ✅ | e2e + prod smoke; axe clean |
| Fixed prices $20/$30/$100, enforced server-side | ✅ | `src/shared/pricing.ts` (frozen); unit + integration tests; checkout never reads a client amount |
| Auth: email/password, sessions, logout, CSRF, rate limits | ✅ | integration tests |
| Google sign-in (OAuth + PKCE, safe account linking) | ⚠️ | Code complete; needs the owner's OAuth client |
| Password reset | ⚠️ | Token flow complete; email delivery not configured, so an admin-generated reset link is the fallback |
| 3 intake wizards (personal, business, extended e-commerce) with autosave | ✅ | e2e |
| 18 original templates (6/6/6), 9 public + 9 member-only | ✅ | unit (all pages render) + e2e screenshots of all 18 |
| Inspiration URL → style brief (Browser Run + HTML fallback + screenshot fallback), SSRF-hardened, respects robots.txt | ✅ | prod smoke (`method=browser`), integration SSRF tests |
| Deterministic generator (never invents facts) + optional Workers AI copy polish with strict JSON validation | ✅ | unit + prod smoke (real AI call) |
| Editor: pages/sections, inspector, theme, undo/redo, checkpoints, template switch, device previews, click-to-select | ✅ | e2e |
| AI refine with rule-based fallback, labelled honestly | ✅ | prod (`engine=ai`) + integration (`engine=rules`) |
| Private previews (owner session or signed 7-day link, watermarked, noindex) | ✅ | integration |
| Publishing to `/s/<slug>/`, versioning, rollback, unpublish | ✅ | integration |
| Contact and quote forms → leads inbox (honeypot, timing, rate limits) | ✅ | integration |
| Store: products, variants, inventory, categories, CSV import, search/filter, cart, checkout, orders, status flow, restock, CSV export | ✅ | integration (incl. concurrent anti-oversell) + e2e |
| Store online card payments | ❌ | Needs merchant gateway integration per seller (not built). Offline methods are real |
| Assets: sniffed types, size caps, quotas, alt text, delete protection, licensed Openverse import with attribution | ✅ / ⚠️ | integration. Storage is D1 until R2 is enabled |
| Builder billing: Dodo checkout, Standard Webhooks verification, idempotency, server-side payment re-check, refunds revoke publishing | ⚠️ | Code + unit/integration tests; no Dodo credentials yet |
| Admin: overview, users, projects (demo grants, suspend), tickets, payments, orders, settings (hosting fee), audit log | ✅ | integration (RBAC) |
| Customer account: export data, deletion request, password | ✅ | |
| Site export (static HTML + assets + site.json ZIP) | ✅ | integration |
| Custom domains / subdomains (Stage 2) | ❌ | Truthful "not available" status plus interest capture |
| Email notifications | ❌ | Resend adapter ready; no key |

## Pricing
- **Build fees:** $20 / $30 / $100, one-time and locked server-side.
- **Hosting & maintenance:** $4 per site per month. It's shown everywhere; monthly billing is not yet live (status `announced`).

## Test runs (final)

- **Unit:** 59/59 ✅ (`npm run test:unit`)
- **Integration (local Worker + D1):** 36/36 ✅ (`npm run test:integration`)
- **Playwright (local):** 11/11 ✅, with screenshots in `tests/e2e/screenshots/`
- **Production smoke:** 36/36 ✅
- **Playwright (production, full suite including signed-in builder flows):** 11/11 ✅

### Defects found by tests and fixed during the build
- Sub-pages had no `<h1>` (accessibility). Page headings were added.
- CSV import accepted a non-numeric price as 0. It's now rejected per row.
- An order-cancel race could restock twice. The batch now aborts atomically via a guarded history insert.
- Decorative preview thumbnails ran scripts inside sandboxed iframes. Thumbnails are now a static render.
- Inline links relied on colour alone (WCAG 1.4.1). They're now underlined.
- Hero sections faded in on load, hurting perceived load speed. Heroes now render immediately.
- The editor's "Desktop" preview showed the mobile layout. Device frames now render at true width and scale to fit.
- The contact form rejected real visitors whose computer clock was skewed. The anti-bot timing now uses elapsed time measured in the browser.
- The hero slideshow showed a blank frame when jumping straight to a photo that hadn't loaded. The selected photo now loads immediately.

## Audit follow-up and Python read path (20 November 2026, local only, not deployed)

Work from [docs/claude-handoff.md](docs/claude-handoff.md), steps 1 and 2:

- **Merchant defects fixed in the Worker** (each covered by `tests/integration/merchant-regressions.test.ts`; all 9 tests failed before the fix):
  - **#1** The store currency chosen in setup prices products, CSV imports, quotes and orders before generation, and publishing refuses products priced in another currency.
  - **#2** CSV re-import updates only the columns provided. It matches by variant SKU, then product SKU, keeps every variant, sets stock per option value, and reports an error for an ambiguous bare stock value.
  - **#3** Product edits send `stockBase`, and the server applies only the change, so sales made while the form was open are kept.
- **Build reproducibility:** `build` and `typecheck` run `wrangler types` first. `.dev.vars.example` is now tracked. `AppEnv` no longer depends on whether a local `.dev.vars` exists.
- **Python backend** (`backend/`, Django/DRF on Neon PostgreSQL):
  - endpoints: health, readiness, `/api/config` and `GET /api/projects/<id>`
  - a verified D1 → PostgreSQL importer
  - shared `contracts/`
  - the local UI routes the project read to Python when `PY_API` is set
- **Home and Examples:** a new "Our work" group shows three live sites by the Motion Imprints team, kept separate from the builder demos.

Test runs for this change: unit 64/64, integration 48/48 (including 9 merchant regressions and 3 Worker ↔ Python parity tests), Playwright 11/11 plus the Python-routing browser test, and backend pytest 49/49. axe found no violations in the new section.

**Follow-up review (same day), fixed with tests:**

- **Live store currency:** a live store keeps its published currency for new products. A form priced in another currency is refused with `409 currency_mismatch`. Checkout refuses lines priced in another currency, and the live catalogue hides them.
- **Retried stock edits:** each opened product form sends a stable `editId` (migration `0004`). Replaying a save applies nothing more and keeps sales made in between. A changed value in the same form applies only the difference.
- **Ambiguous CSV rows:** an option value shared by several variants (for example Medium/Red and Medium/Blue) is rejected before any stock changes. Rows must give the SKU or both option values.
- **Python snapshot:** private reads fail closed outside local development. Parity and browser suites only import into a disposable database (`--disposable-only`).

**International positioning:** demo personas are set in London, Lisbon, Berlin, Toronto, New York, Austin, Copenhagen, Singapore, Melbourne, Paris, San Francisco, Sydney, Vancouver and Los Angeles, priced in USD, EUR or GBP. Phone examples use fictional international numbers, and the currency list leads with major international currencies. Payment wording is neutral ("pay on delivery", bank transfer), and the privacy page cites GDPR, CCPA, LGPD and PIPEDA. `SEED_VERSION` is `demo-v4`.

Test runs after the follow-up: unit 64/64, integration 52/52 (13 merchant and review regressions, 3 parity), Playwright 11/11 plus the Python-routing test, and backend pytest 52/52.

Still open from the audit: findings #4–#10 and the additional defects (see [docs/production-audit.md](docs/production-audit.md)).

## Next release priorities

1. Owner setup: Workers Paid, R2, Google OAuth, Dodo test keys and products, admin account (see `docs/cloudflare-setup.md`).
2. Run one Dodo **test-mode** purchase end-to-end and record the evidence in `DEPLOYMENT_REPORT.md`.
3. Merchant gateway for stores (Flutterwave or Paystack sandbox) once a seller has credentials.
4. Email notifications (Resend) and Turnstile on public forms.
5. Stage 2 domains: an owned SaaS zone, wildcard subdomains, Cloudflare for SaaS custom hostnames.
6. Prerender marketing pages for SEO, and use the Cache API for published sites.
