# Quality checklist (run before each release)

- [ ] `npm run typecheck`: clean
- [ ] `npm run test:unit`: 57+ pass (all 18 templates render every page; escaping; pricing; SSRF; webhook signatures)
- [ ] `npm run build && npx vite preview --port 8788`, then `npm run test:integration` (33+ pass)
- [ ] `npx playwright test`: all pass, with no serious or critical axe violations and no console errors. Review the screenshots in `tests/e2e/screenshots/`
- [ ] `npm run deploy`, then `node scripts/smoke-prod.mjs <url>`: all checks pass. Clean up smoke data as described in DEPLOYMENT_REPORT
- [ ] Prices still show 20/25/100 on home, pricing, onboarding and the publish page
- [ ] No placeholder text on public pages; legal pages reviewed by the owner
- [ ] Any feature not yet available is labelled as such (payments, Google sign-in, R2, email, domains)
- [ ] Update DEPLOYMENT_REPORT.md and BUILD_STATUS.md with the version ID and results
