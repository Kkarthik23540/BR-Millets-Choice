# Production launch checklist

- [ ] Replace the temporary text/fav icon treatment with the official owner-provided logo.
- [ ] Enter and verify the actual product catalogue, images, variants, prices, ingredients, stock and thresholds.
- [ ] Review all marketing copy, product claims, labels and recipe information.
- [ ] Add verified public business contact information and WhatsApp number.
- [ ] Finalize shipping, cancellation/refund, privacy, terms, tax and retention policies with the owner.
- [ ] Configure production PostgreSQL, HTTPS, `BASE_URL`, `SESSION_SECRET`, proxy trust and backups.
- [ ] Run migrations and secure one-time admin creation; remove bootstrap variables.
- [ ] Configure and test SMTP sender verification, SPF/DKIM/DMARC, verification and reset flows.
- [ ] Configure and test Google OAuth if needed.
- [ ] Explicitly approve any order method before enabling its environment flag.
- [ ] Keep online payments disabled until a provider integration and webhook tests exist.
- [ ] Configure GA4 only after reviewing consent and privacy disclosures; verify no PII in events.
- [ ] Set up a custom domain and Search Console; verify sitemap and crawl rules.
- [ ] Run `npm test`, `npm run check`, PostgreSQL-backed API tests and customer A/B isolation tests.
- [ ] Test simultaneous order attempts against the same stock and a repeated idempotency key.
- [ ] Test email queue retries, provider failure, restore procedures and admin alerting.
- [ ] Confirm the actual deployed URL and all customer/admin flows before announcing launch.
