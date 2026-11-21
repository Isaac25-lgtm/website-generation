# Build status

Updated 2026-11-21. Legend: ✅ built and tested · ⚠️ works with a limitation · ❌ blocked on an external dependency.

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
- **Hosting & maintenance:** $3 (personal), $4 (business) or $5 (online store) per site per month. It's shown everywhere; monthly billing is not yet live (status `announced`).

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
- **Home and Examples:** an "Our work" group of three live team sites was added, then removed at the owner's request (20 Nov) so the examples stay focused on the international template demos.

Test runs for this change: unit 64/64, integration 48/48 (including 9 merchant regressions and 3 Worker ↔ Python parity tests), Playwright 11/11 plus the Python-routing browser test, and backend pytest 49/49. axe found no violations in the new section.

**Follow-up review (same day), fixed with tests:**

- **Live store currency:** a live store keeps its published currency for new products. A form priced in another currency is refused with `409 currency_mismatch`. Checkout refuses lines priced in another currency, and the live catalogue hides them.
- **Retried stock edits:** each opened product form sends a stable `editId` (migration `0004`). Replaying a save applies nothing more and keeps sales made in between. A changed value in the same form applies only the difference.
- **Ambiguous CSV rows:** an option value shared by several variants (for example Medium/Red and Medium/Blue) is rejected before any stock changes. Rows must give the SKU or both option values.
- **Python snapshot:** private reads fail closed outside local development. Parity and browser suites only import into a disposable database (`--disposable-only`).

**International positioning:** demo personas are set in London, Lisbon, Berlin, Toronto, New York, Austin, Copenhagen, Singapore, Melbourne, Paris, San Francisco, Sydney, Vancouver and Los Angeles, priced in USD, EUR or GBP. Phone examples use fictional international numbers, and the currency list leads with major international currencies. Payment wording is neutral ("pay on delivery", bank transfer), and the privacy page cites GDPR, CCPA, LGPD and PIPEDA. `SEED_VERSION` is `demo-v4`.

Test runs after the follow-up: unit 64/64, integration 52/52 (13 merchant and review regressions, 3 parity), Playwright 11/11 plus the Python-routing test, and backend pytest 52/52.

**Release audit of 6a1cc2c ([docs/release-audit-6a1cc2c.md](docs/release-audit-6a1cc2c.md)), fixed with tests:**

- **Replayed saves:** variants and products created inside an edit get ids derived from the edit id. Replaying the save keeps the same variant, its post-sale stock and its order references, and a cancellation restocks that variant.
- **Prices:** one strict parser (`parsePrice`) serves the CSV import, the product editor and delivery fees. `19,95` is €19.95. `1,234` and `1.234` are rejected as ambiguous for currencies with cents.
- **Variant SKU rows** price only that variant. Compare-at prices on a variant row are rejected.
- **SKUs** identify exactly one variant: duplicates are refused on save, enforced by migration `0005`, and ambiguous import rows change nothing.
- **Smoke test:** reads retry on any network error. Separate provider checks fail when AI or Browser Run fell back. Cleanup runs after errors and writes exact-ID SQL per run to `scripts/smoke-runs/` (gitignored).
- **Python:** `ALLOW_SNAPSHOT_READS=1` without `DJANGO_DEBUG=1` now stops the server at startup.

**Homepage:**
- The cards scroll through the full demo pages; the store card rests on its products.
- The business demo is now Kingsway Advisory (Meridian template, CC0 business photos).
- "Our work" was removed.

Test runs: unit 68/68, integration 57/57 (18 merchant and audit regressions, 3 parity), Playwright 11/11, backend pytest 53/53.

**Browser test pass and usability round (21 Nov 2026):** a full hands-on run in Chrome covered sign-up, the business and store wizards, AI wording and design requests, checkpoints, preview links, admin demo grants, publishing, a contact enquiry reaching the leads inbox, a euro store with sizes, checkout, the order lifecycle and the ZIP export. Fixed from it:
- dark mode kept a navy brand colour for text on a dark page; brand colours are now kept readable automatically (tested for all templates in both modes);
- a "Contact" / "Contact us" doubled heading; a leftover "UGX" price example and African payment-provider names;
- native browser pop-ups replaced with in-app dialogs;
- AI calls now have a 20-second budget with the labelled rule-based fallback (a slow call previously blocked the editor for 39 s);
- the website-you-love option is marked RECOMMENDED, shows progress, names its template matches and applies with one click (and runs automatically when pasted on the home page);
- a Light / Dark switch in the editor and on the publish page; plainer wording for stock options and the ZIP export;
- Google sign-in: an account already linked to another Google identity is never switched over (audit #7), and people outside the testers list get a clear message.

Test runs: unit 109/109, integration 54/54 (+3 parity, run with the Python server), Playwright 11/11 twice, backend pytest 53/53 (previous round).

**Codex integrity review of 1e5c9c6 ([docs/integrity-review-1e5c9c6.md](docs/integrity-review-1e5c9c6.md)), fixed with tests (21 Nov 2026):**
- **Checkout price change:** the shopper's accepted total travels with the order; if a price or delivery fee changed meanwhile the order is refused with the new quote instead of charging a different amount.
- **Two people editing one product:** a variant is deleted only when the editor actually removed it; another editor's new size or colour is kept.
- **Retried CSV import:** each import has an id, so a retry sets stock to the file's numbers once and never creates duplicate products.
- **Cancelling an order:** restocks exactly what that order took, read from the stock ledger, even if stock tracking was switched off or on in between.
- **Draft saves (audit #4):** saving is now an atomic compare-and-set; of several editors saving the same revision exactly one wins and the rest get "changed in another tab".
- **Revoked access (audit #6):** when a site's last valid purchase or demo grant is revoked or refunded, the live site, its forms and checkout go offline and it can't be republished until access is restored.
- **Signing key (audit #10):** production refuses to sign preview links or order receipts without `SESSION_SECRET` instead of falling back to a development key.
- **Browser findings:** the home-page idea and website-you-love apply only to the site created from that prompt, then are cleared; the web address you see is the one you get (Continue waits for "Available", old availability answers are ignored); wizard saves run in order, show "Unsaved changes", are sent when the page closes, and a failed save keeps you on the step; dialogs keep keyboard focus inside and return it on close; a duplicate page id on the home page is fixed.
- **Mobile hero:** on phones the rotating photo fills the hero behind the words (like a video hero) with a lighter shade than desktop, a shorter subheading and a compact layout so the photo isn't stretched as far.
- **Examples live on the landing page only:** "Made with ImprintSites" is a picture wall (not links into the demo sites); the separate Examples page, its menu and footer links are gone, and `/examples` goes to the landing-page showcase. The three website-type cards show the demo screens and the build price ($20 / $30 / $100) with a Start button, without links into the demo sites.

Test runs: unit 109/109, integration 61/61 (23 merchant regressions, new draft-race and revocation tests; parity skipped, backend unchanged), Playwright 11/11 twice (the builder flow now also checks the address gate, autosave state and dialog focus).

- **Floating WhatsApp button (option):** a "Add a floating WhatsApp button" tick box in every wizard (personal, business, store) and in the editor's Site settings. It shows a labelled green "WhatsApp" button in the corner of every page when ticked and a valid number is set; new sites are opt-in, and sites made before the option keep their original behaviour.
- **Logo (option):** logo upload on all three wizards (personal sites now included) and in Site settings, with clearer guidance; "Show only the logo in the header" for logos that already contain the name (the name stays for screen readers); the logo is also the browser-tab icon.

Test runs (final confirmation, 21 Nov): unit 117/117 (8 new WhatsApp and logo tests), integration 61/61, Playwright 11/11.

Still open before a paid launch: billing webhook handling (audit #5) and inspiration privacy / URL policy (#8, #9). Paid launch stays on hold until #5 is fixed.

## Next release priorities

1. Owner setup: Workers Paid, R2, Google OAuth, Dodo test keys and products, admin account (see `docs/cloudflare-setup.md`).
2. Run one Dodo **test-mode** purchase end-to-end and record the evidence in `DEPLOYMENT_REPORT.md`.
3. Card payments for stores through each seller's own provider, once a seller has credentials.
4. Email notifications (Resend) and Turnstile on public forms.
5. Stage 2 domains: an owned SaaS zone, wildcard subdomains, Cloudflare for SaaS custom hostnames.
6. Prerender marketing pages for SEO, and use the Cache API for published sites.
