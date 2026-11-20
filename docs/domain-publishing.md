# Domain publishing

## Stage 1 (live now)
Each customer site is published at `https://imprintsites.omodingisaac123.workers.dev/s/<slug>/`.
- Slugs are unique, editable in the Publish page, and reserved words are blocked.
- Unpublish, suspend and rollback are supported.
- Sites survive redeploys because they're stored in D1, not in build output.

We do **not** promise per-customer `*.workers.dev` subdomains, because Cloudflare doesn't issue arbitrary wildcard subdomains under workers.dev.

## Stage 2 (not yet built; needs an owned zone and approval)
1. **Platform subdomains:**
   - Add an owned zone to Cloudflare, for example `imprintsites.app`.
   - Add a wildcard DNS record `*.imprintsites.app` and a Worker route `*.imprintsites.app/*`.
   - Resolve tenants by `Host` header, using the `domains` table with `kind='platform_subdomain'`.
   - Universal SSL covers first-level wildcards.
2. **Customer custom domains** via Cloudflare for SaaS:
   - Enable Custom Hostnames on the SaaS zone, with a fallback origin pointing at the Worker.
   - Create a custom hostname via the API when a customer adds a domain.
   - Show them the required CNAME (to the fallback origin) and the TXT/HTTP validation records.
   - Poll `ssl.status` and `status`, and mark the `domains` row `active` **only** when both are active.
   - Pricing: 100 hostnames included, then $0.10/hostname/month (verified 2026-11-20).
3. Serving customer sites from a separate domain also isolates them from the builder's session origin (see SECURITY_NOTES).

The UI today collects interest (`domains.status = 'not_available'`) and states clearly that custom domains aren't available yet. Domain registration and renewal costs belong to the customer and their registrar.
