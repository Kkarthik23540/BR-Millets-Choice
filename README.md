# BR Millet Choice

A Node.js/Express and PostgreSQL storefront for BR Millet Choice. The frontend is semantic HTML, Bootstrap 5 and vanilla JavaScript; there is no frontend framework.

The project intentionally does not invent the owner’s prices, product names, ingredients, claims, contact details, domain, credentials or customer reviews. The initial catalogue is empty. Add owner-approved products in the admin dashboard before making them active.

## Requirements

- Node.js 20 or newer (tested locally with Node.js 22)
- PostgreSQL 14 or newer
- npm
- SMTP credentials for real verification and transactional email

## Run locally

From PowerShell in the project directory:

```powershell
Copy-Item .env.example .env
```

Edit `.env` with a local PostgreSQL connection and a fresh random `SESSION_SECRET` (at least 32 characters). Create the database, then install and migrate:

```powershell
createdb br_millet_choice
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. `/api/health` reports whether PostgreSQL is reachable.

If SMTP is not configured, account-verification and other email messages are not delivered and no delivery success is reported. Customer accounts cannot sign in until verified. Configure SMTP before exercising account and order flows. Payment methods are disabled by default; enable only methods the business can actually fulfil.

Set initial public contact details in the project `.env` file using `BUSINESS_EMAIL`, `BUSINESS_PHONE`, `BUSINESS_WHATSAPP` and `BUSINESS_ADDRESS`, then restart the server. An admin can edit public contact information and business hours from the Admin profile and choose the business pin on the interactive OpenStreetMap picker. The approved address appears first in Contact details, with a boxed map below; the public map is shown after a pin is saved. Map tiles are provided by OpenStreetMap. Email opens a mail app, phone opens a call action on supported devices, and WhatsApp opens a chat. SMTP settings separately control verification and transactional email and are not published.

The site uses a vertical navigation sidebar on desktop and an accessible slide-out menu on smaller screens. Customers see Home, Products, Our story, Millets, Ideas, Contact and Cart; signed-in admins see Dashboard (`/admin`), Add products (`/admin/products`), Manage products (`/admin/manage-products`), Orders, Enquiries, Customers and Admin profile. Product creation is separated from catalogue editing. The Dashboard shows product, order, customer and enquiry totals, low-stock indicators, management shortcuts, and aggregate public page visits. Orders support search, status/payment/date filters and pagination. Admin pages and operations are protected by server-side role and CSRF checks. The customer `/account` page groups profile details, addresses, order requests and notifications on one responsive page. Customers can update their optional email categories from their profile; verification and password-security messages remain enabled. Product images fit within their display area without being cropped, and async actions show a working state plus success or error feedback.

Customers can save optional email preferences from `/profile` for order/payment updates, enquiry acknowledgements, back-in-stock alerts and promotions. Verification and password-security messages are always sent. After an admin confirms an order, the Orders page offers a **Prepare WhatsApp message** link when the order has a usable delivery phone number; it opens a prefilled message for the admin to review and send manually.

### Add products to the shop

1. Sign in at `http://localhost:3000/login` using the account that has the **admin** role. Admins are sent to the dashboard after sign-in.
2. Open `http://localhost:3000/admin/products` (Add products).
3. Enter the product name. The URL name is filled from it automatically; edit if needed. Add the approved description, category, ingredients and storage details. Optionally select a JPEG, PNG, or WebP product image up to 5 MB from your device. The Products screen also lets you replace an existing product image.
4. Enter the first pack option’s SKU, pack size, price in rupees and stock quantity.
5. To show the product to customers, check **Make product and variant active for customers**, then choose **Create product**. If it is not active, it stays out of the public catalogue.
6. Open `http://localhost:3000/shop` or the home page to see the active product. Use **Manage products** (`/admin/manage-products`) to update product details and inventory.

If your existing owner account is shown as a customer, ask the database owner to run [Promote an existing account](#promote-an-existing-account) against the same `.env` database used by the running app. A regular customer account cannot open the admin dashboard.

## Promote an existing account

This command changes only the role of an existing account and leaves its password unchanged. Run it from the project directory with the database owner’s approval:

```powershell
$env:ADMIN_PROMOTE_EMAIL = 'owner@example.invalid'
npm run admin:promote
Remove-Item Env:ADMIN_PROMOTE_EMAIL
```

Replace the example with the verified owner account email, and make sure `.env` points to the same database as the running server. Then sign out and sign back in to refresh the session role. Do not configure this command as an automatic startup task.

## Create the first admin account

After running migrations, Set temporary environment variables and run the one-time bootstrap command. The password must be at least 12 characters and no more than 72 UTF-8 bytes. Do not put these values in source control or share them in logs:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = 'owner@example.invalid'
$env:BOOTSTRAP_ADMIN_NAME = 'Business Owner'
$env:BOOTSTRAP_ADMIN_PASSWORD = '<use-a-unique-password-of-at-least-12-characters>'
npm run admin:create
Remove-Item Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_NAME, Env:BOOTSTRAP_ADMIN_PASSWORD
```

Replace the example email with an owner-controlled mailbox. The bootstrap command can promote the specified account to admin, so protect the temporary credentials and run it only when intended.

## Main capabilities

- Customer registration, email verification, login/logout, password reset and optional Google OAuth. New password and Google signups must verify through the email link before signing in.
- Database-backed customer profiles, saved addresses, carts, notifications and order history.
- Customer-scoped API queries and ownership checks for addresses, orders and notifications.
- Product and pack-size catalogue, inventory tracking, inventory movement history, low-stock alerts and restock subscriptions.
- Stock reservation and order creation in a PostgreSQL transaction, server-side price calculation and idempotency keys.
- Startup order workflow from `awaiting_confirmation` through authorized fulfilment updates; the initial request is never represented as a confirmed order.
- Server-protected admin product, inventory, order, payment-record, enquiry and email-job views.
- Persisted email queue with encrypted payloads, retries and delivery-attempt records when SMTP is configured.
- Private Server-Sent Events stream for notification-count updates.
- Public SEO metadata, product structured data, robots rules and a database-backed sitemap.
- An aggregate public page-view counter for the admin dashboard. It records public page loads only and does not store visitor identities, addresses, or IP addresses.
- Google Analytics 4 loads only after the visitor opts in; personally identifying order data is not sent.

## Implemented integrations and explicit limits

- Google OAuth activates only after the owner configures the client ID, secret and callback URL.
- Email is sent over the configured SMTP relay. An accepted SMTP message is recorded as `sent`, not as provider-confirmed delivery.
- Cash-on-handover and manual-transfer options are disabled by default. Configure them only if the business has approved the process.
- No payment gateway is integrated. Card/UPI gateway payments remain unavailable; frontend redirects cannot mark an order paid. Admins can record a manually verified payment and reference.
- Product images can be uploaded by an admin as JPEG, PNG, or WebP files (up to 5 MB). Files are stored under `public/uploads/products`; configure persistent storage or a durable mounted volume for production deployments so uploads survive redeployments.
- Server-Sent Events use a private, persistent-notification-backed count poll; they do not carry another customer’s notification content.
- Historical Google Analytics reporting is not connected to the admin dashboard.
- The Google sign-in deletion flow requires owner support and identity verification; local-password customer accounts can request deletion from their account page.
- There are no seeded products or customer orders. The admin creates the catalogue from verified business details.

## Commands

```powershell
npm run dev
npm start
npm run db:migrate
npm run admin:create
npm test
npm run check
```

For the customer-isolation HTTP integration test, use a dedicated PostgreSQL database whose name contains `test`, apply the migration, then set the same URL in both variables:

```powershell
$env:DATABASE_URL = 'postgres://postgres:change-me@localhost:5432/br_millet_choice_test'
npm run db:migrate
$env:BRMC_TEST_DATABASE_URL = $env:DATABASE_URL
npm test
Remove-Item Env:DATABASE_URL, Env:BRMC_TEST_DATABASE_URL
```

The test refuses database names without `test` and deletes only its randomly generated fixture records. It is skipped when `BRMC_TEST_DATABASE_URL` is unset.

## Documentation

- [API reference](docs/API.md)
- [Deployment, database and owner setup](docs/DEPLOYMENT.md)
- [Privacy and security notes](docs/PRIVACY.md)
- [Launch checklist](docs/LAUNCH-CHECKLIST.md)
- [OpenAPI document](docs/openapi.yaml)

The supplied BR Millets Choice logo crop is used in the site header, home-page hero, footer and favicon. The crop uses only the logo from the supplied product poster.
