# Cloudflare setup & owner actions

The current deployment works without any of these steps. Each one switches on a feature that's waiting on the owner. Run commands from `motion-imprints-website-builder/`.

## 1. Upgrade to Workers Paid ($5/month)
Dashboard → Workers & Pages → Plans. No code change is needed; the app is already sized for Paid limits: 30 s CPU, 1,000 D1 queries per request and 10 GB databases.

## 2. Make yourself admin
1. Sign up on the live site with your email.
2. Run: `node scripts/make-admin.mjs you@yourdomain.com`

Alternatively, once Google sign-in is set up, run `npx wrangler secret put ADMIN_EMAILS` (a comma-separated list). A Google-verified email in that list becomes admin automatically.

## 3. Enable R2 (media storage)
1. Dashboard → R2 → complete the R2 subscription. It's free up to 10 GB.
2. `npx wrangler r2 bucket create imprintsites-media`
3. Uncomment the `r2_buckets` block in `wrangler.jsonc`, then run `npm run deploy`.

New uploads then go to R2, and existing D1-stored files keep working. The per-project quota rises from 60 MB to 300 MB.

## 4. Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* (Web application).
2. Authorised redirect URI: `https://imprintsites.omodingisaac123.workers.dev/api/auth/google/callback`
3. Configure the OAuth consent screen with app name *ImprintSites AI* and links to `/privacy` and `/terms`.
4. Set the secrets: `npx wrangler secret put GOOGLE_CLIENT_ID`, then `npx wrangler secret put GOOGLE_CLIENT_SECRET`.

The "Continue with Google" buttons activate automatically.

## 5. Dodo Payments
See `docs/dodo-integration.md`.

## 6. Email notifications (optional)
Verify a sending domain with Resend, then set the secrets `RESEND_API_KEY` and `EMAIL_FROM` (for example `ImprintSites AI <noreply@motionimprints.tech>`). This enables password-reset emails and lead and order alerts.

## 7. Operator details for legal pages
Admin → Settings: set the operator display name, the status note (for example the individual's name while company registration is in progress), and a monitored support email. Review `/terms`, `/privacy` and `/refunds` before enabling live payments.

## 8. Nicer URL (optional)
The workers.dev address uses the account's subdomain (`omodingisaac123`). You can rename it under Workers → Subdomain, which affects every Worker on the account, or attach a custom domain such as `sites.motionimprints.tech` as a Worker route. If you do, set `PUBLIC_BASE_URL` and update the Google and Dodo URLs.
