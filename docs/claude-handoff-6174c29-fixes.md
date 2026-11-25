# Claude handoff for the fixes after 6174c29

**Release status on 25 November 2026.** The fixes reviewed here are committed in [528c02f](https://github.com/Isaac25-lgtm/website-generation/commit/528c02f). A direct Git lookup confirmed that GitHub `main` had advanced to [8ed61fb](https://github.com/Isaac25-lgtm/website-generation/commit/8ed61fb), which includes those fixes and subsequent assistant and onboarding changes. The [deployment report](../DEPLOYMENT_REPORT.md) records production migrations 0007 and 0008, assistant activation and 39 passing smoke checks for release `b1ec1c98`. A read-only check of the public homepage found the current frontend entry. Its SHA-256 digest and the digests of both historical stock images matched the local 8ed61fb build. The deployment report supplies the migration and smoke-test results. All test suites below ran locally.

Start with the [verification of 6174c29](integrity-verification-6174c29.md) for the observed failures, then use the table below to review their fixes. The [19-finding audit](integrity-review-5a23f67.md) uses the original numbering.

## Changes to review

| Area | Change and evidence |
|---|---|
| Admin Settings | The form submits only edited fields. The internal template-registry fingerprint no longer breaks unrelated saves. An admin can edit the daily assistant token allowance. A browser test checks the PUT payload. A separate signed-in browser check saved zero, read it back from local D1 and restored the local setting. |
| Assistant token accounting (#5) | Each provider call has a unique reservation tied to its UTC start day. Admission is atomic in SQLite and settlement is idempotent. The allowance covers the serialized input in UTF-8, message framing and the output limit. Ambiguous provider failures retain the allowance. A definite rejection releases it. A scheduled job accounts for old abandoned reservations. Regression tests cover concurrent admissions, midnight rollover, repeated settlement and an unknown provider outcome. The request reader also enforces the byte limit while streaming. This is a token limit. A currency-denominated spend guarantee would require a provider-enforced billing limit or a verified pricing contract for every allowed model. |
| Assistant privacy and hosting facts (#8, #10) | Logout clears unsent text, busy state and status. Replies from a previous conversation cannot reset a new request. The Playwright logout flow checks the unsent input. The browser and assistant now use the same hosting defaults and distinguish unannounced, announced and active fees. Marking a fee active does not collect recurring payments. |
| Member previews (#1) | Full member previews and their sign-in gate use `private, no-store`. The public gallery can still show the reduced home thumbnail. The integration suite checks authenticated response headers. A browser that cached the old release may retain a copy for the remainder of its former ten-minute lifetime. |
| Customer and owner photos (#2) | The Worker cleans historical structured draft and intake reads, project copies, and product-management images. The Python reader follows the same rules, including nested image fallbacks. The guard preserves usable customer assets. Historical database records are handled when read, so the change requires no content backfill. |
| Old stock-image URLs | Two retired image paths serve credited, brand-free replacement photos for existing sites and exports. Both now return WebP data and the correct content type in integration tests. Include both image files and the credits when staging. |
| Reference names (#15) | The fingerprint test now also checks template display names, complete stable IDs, source/asset/document filenames and web host labels in the scanned content. Three gallery names changed to Drape Study, First Letters and Stone Outline. Stored template IDs remain valid. Exceptions in the test cover the first-party deployment host and three unrelated generic filenames. The supplied fingerprints cover the known inventory. The private reference list and untracked external archives were unavailable for an independent historical comparison. |
| Initial JavaScript (#18) | The publish screen loads its mode-switching code on demand. The production entry fell from 565,657 to 471,500 bytes (141.47 kB gzipped). In the build of the fixes, the template definitions are in a separate 120.59 kB chunk, and the landing page has no JavaScript module preload for it. Check the emitted HTML and entry when changing imports in the publishing UI. |

## Local verification of the fixes in 528c02f

| Check | Observed result |
|---|---|
| Production build | `npm run build` passed, including Wrangler type generation and TypeScript compilation. |
| Unit tests | 2,387 passed in nine repository test files. The copy also contained two audit-only experiment files, excluded with `npx vitest run --exclude '**/local-*.test.ts'`. |
| Worker API and cross-backend comparisons | 64 Worker integration tests passed against local D1. All three Python comparison tests then passed with Django and the Worker configured to use the same public base URL. |
| Python backend | 335 tests passed with `python -m pytest -o addopts= -q` on disposable loopback PostgreSQL 16, including the database-backed cases. |
| Browser | 15 application tests passed with `npx playwright test tests/e2e/app.spec.ts`. The separate Python routing browser test also passed. Chrome loaded the editor and its iframe through the migrated project-read route. |
| Template widths | A signed-in Chrome traversal measured all 299 demo homes at 320, 390 and 768 px. All 897 fit the viewport with external fonts blocked. This measures horizontal overflow. |
| Database | Local D1 had migration 0007 and successfully applied 0008. The Django checks imported synthetic data into a temporary local database. Tests used simulated provider outcomes. |

Use the repository scripts in `package.json` and [backend setup](../backend/README.md) to repeat the checks. For parity, start the Worker without `PY_API` and set `PY_API_URL` in the integration runner. For the Python editor test, start the preview with `PY_API` pointing at Django and set it in the browser runner too. Both require a disposable PostgreSQL database and local D1. The isolated test copy used the existing Python virtual environment by absolute path.

## Review of subsequent main

The production build for `8ed61fb` passed. The initial entry measures 492,193 bytes (148.93 kB gzipped). The newer onboarding and assistant UI increased its size, and the 120.59 kB template chunk still loads separately. All 2,389 unit tests passed. All 64 Worker integration tests and all 15 Chrome application tests passed. The first Chrome run passed 14 of 15 and hit the signup rate limit before the last test. The full suite passed after clearing only the signup counters in disposable local D1. Run the suites against isolated local data when repeating them in the same hour. The Python source and parity test are identical between `528c02f` and `8ed61fb`.

## Next steps for Claude

1. Start from `8ed61fb` or a verified descendant. The code, both compatibility images, the audit report and the reservation migration are already in Git. This handoff and the pointer in `AGENTS.md` are the remaining documentation changes.
2. Use the recorded deployment and migration history when planning any release. The documented production release already includes 0007 and 0008. The live frontend asset matched 8ed61fb. Use the Cloudflare deployment history if the exact Worker revision is needed.
3. For future releases, verify the admin budget pause and restore on staging. Use the public homepage, gallery thumbnail, member gate and legacy image URLs for read-only checks. Production smoke runs create records and can invoke paid services. Coordinate those runs and cleanup with the owner.
4. The older paid-launch hold for billing webhooks remains open. The reference-screenshot privacy and link-handling findings also require follow-up. Python remains a local read-path migration until live session and permission checks support routing real traffic.
