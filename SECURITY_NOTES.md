# Security notes

## Trust boundaries
1. **Browser ↔ Worker API:** cookie session (`is_session`: HttpOnly, Secure, SameSite=Lax, 30 days; only its SHA-256 is stored in D1).
2. **Public visitors ↔ published sites and public APIs** (`/s/*`, `/api/public/*`): no cookies are used. CORS `*` applies only to these endpoints.
3. **Worker ↔ external services:** Dodo, Google OAuth, Openverse, user-supplied inspiration URLs, Workers AI and Browser Run.
4. **Admin:** the `role='admin'` database flag, or a Google-**verified** email listed in the `ADMIN_EMAILS` secret. A client cannot claim admin.

## Controls
- **Tenant isolation:** every project-scoped query goes through `ownedProject()` (owner or member). Cross-tenant access returns 404, so existence isn't leaked. Product images and categories are checked to belong to the same project. This is covered by integration tests.
- **CSRF:** every state-changing `/api/*` request needs an `x-requested-with` header, plus an Origin check for cookie-authenticated routes. Webhooks are exempt but signature-verified.
- **XSS:**
  - All user content is escaped by the renderer (`esc()`), and links pass an allow-list (`safeHref`).
  - No user or AI HTML or JS is ever emitted. The only script is the platform runtime, loaded with a **per-request CSP nonce**.
  - Published sites get a strict CSP (`script-src 'nonce-…'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, `frame-ancestors 'self'`).
  - The SiteDoc schema restricts colours to `#rrggbb`, fonts to an enum, and video IDs to a strict pattern.
- **Uploads:**
  - The file type is sniffed from magic bytes (JPEG, PNG, WebP, GIF, PDF only). **SVG and HTML are rejected.**
  - Size caps (8 MB images, 10 MB PDF, 6 MB while on D1) and per-project quotas apply. Storage keys are generated server-side.
  - Media is served with `nosniff`, a sandbox CSP and a `content-disposition` header.
  - Assets used by the live site can't be deleted.
- **SSRF:** inspiration and image imports are validated as follows.
  - Allowed: http(s) only, with no credentials or custom ports.
  - Blocked: private, loopback, link-local, metadata and CGNAT addresses, IPv4-mapped IPv6, numeric or hex hosts, single-label and `.local` names.
  - DNS answers are checked over DoH.
  - Redirects are followed manually and re-validated, with timeouts and byte caps. robots.txt is respected.
- **Passwords and brute force:**
  - Passwords use PBKDF2-SHA256 (100k iterations, 16-byte salt) with constant-time comparison. Unknown emails still pay the hashing cost.
  - Login is rate-limited per IP and per email.
  - Linking Google to an unverified password account clears that password and its sessions, to prevent account pre-hijacking.
- **Payments:**
  - Webhook signatures are verified with a timestamp tolerance, and deliveries are idempotent by `webhook-id`.
  - Amounts are re-checked against the provider API and the server-side price. A redirect never unlocks anything.
- **Orders:**
  - Totals are computed only on the server.
  - A D1 trigger plus atomic batches prevent overselling, which is tested with concurrent orders.
  - Order and payment status transitions are guarded so an order can't be restocked twice.
  - Order pages need a 32-character HMAC token, compared in constant time.
- **Abuse:** honeypots, minimum fill times and D1-backed rate limits protect signup, login, forms, orders, AI, uploads and inspiration. Admins can suspend sites and accounts, and takedown reports go through the support form.
- **Secrets:** stored only as Wrangler secrets or in the local `.dev.vars` (git-ignored). Logs contain error IDs and messages, never request bodies or credentials. IP addresses are stored only as salted hashes.
- **Admin actions** (demo grants, suspensions, reset links, setting changes) are written to `audit_logs`.

## Residual risks and recommendations
- **Shared origin:** published customer sites are served from the same origin as the builder. Content is escaped and scripts are nonce-locked, so this is mitigated, but a renderer bug could affect app sessions. Moving customer sites to a separate domain (Stage 2) removes this risk.
- Turnstile isn't enabled yet; spam controls are a honeypot, timing checks and rate limits. Add Turnstile with an owner-created site key.
- D1-based rate limiting is best-effort. Consider Cloudflare's rate-limiting rules or WAF on the Paid plan.
- No email verification exists for password accounts (no email provider yet). Admin rights by email therefore require a Google-verified address or the `make-admin` script.
- Inspiration screenshots of third-party sites are stored privately (owner and admin only) and are never published.
- Get an independent penetration test before taking significant live payments.
