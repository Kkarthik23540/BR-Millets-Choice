# API reference

All endpoints are served from the same origin. JSON errors have `{ "error": "...", "code": "..." }`. Mutating requests require the session-bound `X-CSRF-Token` returned by `GET /api/csrf`. Session cookies are HttpOnly, SameSite=Lax and Secure in production.

Amounts are represented in integer paise. User IDs supplied by a browser are never used to authorize customer data.

## Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Database-backed health check |
| GET | `/api/csrf` | Start/read a CSRF-protected session |
| GET | `/api/config` | Public, non-secret owner configuration and enabled payment methods, including the published business map coordinates when set |
| GET | `/api/products?q=&category=` | Active catalogue |
| GET | `/api/products/:slug` | One active product |
| POST | `/api/contact` | Store an enquiry (rate limited) |
| GET | `/sitemap.xml` | Active products plus public pages |
| GET | `/robots.txt` | Public/private crawl rules |

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create customer account and queue verification email when SMTP is configured |
| POST | `/api/auth/login` | Sign in with email/password |
| POST | `/api/auth/logout` | Destroy the current session |
| GET | `/api/auth/me` | Current signed-in user |
| GET | `/api/auth/verify?token=` | Consume a one-use verification token |
| POST | `/api/auth/verification/resend` | Resend verification instructions |
| POST | `/api/auth/forgot-password` | Request a password-reset link |
| POST | `/api/auth/reset-password` | Consume a reset link and update the password |
| GET | `/api/auth/google` | Begin Google OAuth when configured |
| GET | `/api/auth/google/callback` | Validate OAuth state and verified Google identity |
| DELETE | `/api/account` | Delete a local-password customer account; completed orders are anonymized |

## Customer (verified account required unless noted)

| Method | Path | Purpose |
|---|---|---|
| GET/PATCH | `/api/profile` | Read/update current profile |
| GET/PUT | `/api/profile/email-preferences` | Read/update optional customer email preferences; security emails remain required |
| GET/POST/DELETE | `/api/addresses[/:id]` | List, add and delete only the current user’s addresses |
| GET | `/api/cart` | Current account cart |
| POST | `/api/cart/items` | Add a variant at its server-side catalogue price |
| PATCH/DELETE | `/api/cart/items/:variantId` | Change/remove own cart item |
| POST | `/api/orders` | Submit an order request; requires `Idempotency-Key` UUID |
| GET | `/api/orders` | Current account order history |
| GET | `/api/orders/:id` | Current account order details only |
| POST | `/api/orders/:id/cancel` | Cancel own order where transition is allowed |
| GET | `/api/notifications` | Current account notifications |
| PATCH | `/api/notifications/:id/read` | Mark own notification read |
| PATCH | `/api/notifications/read-all` | Mark own notifications read |
| GET | `/api/notifications/events` | Authenticated SSE unread-count stream |
| POST | `/api/restock-subscriptions` | Subscribe to an active, out-of-stock variant |

## Admin (server-side admin role required)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/summary` | Product/customer/order counts, low stock, enquiries, email failures and aggregate public page visits |
| GET | `/api/admin/customers?q=&verification=` | Customer contact, verification and order summaries |
| GET | `/api/admin/events` | Admin-only SSE stream for new order requests |
| GET/PUT | `/api/admin/business-details` | Read or update public business address, phone, contact email, WhatsApp, hours and map coordinates |
| GET/POST | `/api/admin/products` | List products / create product with initial variants |
| PATCH | `/api/admin/products/:id` | Update product, variants and image references |
| POST | `/api/admin/products/:id/variants` | Add pack option |
| PATCH | `/api/admin/variants/:id` | Update variant details, price and inventory |
| PATCH | `/api/admin/variants/:id/inventory` | Record a reasoned stock adjustment |
| GET | `/api/admin/inventory/:variantId/movements` | Inventory movement history |
| GET | `/api/admin/orders?q=&status=&payment=&from=&to=&offset=&limit=` | Search and filter order requests; returns a page of up to 50 results by default with `total`, `offset`, `limit`, and `hasMore` |
| PATCH | `/api/admin/orders/:id/status` | Apply an allowed order status transition |
| PATCH | `/api/admin/orders/:id/payment` | Record an admin-verified manual payment state |
| GET | `/api/admin/enquiries` | View customer enquiries |
| PATCH | `/api/admin/enquiries/:id/status` | Update enquiry workflow |
| DELETE | `/api/admin/enquiries/:id` | Delete an enquiry and record an audit event |
| GET | `/api/admin/email-jobs` | Inspect recent email queue jobs |

The admin order list supports search by order number, customer name, or email; status and payment filters; inclusive `from`/`to` dates (`YYYY-MM-DD`); and offset pagination. `limit` is capped at 100.

The admin order list includes a **Prepare WhatsApp message** link for confirmed orders with a valid delivery phone number. It opens WhatsApp with order details prefilled; an admin must review and send the message manually. It does not send automatically.

Email preference controls cover order/payment updates, enquiry acknowledgements, back-in-stock alerts and optional promotions. Verification and password-security messages are always sent.

The admin profile saves public business details separately from administrator sign-in details. The public contact page displays only the details entered by the owner; location is shown as text and no map or location tracking is used.

OpenAPI provides the API security schemes and representative request/response definitions in [`openapi.yaml`](./openapi.yaml).
