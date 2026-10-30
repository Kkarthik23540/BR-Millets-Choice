# Deployment and owner setup

The repository is deployment-ready for a Node.js host with a managed PostgreSQL database and a persistent Node process. Render is one compatible option; equivalent platforms are acceptable. A production URL is not configured or claimed by this project.

## Owner information required

Before public launch, supply/verify:

- Official logo and licensed product photography.
- Product names, approved descriptions, ingredients, storage directions, SKUs, actual prices and stock counts for each pack variant.
- Business email, phone/WhatsApp number, support process and verified business address if it should be public.
- Approved order/cancellation/shipping/refund terms, delivery regions/fees and tax treatment.
- Which manual order/payment methods are offered and how they are confirmed.
- A custom domain controlled by the owner, if desired.
- SMTP sender/domain, OAuth client, GA4 property and optional payment merchant account.

## Hosting configuration

1. Create a managed PostgreSQL database and a Node.js web service from this repository.
2. Set the build/install command to `npm ci`; start command to `npm start`; health check path to `/api/health`.
3. Configure the service environment variables from `.env.example`. Set `NODE_ENV=production`, `BASE_URL` to the canonical HTTPS origin, `PUBLIC_SITE_URL` likewise, a unique random `SESSION_SECRET` of 32+ characters, managed `DATABASE_URL`, and `TRUST_PROXY=1` only when the platform terminates trusted TLS proxy traffic.
4. Configure database connection/TLS according to the host’s managed database instructions. Never commit `.env`.
5. Run `npm run db:migrate` as a release/pre-deploy command, then create the admin with the one-time bootstrap command. Remove bootstrap variables immediately afterward.
6. Configure a persistent web process. The email queue is database-backed and retried by a worker started in the web process. For multiple web replicas, the database claim/lock logic prevents two workers claiming the same job; monitor stuck processing jobs.
7. Verify HTTPS, `/api/health`, registration/email verification, account isolation, order review/cancellation, admin status updates, and SMTP delivery in a staging environment.

Product image uploads are written under `public/uploads/products` on local disk. Attach a persistent volume at that path before launch, include it in backup/restore planning, and ensure every web replica can read the same files; otherwise images can disappear on redeploy or be missing on another replica. Customer accounts, orders, addresses, sessions, notifications, and email preferences are stored per user in PostgreSQL and are not tied to a particular device.

## SMTP

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, optional `SMTP_USER`/`SMTP_PASSWORD`, and verified `SMTP_FROM`. Configure SPF, DKIM and DMARC at the sender domain. A message accepted by SMTP is stored as `sent`; the app does not infer a delivery/read confirmation. If SMTP is missing, emails are not sent and the UI explicitly reports that verification is unavailable.

## Google OAuth

Create a Google OAuth web client. Add the exact production callback `${BASE_URL}/api/auth/google/callback` to authorized redirect URIs. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL` to the matching values. Use HTTPS in production; test state mismatch/replay and provider configuration before release.

## Payments and order methods

Online payments are disabled and no gateway integration is implemented. Do not set `PAYMENT_PROVIDER` to imply otherwise. The admin can record a payment as paid only after independently verifying it. To offer initial manual workflows, explicitly set `ENABLE_CASH_ON_HANDOVER=true` and/or `ENABLE_MANUAL_TRANSFER=true` only after approval and training the team. Both default to false.

To add a gateway later, implement server-side payment creation, provider signature/webhook verification, replay-safe webhook event storage, reconciliation, and tests before enabling it. Never trust a browser redirect as payment evidence.

## Analytics and Search Console

Set `GA4_MEASUREMENT_ID` only for the owner’s property. Analytics is loaded after consent. Verify the privacy notice and consent behavior, then use GA4 DebugView to check page/item/cart/order-request events without PII. Add the canonical custom domain as a Search Console property, verify domain ownership through DNS, submit `https://<domain>/sitemap.xml`, and inspect representative public URLs. Account, checkout, order and admin routes are marked `noindex` and excluded from the sitemap. Search rankings/indexing are not guaranteed.

## Domain and HTTPS

Purchase/control the domain in the owner’s name. Add the host-provided DNS records (typically CNAME for a subdomain or A/ALIAS for apex), wait for DNS propagation, enable the host’s managed TLS certificate, and set `BASE_URL`/`PUBLIC_SITE_URL` to the HTTPS canonical origin. Confirm redirects and the `/robots.txt` sitemap URL after deployment.

## Backup, restore and rollback

Use the managed PostgreSQL provider’s automated backups and point-in-time recovery. Also take a manual encrypted backup before schema changes:

```powershell
$env:PGPASSWORD = '<database-password>'
pg_dump --format=custom --no-owner --file=br-millet-choice-backup.dump '<database-url>'
Remove-Item Env:PGPASSWORD
```

Restore into a new/empty database first, not over production:

```powershell
$env:PGPASSWORD = '<restore-database-password>'
pg_restore --no-owner --clean --if-exists --dbname='<restore-database-url>' br-millet-choice-backup.dump
Remove-Item Env:PGPASSWORD
```

Protect backups as sensitive customer data, test restore periodically, and delete temporary backups according to the owner’s retention policy. The project currently uses forward-only numbered migrations; rollback by deploying the prior app version and restoring/repairing the database from a tested backup. Do not manually reverse a production migration without a reviewed migration plan.
