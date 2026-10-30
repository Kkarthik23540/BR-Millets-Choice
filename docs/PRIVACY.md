# Privacy and security notes

## Data handled

The application stores account email/name and password hash, saved delivery addresses, customer enquiries, cart contents, order snapshots and status history, notification state, inventory history, payment references entered by an admin, and operational email job metadata.

The admin dashboard also counts successful public HTML page loads in one aggregate database counter. It does not retain per-visitor identifiers, IP addresses, or page-level history. Admin and other private pages are excluded. This count is separate from optional GA4, which loads only after consent.

Passwords use bcrypt hashing (12+ characters, no more than 72 UTF-8 bytes). Email verification/reset tokens are stored as SHA-256 hashes with expirations and single-use semantics. Reset and verification URLs are encrypted while held in the persistent email queue. SMTP/API credentials belong in environment variables only.

## Authorization

Customer routes derive the account ID from the verified server-side session. Address, cart, order, notification and restock queries include that account ID. Admin APIs check the role in PostgreSQL for every request. Session cookies are HttpOnly, SameSite=Lax and Secure in production. Mutations require a session CSRF token. Rate limits protect authentication and contact submissions.

The repository includes an optional PostgreSQL-backed customer A/B isolation test (it runs only with a dedicated `BRMC_TEST_DATABASE_URL`) and unit tests for allowed/denied order transitions. The isolation test was not run without a test database. Run it before production.

## Account deletion and retention

A signed-in customer with a local password can request account deletion after re-entering the password and typing `DELETE`. Active orders must first be cancelled or completed. Profile, saved addresses, cart, notifications, reset/verification tokens, restock subscriptions, enquiries and pending emails are deleted. Completed order and payment state records remain for operational/accounting continuity, but addresses, notes and payment references are removed and history notes are cleared. The account is pseudonymized.

This is a technical default, not legal advice. Before launch the owner must set lawful retention durations, confirm tax/accounting requirements and review how customer requests are handled. Google-only account deletion is handled by contacting the business and verifying identity.

## Analytics and third parties

GA4 is loaded only after explicit visitor consent when `GA4_MEASUREMENT_ID` exists. The site sends catalogue/item-level event data only; names, email, phone, street address, payment credentials and order notes are excluded. Review consent text, privacy disclosures, cookie rules, and the Analytics property configuration for the actual operating region before deployment.

Google OAuth and SMTP providers receive the information required to authenticate or deliver transactional email. Payment card credentials are never collected or stored. There is no online payment gateway in this version.

## Remaining production risks

- Configure HTTPS, production session secret, database TLS, SMTP SPF/DKIM/DMARC and rate limits at the edge.
- Configure and verify OAuth callback URLs and recovery contacts.
- Set up provider alerting, log retention, database backups, restore drills and dependency scanning.
- External HTTPS image URLs are owner-controlled inputs; use a trusted host and review image rights/content.
- The app does not currently have a dedicated distributed scheduler for reminder campaigns, database migrations rollback tooling, or analytics reporting.
- Review legal policies, retention and deletion procedures with qualified counsel for the actual business.
