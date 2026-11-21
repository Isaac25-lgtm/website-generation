# Codex handoff: verify the fixes to your 1e5c9c6 review, plus new options

**21 November 2026 · review commit `db3d932` on `main`** (live Worker version `6d1d5221`).

Your [integrity review of 1e5c9c6](integrity-review-1e5c9c6.md) found four P1 and four P2 defects. Claude has fixed them, closed audit items #4, #6 and #10, and added the features listed below. The owner wants an independent check that each fix meets your own acceptance test, and that the new code is production quality rather than spaghetti code. The commits since your review are `113d069`, `c54bd3b`, `090fa3a`, `62e2aad` and `db3d932`: 34 files, +744/−159.

## Ground rules (unchanged)

- **Review only; don't redeploy.** No `wrangler deploy`, no remote migrations and no production writes. Against production, use public reads only.
- **Run anything that writes locally:** `npx vite preview --port 8788 --strictPort` against local D1. Clear `rate_limits` before each run, and restart the preview after every build.
- **Never print or commit secrets:** `.dev.vars`, `backend/.env` and `scripts/smoke-runs/`.
- **Python suites run only against a disposable database.** This round didn't touch `backend/`; only `contracts/sitedoc.schema.json` gained two optional fields.
- **Report findings first.** Make fixes only if the owner asks, each small, tested and committed separately.

## How to run

```bash
npm ci && npm run typecheck && npm run build
npm run db:migrate:local
npx vite preview --port 8788 --strictPort        # restart after every build
npx wrangler d1 execute DB --local --command "DELETE FROM rate_limits"
npm run test:unit            # 117
npm run test:integration     # 61 (+3 parity skipped without PY_API_URL)
npx playwright test          # 11 (+1 Python-routing test skipped)
```

Claude's results on `db3d932`:

- unit 117/117
- integration 61/61
- Playwright 11/11, in every run this round
- production smoke 39/39, with real Workers AI and Browser Run calls

The Python parity and pytest suites were not run because the backend didn't change.

## 1. Verify each fix against your acceptance test

| Your finding | What changed | Code | Tests to examine |
|---|---|---|---|
| P1 checkout total differs from the quote | The checkout sends `expectedTotalMinor` (subtotal plus chosen shipping). A mismatch returns 409 `price_changed` with a revised quote and creates no order or stock movement. The runtime shows the new total, and a second submit accepts it. | `src/worker/routes/public.ts` (OrderBody, after `total`), `src/shared/render/runtime.ts` (`OV`, `price_changed`) | `merchant-regressions`: price change between quote and order |
| P1 older form deletes another editor's variant | The form sends explicit `removeVariantIds` (present when the form opened, absent now). The server deletes only those IDs. | `src/worker/routes/commerce.ts` (`ProductIn.removeVariantIds`, `removable`), `src/client/app/Store.tsx` | `merchant-regressions`: two editors; intentional deletion |
| P1 CSV retry restores sold units | Each import has an `importId`, which gives every row an edit-scoped ID (`imp-<id>-<row>`) and op key. `setOnce` writes an absolute stock-set movement only once per variant and op key. New products get `editScopedId` so a retry updates them instead of duplicating them. | `commerce.ts` (import route, `setOnce`), `Store.tsx` (`CsvImport` `useMemo` `importId`) | `merchant-regressions`: import retry |
| P1 cancel restocks units never deducted | Order debits are written only when `changes() = 1`. Cancelling restocks `-SUM(delta)` over the order's `order` and `order_cancel` rows per variant, so the net is reversed once. Order PATCH also guards on the current `status` and `payment_status`. | `public.ts` (debit insert), `commerce.ts` (order PATCH) | `merchant-regressions`: untracked cancel; tracked then untracked |
| P2 inspiration URL carries into a new project | The intent is used only for `?from=prompt` and expires after 6 hours. It is cleared after a successful create. `StyleStep` no longer reads `sessionStorage`. The analysed brief is saved to the project's answers so a remount doesn't re-run it, and auto-run is guarded by a ref. | `src/client/app/App.tsx` (`NewProject`), `src/client/app/Wizard.tsx` (`StyleStep`) | **No automated test.** Please judge whether one is needed. |
| P2 edit lost on immediate reload | Saves are queued in order and each sends the newest answers. The UI shows "Unsaved changes…". Unsent edits are flushed on `pagehide` with `fetch keepalive` (CSRF header included), and `beforeunload` warns. `go()` stays on the step if the save fails. | `Wizard.tsx` (`save`, `update`, `go`) | e2e builder flow asserts the saving states. **No test for delayed or failed saves.** |
| P2 invalid address silently replaced | Continue requires `slugState.available === true`. The exact slug is always sent (the server answers 409 if it is taken). Stale availability responses are dropped using a sequence ref. | `App.tsx` (`checkSeq`, create payload) | e2e: a taken address disables Continue. **No test for delayed responses.** |
| P2 dialog focus escapes; duplicate `insp` id | A shared `useFocusTrap` hook in `lib.tsx` (Tab and Shift+Tab cycle, Escape closes, focus is restored) is used by `AskDialog` and the `Modal` in `ui.tsx`. `AskDialog` resolves once through a `settled` ref. The home input is now `insp-url`. | `src/client/lib.tsx`, `src/client/components/ui.tsx`, `src/client/pages/Home.tsx` | e2e: Tab ×6 stays inside, Escape returns focus to the trigger |

**Earlier audit items now closed:**

- **#4 draft race.** `saveDraft` is a compare-and-set: `UPDATE … WHERE id = ? AND draft_revision = ?`. The checkpoint is inserted `WHERE changes() = 1` in the same batch. A loser gets a 409 conflict. The page/block index rebuild still runs in later, chunked batches. Please judge whether that non-atomic index, which is used for reporting only, is acceptable.
  - Code: `src/worker/lib/site.ts`
  - Test: `api.test.ts`, "two editors saving the same revision"
- **#6 revocation.** `withdrawIfUnentitled` unpublishes a non-demo site when no entitlement remains valid for the current payments mode. Both the admin demo revoke and the refund webhook call it.
  - Code: `site.ts`, `routes/admin.ts`, `routes/billing.ts`
  - Test: `api.test.ts`, "revoking the only demo grant…". It checks that the live page, the forms and republishing all fail.
  - There is no serve-time entitlement check; the published status is the single gate. Please confirm that's sufficient.
- **#10 signing key.** `signingSecret()` throws a 503 when `APP_ENV === "production"` and `SESSION_SECRET` is missing. Production has the secret; Claude checked the name only.
  - Code: `site.ts`
  - **No unit test.**

**Still open; please confirm their status, don't re-report them:** billing #5, inspiration media #8, outbound navigation #9, and the "additional release defects" in your report. Paid launch stays on hold until #5 is fixed.

## 2. Review the new owner-requested features

| Feature | Code | Covered by | Look especially at |
|---|---|---|---|
| **Floating WhatsApp button (option).** A tick box in all three wizards and in editor Site settings. It renders a labelled green "WhatsApp" pill in the bottom-right corner, raised above the preview ribbon. New sites are opt-in; older docs without the field keep the old rule (on for personal/business with a number, off for stores). | `src/shared/schema.ts` (`contact.whatsappFloat` optional), `src/shared/util.ts` (`whatsappFloatOn`), `render/index.ts`, `render/css.ts`, `generate.ts`, `wizardSpecs.ts`, `editorSpecs.ts`, `Editor.tsx` (Site settings passes the effective value) | `tests/unit/render.test.ts` "floating WhatsApp button" (4) | The editor writes an explicit value the first time any site setting changes, so stored docs stay equal to their parsed form (contracts test). Also check whether the pill covers sticky store controls on small screens. |
| **Logo (option).** Upload in all three wizards (personal is new), with clearer guidance. "Show only the logo in the header" hides the name visually but keeps it for screen readers. The logo also serves as the browser-tab icon. | `schema.ts` (`brand.logoOnly`), `generate.ts`, `render/index.ts` (brand, `<link rel="icon">`), `render/css.ts`, `wizardSpecs.ts`, `editorSpecs.ts` | `render.test.ts` "logo" (4) | `logoOnly` is ignored without a logo. The favicon points at `/media/<id>`, so check that it works for private or unpublished assets and in the ZIP export. |
| **Mobile hero.** On phones the rotating photo fills the hero behind the copy (owner reference: motionimprints.tech) with a lighter shade, a shorter subheading and a short prompt placeholder. | `src/client/styles.css` (last 640px block), `Home.tsx` (`lede-short`, `narrow`) | e2e homepage mobile + axe | Contrast of white text over the lighter shade (axe colour-contrast is disabled in e2e). Note the photos are 960px wide, so they're soft on phones. |
| **Examples on the landing page only.** "Made with ImprintSites" is now a non-link picture wall (`figure`/`figcaption`). The Examples page, nav item, footer link and sitemap entry are removed; `/examples` redirects to `/#made`. The website-type cards no longer link into demo sites and show the build price with a Start button. | `Home.tsx`, `ui.tsx`, `main.tsx`, `pages/Marketing.tsx` (Examples removed), `src/worker/index.ts` (sitemap) | e2e "template gallery and examples" asserts the redirect and zero showcase links | `/api/examples` and `PUBLIC_DEMOS` remain for seeding and the config. Is anything now dead code? Demo sites are still reachable by direct URL; that's intended. |

## 3. Code-integrity questions specific to this round

- `Wizard.tsx` now holds a save queue, a `pagehide`/`beforeunload` flush, and step-navigation rules inline. Should these move to a small `useAutosave` hook with its own test?
- `commerce.ts` `writeProduct` gained `setOnce` next to `applyOnce`. Is the relative versus absolute stock logic readable and correct on every branch: new variant, replayed new, existing with `stockSet`, existing with `stockBase`?
- `site.ts` now mixes token signing, entitlement and withdrawal, and draft persistence. Propose the smallest split that pays for itself.
- `whatsappFloatOn` encodes a legacy default. Is an optional field plus a read-time default the right trade-off, versus a stored-doc migration bumping `schemaVersion`? The owner's rule is that Python serves stored drafts as-is.
- Check for duplicated logic introduced this round: focus handling, price formatting, the narrow-screen media query in both CSS and JS.

## Deliverable

Write `docs/integrity-review-db3d932.md` with these sections:

1. For each of your eight findings and audit items #4, #6 and #10: **closed**, **partly closed** or **not closed**, with evidence (test name, command output or file:line).
2. Verdicts on the four new features: **ready**, **ready with fixes** or **not ready**.
3. Any new defects, ranked by customer impact, each with a reproduction and an acceptance test.
4. Maintainability findings with minimal refactor proposals.
5. Test gaps, in particular those marked **No automated test** above.
6. What you ran, with exact results, and anything you could not verify.

Keep the owner's rules in [AGENTS.md](../AGENTS.md) in mind: truthful UI, locked prices, $3/$4/$5 hosting, international positioning, premium imagery.
