# Codex handoff: full audit, from the template library onwards

**25 November 2026 · review commit `5a23f67` on `main`** (live Worker version `dfbb5ae3`).

The owner wants an independent audit of the whole codebase, with most attention on the work since your last verification round (`db3d932`). That is above all the template library, which went from 18 templates to 299 in one day. Judge three things: code integrity (correct, maintainable, no spaghetti code), security, and production readiness. Treat Claude's own test results below as claims to verify, not facts.

**Commits in scope:** `fb33f77..5a23f67`, which covers `73cabb6`, `daabfac`, `24294d6`, `719e57b`, `e5dbe85` and `5a23f67`. Not counting fixtures and photos, that is 63 files, about +6,200/−130. For context, also skim `9d3b182..fb33f77`: dark mode, footer and hero changes.

## Ground rules (unchanged)

- **Review only; don't redeploy.** No `wrangler deploy`, no remote migrations and no production writes. Against production, use public reads only.
- **Run anything that writes locally:** `npx vite preview --port 8788 --strictPort` against local D1. Clear `rate_limits` before each run, and restart the preview after every build.
- **Never print or commit secrets:** `.dev.vars`, `backend/.env` and `scripts/smoke-runs/`. `DEEPSEEK_API_KEY` is not set anywhere yet; don't ask for it.
- **Report findings first.** Make fixes only if the owner asks, each one small, tested and committed separately.
- **Low disk space:** the owner's machine has little free disk. Don't install extra browsers or keep large screenshot sets; use the installed Chrome channel.

## How to run

```bash
npm ci && npm run typecheck && npm run build
npm run db:migrate:local
npx vite preview --port 8788 --strictPort        # restart after every build
npx wrangler d1 execute DB --local --command "DELETE FROM rate_limits"
npm run test:unit            # Claude: 1764 passed
npm run test:integration     # Claude: 62 passed, 3 parity skipped (no PY_API_URL)
npx playwright test tests/e2e/app.spec.ts   # Claude: 13 passed, ~5 min ("every template" test is ~2.5 min)
```

Don't run `scripts/smoke-prod.mjs`: it writes to production. Claude ran it after each release (39/39) and cleaned up its records. All 299 live previews returned 200 to `GET /api/templates/<id>/preview/?static=1`. That check is read-only, so you may repeat it.

## What was built (map of the new code)

| Area | Files | Notes |
|---|---|---|
| Template registry | `src/shared/templates.ts` | Spreads every template array into `TEMPLATES`, then `TEMPLATE_MAP`. `rank`: signature → premium → standard. `STORE_CATEGORIES` holds 18 keys. |
| Template definitions | `templates-personal.ts`, `templates-premium.ts`, `templates-business.ts`, `templates-business4.ts`, `templates-site.ts`, `templates-store.ts`, `templates-store2.ts`, `templates-store3.ts` | Store rows go through `storeTemplate()` (exported as `S` from `templates-store.ts`). Each template can carry a raw `css` string. |
| Demo content | `demo.ts` (`PERSONAS`), `demo-personal.ts`, `demo-premium.ts`, `demo-business.ts`, `demo-business4.ts`, `demo-store.ts` (`KITS`, `shop()`), `demo-store2.ts`, `demo-store3.ts` | Fictional people and shops. `demo-store2/3` **mutate the exported `KITS` object at import time**. |
| Hero renderers | `render/personal-heroes.ts`, `business-heroes.ts`, `premium-heroes.ts`, plus `sections.ts` (built-in and store heroes) | Dispatched in order personal → business → premium → built-in `switch`. All build HTML with template strings. |
| Hero and layout CSS | `render/personal-hero-css.ts`, `business-hero-css.ts`, `premium-hero-css.ts`, `site-layouts.ts`, `layouts.ts` (`LAYOUT_CSS`, `STORE_HERO_CSS`, `LAYOUT_DEFAULTS`) | Per-hero CSS is injected only for variants in use (`extraCss` in `render/index.ts` ~L146); `STORE_HERO_CSS` is always injected. |
| Store rendering | `render/store.ts` | Product-card variants and sizes (`CARD_SIZE`); the variant class allow-list appears twice (~L50, ~L120). |
| Quality rules | `src/shared/quality.ts` (`copySlop`, `cssSlop`), `tests/unit/quality.test.ts` | Enforces the owner's no-AI-slop rule, real photos in Signature demos, and complete sites. |
| Identifier guard | `tests/unit/source-token-hashes.json` and the last test in `quality.test.ts` | Stores truncated SHA-256 hashes of words from reference-site domains and owner names, so demo copy can't echo them. No plaintext list should exist anywhere, including git history. |
| Owner photos | `src/shared/owner-photos.ts`, called in `saveDraft` (`src/worker/lib/site.ts` ~L163) | `public/stock/owner-*` are the owner's own photos, allowed **only** in template previews and never in customer sites. |
| Stock photos | `public/stock/*.webp` (~300), `public/stock/CREDITS.txt` | CC0 photos (Openverse/StockSnap) plus `owner-*` photos. A test checks every file is credited. |
| Gallery and landing | `src/client/pages/Marketing.tsx` (`TemplateGallery`: `showcase`, `featured`, `initialType`, `TYPE_ORDER`), `src/client/pages/Home.tsx` (`HOME_PICKS`) | Business templates first; the landing page shows 6 cards per type. |
| AI assistant | `src/worker/routes/assistant.ts` (`POST /api/assistant`), `src/client/components/Assistant.tsx` (mounted in `main.tsx`), styles in `styles.css` (`.ast-*`), `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL` in `env.ts` | DeepSeek proxy. Returns 503 `not_configured` while the key is unset. Rate limits: 30/h per IP hash, 120/h per signed-in user. |

## 1. Security: the questions that matter most

1. **XSS in the new renderers.** About 100 new hero variants build HTML by string interpolation. For every interpolation of customer-controlled data, confirm it passes through `esc()`, or `safeHref()` for links. Customer-controlled data includes:
   - brand name and headings
   - eyebrow and subheading
   - product and collection names
   - image alt text and captions
   - CTA labels and hrefs
   - testimonial and project fields

   Watch especially for values split and rebuilt (`split("·")` in `nameplate`, the wordmark in `wordgrid`), attributes, and inline `style="..."`. `wordgrid` puts a computed number into `style`. Prove it can't take a string.
2. **Template CSS injection.** `tpl.css` and the layout and hero CSS are concatenated raw into `<style>` (`render/index.ts` ~L182). Confirm none of it can come from a customer: through the SiteDoc, theme fields, the editor's `refine` patch or AI output. Check that `themeVars()` sanitises colours and fonts so a crafted theme value can't close the `<style>` tag.
3. **Member-template gating.** `serveTemplatePreview` in `src/worker/routes/sites.ts` (~L107) lets anonymous visitors see any member template when `?static=1` is set. That is intended for gallery thumbnails, but the full multi-page preview, including `/shop`, `/product/...` and `/about`, may also be reachable. Decide whether this breaks the business rule ("signing up unlocks the live preview") and report it with a reproduction.
4. **Owner photos never reach customer sites.** `stripOwnerPhotos` runs in `saveDraft`. Check every other path that writes or publishes a SiteDoc:
   - project creation with an inline `draft_json` (`projects.ts` ~L165)
   - template switch (~L335)
   - checkpoint restore (~L357)
   - publish and `site_versions` (~L410)
   - ZIP export
   - the Python read path in `backend/`

   Can an `owner-*` stock name enter through any of them, for example by `PUT`ting a doc whose image references `{ stock: "owner-ats-steel" }`?
5. **AI assistant abuse and cost.** Review `assistant.ts` for:
   - prompt-injection limits (the system prompt says to ignore rule changes; check that facts can't be overridden in ways that matter)
   - cost exposure: anonymous 30/h per IP hash, and IP rotation; is a global daily cap needed?
   - error paths that could leak upstream detail
   - whether the 25 s `AbortController` timeout is enough on Workers
   - the zod limits (16 messages, 2,000 characters each; only the last 12 are forwarded)
   - the `role` allow-list, which blocks client-sent `system` messages

   Also check that the rate limit runs before the key check, so an unset key can't be probed cheaply, and that the client renders replies as text only.
6. **Assistant facts.** The system prompt states product facts: prices, hosting amounts from `system_settings`, template counts, and that card payments in stores, own domains and a few other features are "coming soon". Check each claim against the code. A false claim here is a consumer-protection issue, not a style problem.
7. **Identifier hygiene.** Confirm:
   - `git log --all -- tests/unit/source-tokens.json` is empty, meaning no plaintext source list was ever committed
   - no source brand names, domains or reference-site owners' names appear in `src/`, `public/`, the docs or the commit messages
   - demo names don't belong to real businesses (spot-check, for example "Plain Weave", "Fieldhouse", "Halo Health", "Kumo Coffee")
8. **CSP.** Template previews and published sites use a nonce `script-src` and `style-src 'unsafe-inline'`. Confirm no new hero needs inline script and that nothing new loads from a third-party origin.

## 2. Code integrity

- **Duplication:**
  - `templates-store2.ts` and `templates-store3.ts` share an identical `Row` type and mapper
  - `demo-store2.ts` and `demo-store3.ts` share identical `SHOPS` mappers
  - the variant allow-list appears twice in `store.ts`
  - three hero files repeat the same dispatch pattern

  Recommend a concrete consolidation where it pays for itself. Don't flag duplication that's cheaper to keep.
- **Import-order side effects.** `KITS` is mutated by `demo-store2.ts` and `demo-store3.ts` when they're imported. Find out whether anything reads `KITS` before those imports run, for example the worker importing `demo-store.ts` alone.
- **Dead code.** `.show-*` and `.btn-light` in `styles.css`, plus older showcase components, may now be unused. List what is safe to delete.
- **Class-name collisions.** Hero CSS is global inside a page. Earlier collisions (`.badge`, `.tile`, `.tiles`, `.tag`, `.note`, `.chip`) were renamed. Check systematically for any remaining clash between hero, layout and base CSS (`render/css.ts`) selectors that changes how another section renders.
- **Types and contracts:**
  - `TemplateDef.layout` is a union of `StoreLayout` and `SiteLayout`
  - `variants.hero` is a free string, so a typo silently falls back to the default hero
  - `contracts/sitedoc.schema.json` and the 299 fixtures in `contracts/fixtures/sitedoc/valid/` should still match the TypeScript schema
- **Tests:**
  - Are `quality.test.ts` and the e2e "every template renders" test strong enough, or do they pass trivially?
  - Is there any template or persona without an assertion?
  - The e2e test now has a 15-minute timeout. Can it be faster and still cover every template?

## 3. Production readiness

- **Bundle and runtime cost:**
  - The worker bundle is about 1.1 MB uncompressed (`dist/imprintsites/index.js`). It includes all template definitions, personas and CSS strings. Check the compressed size against Workers limits, and check cold-start and CPU time for rendering the heaviest template.
  - The client bundle is about 545 KB (`index-*.js`), and `Wizard.tsx` imports `TEMPLATE_MAP`. Should the template list and personas be code-split?
- **Accessibility:**
  - Every hero should have exactly one `h1`; earlier misses were `splitname`, `bento`, `coordinates` and `clients`.
  - Contrast on the new pop, sport, tabletop and atelier layouts: in the pop hero, text sits on the surface colour, and in sport, white text sits over photos.
  - Mobile at 390 px.
- **Photos:**
  - Every `public/stock` file should be credited and referenced. Report unreferenced files, which waste deploy size.
  - No photo should show a readable third-party brand or logo.
- **Customer path:** pick 5 templates across types, including at least one each of `e-printshop`, `e-piste`, `e-roastery` and `e-kiln`. Build a site from each as a customer and confirm the customer site has no demo persona content, owner photos or template-only notices once published.

## Output wanted

Write `docs/integrity-review-5a23f67.md`, in the same format as your `integrity-review-1e5c9c6.md`:

- Findings ranked **P0 to P3**, each with `file:line`, a reproduction or a failing test, the impact, and an acceptance test for the fix.
- A short "verified OK" list, so the owner knows what you checked and found sound.
- A go/no-go recommendation for continuing to add templates on the current architecture.
