# Codex handoff: code-integrity and production-readiness review

**21 November 2026 · review commit `1e5c9c6` on `main`** (live Worker version `2021755e`).

The owner wants an independent check that every feature Claude tested in the browser is production ready, and that the code behind it is maintainable rather than spaghetti. Claude's browser pass showed behaviour; your job is to judge the code that produces it. Earlier reviews to build on: [production audit](production-audit.md), [release audit of 6a1cc2c](release-audit-6a1cc2c.md), [Claude engineering handoff](claude-handoff.md).

## Ground rules

- **Review, don't redeploy.** No `wrangler deploy`, no remote migrations, no production writes, no paid AI/browser calls beyond what a local test run makes. Use public reads only against production.
- **Local only for anything that writes:** `npx vite preview --port 8788` on a local D1. Clear `rate_limits` before each run.
- **Secrets:** never print or commit `.dev.vars`, `backend/.env` or anything in `scripts/smoke-runs/`. The Neon URL in `backend/.env` is a real credential.
- **Python suites** replace data in the database they point at: run them only against a disposable database (`test_*`, `*_parity`, `*_e2e`, `*_disposable`); the importer refuses anything else with `--disposable-only`.
- Report findings first. Make code changes only if the owner asks; if you do, keep each fix small, tested and in its own commit.

## How to run everything

```bash
npm ci
npm run typecheck                 # wrangler types + tsc -b
npm run build
npm run db:migrate:local          # migrations 0001–0006
npx vite preview --port 8788 --strictPort        # restart after every build
npx wrangler d1 execute DB --local --command "DELETE FROM rate_limits"
npm run test:unit                 # 109 tests
npm run test:integration          # 54 + 3 Worker↔Python parity (parity needs PY_API_URL and Django on a disposable DB)
npx playwright test               # 11 browser tests, installed Chrome
cd backend && .venv/Scripts/python -m pytest      # 53 tests; see backend/README.md
```

Claude's last results on `1e5c9c6`: unit 109/109, integration 54/54 (parity skipped in that run; 3/3 in the previous round), Playwright 11/11 twice, production smoke 39/39 with real Workers AI and Browser Run calls.

## What to review, feature by feature

Each row is something Claude exercised by hand in Chrome against the local build. "Covered by" lists the automated tests that already pin the behaviour; gaps are yours to judge.

| # | Feature (what was verified by hand) | Main code | Covered by | Look especially at |
|---|---|---|---|---|
| 1 | Home prompt hands the description (and optional "website you love") to sign-up and the new-site screen | `src/client/pages/Home.tsx`, `src/client/lib.tsx` (`startIntent`), `src/client/pages/Auth.tsx` | e2e homepage tests | Intent stored in `sessionStorage`; what survives a refresh or a second tab |
| 2 | Email sign-up, sign-in, sign-out, sessions, CSRF, rate limits | `src/worker/routes/auth.ts`, `src/worker/lib/auth.ts`, `lib/crypto.ts` | integration auth/CSRF tests | Session rotation, error messages, rate-limit keys |
| 3 | Google sign-in (not exercised live: no OAuth client yet) | `auth.ts` Google routes, `src/worker/lib/google-link.ts` | `tests/unit/google-link.test.ts` | Audit #7 fix (conflict refused); `access_denied` → `google_denied`; state/PKCE cookie handling |
| 4 | New site: type, address picker with availability, price line per type ($20/$30/$100 build, $3/$4/$5 hosting) | `src/client/app/App.tsx` (`NewProject`), `routes/projects.ts` (`slug-available`), `lib/site.ts` (`uniqueSlug`), `lib.tsx` (`hostingPrice`), `src/worker/index.ts` (`/api/config`), migration `0006` | integration address-picker and hosting tests, e2e | One source of truth for prices; client defaults vs server settings |
| 5 | Business and store wizards with autosave, checklist review | `src/client/app/Wizard.tsx`, `wizardSpecs.ts`, `components/forms.tsx`, `projects.ts` (intake) | e2e wizard flows | Spec-driven forms vs bespoke steps (`PaymentsStep`, `DeliveryStep`, `StyleStep`) |
| 6 | "Website you love" (RECOMMENDED): Browser Run analysis, progress, named matches, apply; auto-run when pasted on home | `Wizard.tsx` (`StyleStep`), `src/worker/lib/inspiration.ts`, `lib/ssrf.ts`, `projects.ts` (inspiration routes) | unit SSRF tests, smoke | Audit #8/#9 (private screenshot visibility, URL policy before navigation) are still open; auto-run effect in `StyleStep` |
| 7 | Generate with optional AI wording; sections marked for review | `src/shared/generate.ts`, `src/worker/lib/ai.ts`, `projects.ts` (generate) | unit generator tests, smoke | New 20 s AI budget in `aiJson`; failure accounting (audit: failures counted as usage) |
| 8 | Editor: sections, theme, **Light/Dark switch**, AI design request with rule fallback, undo/redo, checkpoints, history | `src/client/app/Editor.tsx`, `editorSpecs.ts`, `src/shared/refine.ts` (`switchMode`, `modeColors`, `applyPatch`), `projects.ts` (draft, refine, history) | e2e editor flow | Audit #4 (draft revision check not atomic) still open; Editor component size |
| 9 | Rendering: contrast guarantee, no doubled page/section headings | `src/shared/render/css.ts` (`themeVars`), `render/index.ts`, `src/shared/util.ts` (`ensureContrast`), `templates.ts` | `tests/unit/contrast.test.ts` (18 templates × light/dark), render tests | `--primary-ink` vs `--primary` usage is consistent across template CSS strings |
| 10 | Private preview links (watermark, noindex, 7 days) | `projects.ts` (preview-link), `lib/site.ts` (tokens), `routes/sites.ts` | integration preview tests | Audit #10: `SESSION_SECRET` fallback to `"dev-secret"` still open |
| 11 | Publish, versions, restore, unpublish, light/dark before publishing, ZIP download | `projects.ts` (publish, versions, export), `lib/zip.ts`, `App.tsx` (Publish page) | integration versions/rollback, e2e publish gate | Audit #6 (publication outlives revoked grant) still open; export memory and private media in ZIP |
| 12 | Contact form → leads inbox | `routes/public.ts` (forms), `App.tsx` (Leads) | integration leads tests | Anti-bot timing, consent storage |
| 13 | Products: variants, stock, edit ids (replay-safe), unique variant SKUs, strict prices (`19,95`), CSV import | `src/worker/routes/commerce.ts`, `src/client/app/Store.tsx`, `util.ts` (`parsePrice`), migrations `0004`/`0005` | `tests/integration/merchant-regressions.test.ts` (18), `tests/unit/money.test.ts` | `writeProduct` and the import handler are long and stateful; check every branch keeps stock relative and SKU-scoped |
| 14 | Storefront: shop, product with variant price, cart, checkout totals, order confirmation | `public.ts` (quote, orders), `src/shared/render/store.ts`, `render/runtime.ts`, `routes/sites.ts` | integration checkout/oversell tests, e2e demo purchase | Currency guard on quote/order/listing; idempotent order retry (release audit noted a wrong receipt on concurrent retry) |
| 15 | Merchant orders: confirm, paid, shipped, history, low stock, CSV export | `commerce.ts` (orders), `Store.tsx` (`OrdersManager`) | integration restock tests | Status-transition rules live in one place? |
| 16 | Admin: overview, demo grant/revoke, suspend, reset link, tickets, settings (per-type hosting), audit log | `src/worker/routes/admin.ts`, `src/client/app/Admin.tsx` | integration admin tests | Every admin write is audited; settings validation |
| 17 | In-app dialogs replacing `prompt()`/`confirm()` | `lib.tsx` (`AskDialog`, `ask`) | none (manual only) | Focus handling, Escape, double-submit; duplicated modal markup vs `components/ui.tsx` `Modal` |
| 18 | Billing (not exercised: Dodo unconfigured) | `routes/billing.ts`, webhooks, `lib/dodo.ts` | integration webhook tests | Audit #5 (stuck `received`, refund-before-payment, one entitlement per payment) still open |
| 19 | Python read path (local only) | `backend/`, `contracts/` | pytest 53, parity 3 | Snapshot authority guard; disposable-only importer |
| 20 | Smoke and ops scripts | `scripts/smoke-prod.mjs`, `scripts/make-showcase.mjs`, `scripts/make-admin.mjs` | — | Provider checks, cleanup-after-error, exact-id SQL |

## Integrity hotspots Claude measured (start here for "spaghetti")

- **Large route modules:** `routes/projects.ts` (533 lines) and `routes/commerce.ts` (497) mix HTTP parsing, validation, SQL and business rules. Inline SQL appears throughout; there is no data-access layer.
- **Dense client components:** `App.tsx`, `Editor.tsx`, `Store.tsx`, `Wizard.tsx`, `Admin.tsx` and `Home.tsx` each have 6–16 lines longer than 300 characters (up to 703), mostly JSX with async business logic inline in `onClick` handlers.
- **Duplication:** the zero-decimal currency list exists in `shared/util.ts`, `client/lib.tsx`, `shared/demo.ts`, `worker/seed.ts` and again inside `render/runtime.ts`. `AskDialog` re-implements `Modal` markup to avoid a circular import.
- **Loose typing:** `any` around products, variants and API responses in the client; Zod types exist server-side but aren't shared with the client.
- **Template CSS as strings** in `shared/templates.ts`; the primary/primary-ink rule depends on every string following the convention.

Judge whether these are acceptable for a small team or need restructuring before launch, and propose the smallest refactors that pay for themselves (for example a shared money/currency module, a commerce service layer, extracting handlers from JSX), each with the tests that protect it.

## Known open items (don't re-report as new; do confirm status)

- Production audit #4, #5, #6, #8, #9, #10 and the "additional defects" list; #1–#3 and #7 are fixed with tests.
- Paid launch stays on hold until webhook handling and access revocation are fixed.
- An intermittent e2e failure was traced to slow remote AI (39 s); the 20 s budget fixed it in two consecutive runs. Watch for recurrence.
- Production holds synthetic records from smoke runs; exact cleanup SQL per run is in `scripts/smoke-runs/` (local, gitignored). Cleaning production is an owner decision.

## Deliverable

Write `docs/integrity-review-1e5c9c6.md` containing:

1. A verdict per feature row above: **ready**, **ready with fixes** or **not ready**, with evidence (file:line, test name, command output).
2. Defects found, ranked by customer impact, each with a reproduction and an acceptance test.
3. Maintainability findings (spaghetti, duplication, coupling, typing), each with a concrete, minimal refactor proposal and the risk of leaving it.
4. Test gaps: behaviour Claude verified only by hand that has no automated test.
5. What you ran, with exact results, and anything you could not verify.

Keep the owner's rules in [AGENTS.md](../AGENTS.md) (truthful UI, locked prices, international positioning, premium imagery) in mind when judging UI code.
