# Release review of commit 6a1cc2c

20 November 2026. **Keep paid launch on hold.** The previous three merchant scenarios pass. Four additional merchant scenarios fail, including a stock change after a successful sale and a 100-fold pricing error. These affect the Worker that serves stores today, independently of the Python migration.

## Merchant findings verified on a local Worker

I exercised the HTTP API using a synthetic merchant and shopper, the built Worker and a fresh local D1 database with migrations 0001–0004. The Worker source maps matched the audited source files. Each scenario below also produced the same result against an in-memory SQLite harness.

| Priority | Observed behavior | Fix and regression criterion |
|---|---|---|
| P1 | **Replaying a save that adds a variant can undo a sale.** An editor added a green scarf variant with seven units. A shopper bought two. Replaying the identical save brought stock from five back to seven and assigned the variant a different ID. The order still references the original ID. The edit ID covers adjustments to existing variants, while new entries receive a fresh ID on each request and the previous entries are deleted. | Make creating variants part of the idempotent edit. Replaying the save after a sale must preserve the variant ID, five remaining units and the order reference. Test cancellation against that same variant. [Variant insertion and removal](../src/worker/routes/commerce.ts#L177) |
| P1 | **A decimal comma can multiply a EUR price by 100.** A CSV row with the price field `19,95` imported successfully as 199,500 euro cents (€1,995.00). The product editor's price helper also removes commas. This matters immediately for the Paris storefront positioning. | Use one validated conversion rule for CSV, manual entry and fees. Either support an explicitly selected numeric format or reject an ambiguous value before saving. Cover 19.95, 19,95, thousands separators, invalid input and zero-decimal currencies. [CSV conversion](../src/worker/routes/commerce.ts#L253) · [Editor conversion](../src/client/lib.tsx#L84) |
| P1 | **A variant-SKU price update changes a sibling’s selling price.** Red had an €11 override. Blue inherited the €10 product price. Importing €22 using Red’s unique SKU left Red at €11 and changed Blue to €22, confirmed by the public cart quote. The import selects the target for stock but assigns the imported price to the product. | Define the scope of price updates for product versus variant SKUs. A row addressing Red must update Red alone, or be rejected with a clear explanation. Assert both sibling prices through the cart quote. [Import mapping](../src/worker/routes/commerce.ts#L311) |
| P1 | **Duplicate variant SKUs silently select the first match.** The catalog accepted two colors with the same SKU. A stock import using that SKU reported zero failures and changed stock from 2/4 to 9/4. The corrected size/color ambiguity check only runs after SKU lookup. | Require the row to identify exactly one target across supported SKU types. Reject ambiguous legacy rows. Check existing duplicates before enforcing uniqueness on new records. [SKU lookup](../src/worker/routes/commerce.ts#L278) · [Catalog schema](../migrations/0001_initial.sql#L294) |

The earlier fixes did hold for an explicit currency mismatch on a live store, an identical retry changing only an existing variant, and an ambiguous size without a color. The API integration suite also checked excluded mixed-currency products, refusal at checkout and the post-sale stock count for an existing variant. Preserve these tests alongside the new cases.

## Release operations and Python

- **Smoke cleanup still depends on reaching the last lines.** Commit 6a1cc2c retries connection-establishment timeouts. Other network errors still escape, and the CSRF probe calls fetch directly. Even on success, the final cleanup soft-deletes only the project. The account and demo order remain. Record exact synthetic IDs per run, perform best-effort cleanup after errors and reconcile interrupted runs by ID. The existing broad cleanup SQL also leaves separately recorded contacts and checkout consents for deleted demo orders. This audit did not run it or count production records. [Retry](../scripts/smoke-prod.mjs#L21) · [Cleanup](../scripts/smoke-prod.mjs#L89) · [Cleanup SQL](../scripts/cleanup-test-data.sql#L11)
- **A green smoke summary cannot certify provider execution.** Copy generation, refinement and inspiration each check HTTP 200. The script prints the engine or method, but a successful fallback passes the same check. Keep fallback coverage, and assert actual provider use in a separately identified provider test. The operator’s report of real calls is distinct from what the pass count establishes. [Smoke assertions](../scripts/smoke-prod.mjs#L62)
- **Python private reads default closed outside debug.** I confirmed a project read with the snapshot flag disabled returned 503. An explicit `ALLOW_SNAPSHOT_READS=1` still overrides the non-debug default. If local-only use is a deployment invariant, enforce it in startup validation before exposing Django. The parity and routing suites now request disposable-only imports. The name predicate rejects `neondb` and accepts `imprintsites_parity` and other matching names. Its protection depends on the configured database name. [Python settings](../backend/config/settings.py#L128) · [Project guard](../backend/imprint/views.py#L149) · [Importer guard](../backend/imprint/management/commands/import_d1.py#L73)
- **Original findings 4–10 remain open in the reviewed source.** These cover draft revision races, interrupted/out-of-order webhooks, serving a site after its last grant is revoked, Google account linking, private inspiration media, outbound Browser Run checks, and fallback signing keys. Drafts, publication and media are relevant to the current service. Billing and Google require separate verification before activation. [Original audit](production-audit.md)

## Public deployment checks

GitHub main and the local checkout resolved to `6a1cc2c8d393603450cf267158328b28eaa8969a`. The live homepage referenced the same JS asset name as the local build. Health returned 200. Public configuration reported Workers AI available, Browser Run bound, Dodo unconfigured in test mode and USD 4/month hosting announced. The Paris Maison Nia shop served euro prices. A read-only Chrome session confirmed all three portfolio cards on home and Examples, with desktop and mobile image elements and new-tab links. It also confirmed the revised privacy wording. The privacy review covered the wording displayed on the page. [Health](https://imprintsites.omodingisaac123.workers.dev/healthz) · [Configuration](https://imprintsites.omodingisaac123.workers.dev/api/config) · [Demo shop](https://imprintsites.omodingisaac123.workers.dev/s/demo-store/shop) · [Examples](https://imprintsites.omodingisaac123.workers.dev/examples)

## Test evidence

| Check | This audit |
|---|---|
| Unit | 64 passed. |
| Worker integration | 49 passed. Three Worker-to-Python parity cases skipped because the hosted parity database was outside this run. |
| Chrome end-to-end | 11 passed. One Python-routing case skipped for the same reason. |
| Django backend | 32 passed. Twenty PostgreSQL-dependent cases skipped. The operator reported a separate full run. |
| Additional merchant scenarios | All four defects above reproduced through the local Worker HTTP API. |
| Production smoke | Public reads independently checked. The reported 36-check run and real provider calls were not repeated. |

All four migrations applied to an empty local database. Production verification used public reads only. No credentials, hosted database imports, production cleanup, paid inference or deployment were required for this review. A production migration ledger and current production record counts were outside the evidence collected.

