# Architecture

```
Browser ──► Cloudflare Worker "imprintsites"
             ├─ static assets (React SPA: marketing + builder)     [assets binding, SPA fallback]
             ├─ /api/*        Hono API (auth, projects, commerce, billing, admin…)
             ├─ /s/:slug/*    published customer sites (server-rendered from site_versions)
             ├─ /preview/:id  private draft previews (owner session or signed token)
             └─ /media/:id    uploaded media (R2 or D1 BLOB fallback)
             bindings: D1 (DB) · Workers AI (AI) · Browser Run (BROWSER) · [R2 (MEDIA)]
```

## Core idea: SiteDoc
A customer site is a single JSON document (`src/shared/schema.ts`), validated with Zod. It contains:
- brand, SEO, contact details and store settings
- theme tokens: colours (`#rrggbb` only), font enums, radius, density, header and card styles, animation
- pages made of typed sections (21 kinds)

Every path produces a SiteDoc, and the renderer is the only thing that outputs HTML:
- the wizard → deterministic generator
- AI copy polish (strict JSON) → merged and re-validated
- the editor (manual edits)
- refine patches, from AI or the rule-based engine

## Rendering
`src/shared/render/` turns a SiteDoc, a template and a context into HTML:
- **Templates** (`src/shared/templates.ts`) combine default tokens, section layout variants, an art style and template-specific CSS. The 18 templates differ in structure (hero layouts, sidebar navigation, menu-style lists, masonry galleries, poster heroes and more), not just colour.
- **Images** are customer assets or self-generated SVG artwork, so no third-party stock imagery is used.
- **Storefront** pages (shop, filters, product, cart, checkout, order and policies) are rendered on the server. A small platform runtime script handles the cart and forms; it uses a nonce and never sets innerHTML from data.

## Data
D1 tables (`migrations/0001_initial.sql`): users and sessions, projects and their intake, drafts, versions and published sites, assets and blobs, generation and inspiration jobs, the catalogue, orders, billing and entitlements, leads and tickets, consents, audit logs, settings and rate limits. A trigger `trg_variant_no_oversell` aborts any batch that would push tracked stock below zero.

## Publishing (Stage 1)
Path-based URLs `/s/<slug>/`, with versions in `site_versions` and the live pointer in `published_sites.current_version_id`. Rollback just moves that pointer. Stage 2 (subdomains and custom domains) is described in `domain-publishing.md`.

## Scaling notes
- Rendering a page costs a few milliseconds of CPU, which is fine on Workers Paid. The next step is the Cache API for non-store pages, keyed by version ID.
- One D1 database (10 GB max) holds metadata for 10,000+ customers comfortably once media lives in R2. If needed later, shard heavy tenants or move orders to a separate database.
