# Claude handoff · ImprintSites AI

**20 November 2026. Start from commit `80b951b` on `main`.** The owner wants a production-grade SaaS with a Python backend and a clearly separated React frontend. This handoff completes the audit and proposes the implementation sequence for the next engineering pass. The deployed application currently runs on the TypeScript Worker. The Python service, PostgreSQL migration and changes to routing are proposed work.

Read the [production audit](production-audit.md) first. It contains 10 high-priority findings, 9 additional defects, source references and acceptance criteria. The [first-build handoff](../AGENTS.md), [deployment report](../DEPLOYMENT_REPORT.md) and [pricing decisions](../PRICING_AND_BILLING.md) supply product history. The first-build statement that there are no Git commits is historical. Successful smoke runs also predate this audit.

## Product behavior to preserve

- The customer selects personal, business or e-commerce, chooses an address, supplies content in a wizard and previews one of 18 templates. The homepage description currently seeds intake fields. An AI model call is optional at generation.
- The editor supports page and section edits, device previews, template switching, checkpoints and design refinement. Published sites have stable `/s/<slug>/` addresses, version history and rollback. Public links to media, signed previews and order receipts already exist.
- The builder charges a one-time USD 20, 30 or 100 for the respective site type. USD 4 per site per month is announced. Keep collection tied to explicit subscription consent and implemented cancellation. Storefront revenue belongs to each merchant, who currently records offline orders. Platform Dodo credentials are for the builder’s own fees.
- Preserve the neutral marketing design, licensed photography, demo labels, independently editable customer content and original template designs. Template and style references must respect their existing rights and attribution. The language migration is independent of a visual redesign.
- Production configuration read during the audit reported healthy D1, AI available, Browser Run bound, Dodo unconfigured in test mode, and email and Google sign-in disabled. Custom domains and merchant card processing remain future features. No production data was changed during the audit.

## Target stack and deployment boundaries

Use **one repository, two independently buildable applications**, and retain the existing renderer as a compatibility component during migration. Django with PostgreSQL is the recommended Python stack. The deciding requirements are transactions across stock and orders, payment event reconciliation, relational migrations and access control. The hosting provider, service size and optional queue infrastructure are open decisions. Staging can exercise the stack before buying services.

| Target | Owns | Integration |
|---|---|---|
| `frontend/` · React, TypeScript, Vite | Marketing, authentication screens, wizard, editor, store manager and admin UI | Calls the backend over HTTP. Consume a generated OpenAPI client and a versioned SiteDoc schema. Fetch canonical prices and capability flags from the backend. Build and test independently. |
| `backend/` · Python, Django, Django REST Framework, PostgreSQL | Authentication, authorization, billing, projects, draft concurrency, storefront orders, inventory, media access, audit and AI provider calls | Expose the current browser API during migration. Keep provider tokens server-side. Define repeatable migrations, test fixtures, readiness checks and a local run command. |
| `renderer/` · existing TypeScript renderer | SiteDoc → accessible public HTML, existing templates, previews and export rendering | Consume versioned documents and scoped data through an internal interface. Python owns who may read drafts or order data. Keep the current Worker as the front door while routes move. |
| `contracts/` | OpenAPI, SiteDoc JSON Schema, versioned representative documents and expected responses | Validate a shared fixture corpus in Python and TypeScript. Test clients and renderer against published versions before advancing the schema. |

A single public origin can front several deployments. Route the SPA and API separately behind that origin to preserve the current same-origin cookies and CSRF behavior. Keep private preview authorization and per-response CSP for the renderer. Use a small routing change to select the serving implementation for a migrated endpoint. This also keeps existing customer bookmarks valid. [Browser API client](../src/client/lib.tsx#L8) · [Worker routes](../src/worker/index.ts) · [Renderer](../src/shared/render/index.ts)

### AI in Python

The current provider is Cloudflare Workers AI. Python can call its REST API with a service credential. Keep the model configurable and support the existing structured copy and refinement contracts first. Preserve generation with AI disabled. Distinguish a provider returning valid output, invalid output and a rules-based fallback in tests and metrics. Record request ID, model, duration, attempts, usage and status; keep customer text out of logs. Reserve quotas atomically and define whether failures consume the customer allowance. [Current adapter](../src/worker/lib/ai.ts) · [Cloudflare REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)

If the owner intends a one-prompt builder, the missing product capability is **site planning**. Propose a model output containing the site type, requested pages, allowed sections, supplied facts and unanswered questions. Validate it, let the customer correct it and pass the result to the existing renderer. Keep this as an explicit product milestone. Migrating the existing copy editor to Python alone will preserve today’s wizard experience.

## Migration sequence

1. **Protect current customers and establish a reproducible baseline.** Generate the Worker declaration before typechecking. Restore a trackable sanitized environment example and a clean CI build. Add regression coverage for mixed store currencies, destructive CSV updates and stale stock overwrites. Repair those paths at the current writer if customers remain on it. Use the audit’s acceptance criteria to track the other defects.
2. **Deliver a working Python read path.** Establish separate frontend and backend commands and dependency locks. Implement health/readiness, a public configuration endpoint and an authenticated project read against synthetic PostgreSQL data. Define response shapes and error semantics, and exercise them through the existing React UI. Use independent build jobs for the SPA, Python and renderer. This milestone should demonstrate that the local UI can load a project from Python.
3. **Port identity, projects and editing.** Migrate owner/member permissions, sessions, consent, draft revision checks, checkpoints and version publication. Use an atomic compare-and-set for draft updates. Add AI copy and refinement behind provider adapters, with explicit timeouts, attempt accounting and observed fallback behavior. Compare saved documents and rendered output against the existing templates.
4. **Port commerce and billing as distinct domains.** In PostgreSQL, commit orders, order lines, stock movements and receipts as a transaction. Preserve minor currency units and stable variant IDs. Persist Dodo delivery state and enforce one entitlement per payment. Test interrupted and out-of-order deliveries in a sandbox before enabling checkout. Implement merchant card processing and monthly subscriptions as independently scoped features.
5. **Rehearse migration and cut over by domain.** Build a repeatable D1-to-PostgreSQL importer, compare data invariants, test restore, and switch a domain only after parity checks. Keep one writer per domain. Document how to handle writes received after cutover before routing that domain back. Once the last writer has moved, retire the corresponding Worker routes and D1 access.

## Porting details that affect customer data

| Concern | Required behavior |
|---|---|
| Accounts and sessions | Preserve string IDs, verified flags, admin grants and expirations. Legacy password hashes use normalized input and a base64-encoded binary salt. Verify against synthetic legacy fixtures before choosing a compatibility hasher and rehash strategy. Keep private links and sessions compatible or plan explicit expiry. [Crypto](../src/worker/lib/crypto.ts) · [Sessions](../src/worker/lib/auth.ts) |
| Documents and assets | Preserve draft revisions, current published version, slug, referenced assets and media visibility. D1 uploads are chunked BLOBs keyed by storage key. Validate byte counts and hashes during migration. Preserve CSP behavior, signed preview expiry, and the public/private distinction in exported ZIPs. [Data model](../migrations/0001_initial.sql) · [Storage](../src/worker/lib/storage.ts) |
| Store data | Preserve product and variant IDs, integer prices, currency, order numbers per project, item snapshots, checkout consent and stock movements. Treat any product/store currency mismatch as an exception for review. A conversion requires knowing the merchant’s intended currency. |
| Money and publication | Preserve provider payment IDs, delivery IDs, test/live separation, grants, revocations and refund state. Test publication through both the public page and the public purchase/lead endpoints. Preserve merchant revenue segregation. |
| Public interfaces | Preserve `/api/*`, `/s/*`, `/preview/*` and `/media/*` during cutover. The React client expects same-origin credentials, the custom request header, status codes, and JSON error/code fields. External exports rely on cross-origin public APIs and absolute receipt destinations. |

## Verification and release evidence

The audit ran **59 unit tests, 36 API integration tests and 11 Chrome browser tests**, all passing locally. After generating Worker declarations, both bundles built and all three D1 migrations applied. The initial clean build failed without that generation step. The isolated suite used no live AI, payment, email or browser bindings. npm reported no known dependency advisories. See the audit for separately reproduced merchant defects.

On the existing stack, generate declarations with `npx wrangler types`, build, migrate an isolated local D1, start the local preview, then run `npm run test:unit`, `npm run test:integration` and `npm run test:e2e`. The last two need a running HTTP server. Set `TEST_BASE_URL` to the local instance. Use test-only provider bindings when testing integrations. The current integration suite clears its local rate-limit table, creates accounts and grants an admin role. Production smoke and browser suites write real records, and the historical cleanup script uses broad matching. Use isolated staging for destructive workflows.

For the split release, add PostgreSQL-backed concurrency tests and frontend-to-Python contract tests. Verify a complete non-USD purchase, a stale merchant inventory edit after a sale, CSV re-import, simultaneous draft saves, interrupted webhook delivery, grant revocation, private media and a ZIP hosted on a second origin. Restore a staging backup and compare record counts, monetary totals by currency, published-version pointers and asset checksums. Verify the provider sandbox separately from fallback tests.

**First Claude deliverable:** a reviewable local change demonstrating independent frontend and backend startup, a project read served by Python, the regression suite for the two reproduced merchant failures, and documented commands to reproduce results. Bring hosting, paid service activation, live charges and production data changes to the owner as separate decisions. The current handoff authorizes design documentation only; implementation belongs to the owner’s next instruction.

