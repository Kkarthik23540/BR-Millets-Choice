# BR Millet Choice — Screen Layouts & Visual Architecture Guide

This guide provides a complete, easy-to-understand breakdown of every screen layout, its visual components, CSS classes, and where each screen is controlled in the application.

---

## Table of Contents
1. [Global Layout Shell](#1-global-layout-shell)
2. [Customer Storefront Screens](#2-customer-storefront-screens)
   - [Home Screen (`/`)](#home-screen-)
   - [Shop Catalogue (`/shop`)](#shop-catalogue-shop)
   - [Product Detail (`/product/:slug`)](#product-detail-productslug)
   - [Shopping Cart (`/cart`)](#shopping-cart-cart)
   - [Checkout (`/checkout`)](#checkout-checkout)
   - [Order Status & Tracking (`/orders/:id`)](#order-status--tracking-ordersid)
   - [Customer Profile & Email Preferences (`/profile`)](#customer-profile--email-preferences-profile)
   - [Educational & Information Screens (`/about`, `/millets`, `/contact`)](#educational--information-screens)
3. [Admin Portal Screens](#3-admin-portal-screens)
   - [Admin Dashboard (`/admin`)](#admin-dashboard-admin)
   - [Manage Products & Inventory (`/admin/manage-products`)](#manage-products--inventory-adminmanage-products)
   - [Admin Orders (`/admin/orders`)](#admin-orders-adminorders)
   - [Admin Reviews (`/admin/reviews`)](#admin-reviews-adminreviews)
   - [Admin Enquiries (`/admin/enquiries`)](#admin-enquiries-adminenquiries)
   - [Admin Customers (`/admin/customers`)](#admin-customers-admincustomers)
   - [Admin Profile & Business Hours (`/profile` for Admin)](#admin-profile--business-hours)
4. [Authentication Screens](#4-authentication-screens)
5. [Key CSS Classes Reference](#5-key-css-classes-reference)

---

## 1. Global Layout Shell

The global shell surrounds all pages and provides the sticky header, responsive navigation, sidebar, and footer.

```
+------------------------------------------------------------------------+
| ANNOUNCEMENT TICKER: 🌾 BR Millets • 100% Pure • 🚚 COD Across India   |
+------------------------------------------------------------------------+
| STICKY HEADER: [☰ Menu]  [🌾 Welcome to BR Millet Choice]    [🛒 Cart] |
+------------------+-----------------------------------------------------+
| SIDEBAR          | MAIN CONTENT AREA                                   |
| (Collapsible)    |                                                     |
|                  | - Hero Banner / Page Header                         |
| • Home           | - Feature Cards / Grid                              |
| • Products (2)   | - Interactive Forms / Tables                        |
| • Our story      |                                                     |
| • Millets        |                                                     |
| • My Orders      |                                                     |
| • Contact        |                                                     |
| • Cart           |                                                     |
| ──────────────── |                                                     |
| [Account Menu ▾] |                                                     |
+------------------+-----------------------------------------------------+
| FOOTER: Brand Info | Quick Links | WhatsApp Channel | [0][0][0][7][4][9]|
+------------------------------------------------------------------------+
```

### Components:
- **Sticky Header** (`.site-header`): Fixed to the top on all screen sizes, containing:
  - Announcement ticker bar (`.announcement-bar`)
  - Scroll progress indicator line (`.page-scroll-indicator`)
  - Hamburger toggle (`.site-nav-toggle`)
  - Wordmark brand logo & tagline (`.brand-wordmark`)
  - Header shopping cart button with live count badge (`.mobile-header-cart`)
- **Responsive Sidebar** (`.site-sidebar`):
  - Collapses smoothly on desktop to save space
  - Off-canvas drawer on mobile devices with backdrop
  - Real-time product count badge beside "Products"
  - Interactive profile dropdown menu at the bottom with avatar circle
- **Global Footer** (`.site-footer`):
  - Brand overview & mission statement
  - Quick navigation links
  - WhatsApp Channel direct join button
  - **6-digit Odometer Visit Counter** (`.visit-counter-widget.is-dark`) displaying public page visits
  - Copyright and legal links (Privacy, Terms, Shipping)

---

## 2. Customer Storefront Screens

### Home Screen (`/`)
*Controlled in `public/app.js` by `renderHome()` (line 676)*

```
+---------------------------------------------------------------+
| HERO SECTION (.landing-hero)                                  |
| "100% PURE & NATURAL" Pill Badge                              |
| Typing Title: "BR MILLETS CHOICE"                             |
| Subtitle: "Special Millet, Nuts & Seeds Blend"                |
| 4 Badges: [8 Millets] [4 Nuts] [7 Seeds & Pulses] [500g/1kg]  |
| Action Buttons: [Order Now →] [What's Inside 🌾]              |
| Graphic: Animated Glowing Logo Circle                         |
+---------------------------------------------------------------+
| 4 SIMPLE REASONS STRIP (.border-top.border-bottom)            |
| [🌾 100% Unpolished] [⚙️ Stone-Ground]                        |
| [🩺 Good for Health] [🚚 Cash on Delivery]                    |
+---------------------------------------------------------------+
| WHAT'S INSIDE OUR BLEND (.ingredient-bento-container)         |
| Bento Card 1: 8 Superfood Millets (Foxtail, Jowar, Ragi...)   |
| Bento Card 2: 4 Crunchy Nuts (Almonds, Cashews, Walnuts...)   |
| Bento Card 3: 7 Seeds & Pulses (Flax, Chia, Pumpkin...)       |
+---------------------------------------------------------------+
| FEATURED PRODUCT PACKS (.product-grid)                        |
| Pack Cards: 500g & 1kg with live stock & quick add to cart    |
+---------------------------------------------------------------+
| REAL CUSTOMER REVIEWS CAROUSEL                                |
| Verified buyer comments, star ratings, and review timestamps  |
+---------------------------------------------------------------+
```

---

### Shop Catalogue (`/shop`)
*Controlled in `public/app.js` by `renderShop()` (line 1121)*

- **Category Filter Tabs**: Quick pills to filter by All, Flour, Blend, etc.
- **Product Card Grid** (`.product-grid`):
  - High-resolution product image preview
  - Live stock status pill (`In Stock` / `Low Stock` / `Out of Stock`)
  - Pack size selector radio buttons (e.g., 500g, 1 kg)
  - Price per pack in Indian Rupees (₹)
  - Interactive Add-to-Cart button with instant badge animation

---

### Product Detail (`/product/:slug`)
*Controlled in `public/app.js` by `renderProduct()` (line 1264)*

- Breadcrumbs navigation (`Home > Shop > Product Name`)
- Two-column showcase layout:
  - **Left**: Large high-resolution photo with smooth zoom
  - **Right**:
    - Product title, category, and review star rating summary
    - Pack options selector with active price updating
    - Quantity selector (`-` / `+`)
    - 100% Cash on Delivery notice
    - Detailed accordion tabs: Health Benefits, Ingredients, Storage Instructions
- **Customer Reviews Section**:
  - Breakdown of ratings (1-5 stars)
  - Public approved reviews
  - Verified customer review submission form with star picker

---

### Customer Profile & Email Preferences (`/profile`)
*Controlled in `public/app.js` by `renderProfile()` (line 2091)*

The user profile is presented in a **side-by-side layout on desktop** and a clean **scrollable tab bar on mobile**:

```
+---------------------+--------------------------------------------------+
| PROFILE SIDEBAR     | PROFILE PANELS (Selected Tab)                    |
| (Left Column)       | (Right Column)                                   |
|                     |                                                  |
|   [ Avatar: "K" ]   | TAB 1: Profile details                           |
|   K Karthik Reddy   | - Full name input                                |
|   user@email.com    | - Email address (read-only)                      |
| [✓ Email verified]  | - [Save changes] button                          |
|                     | - Email verification status card                 |
| MENU TABS:          | ──────────────────────────────────────────────── |
| • Profile details   | TAB 2: Email preferences                         |
| • Email preferences | - [✓] Order and payment updates                  |
| • Delivery addresses| - [✓] Enquiry acknowledgements                   |
| • Order history     | - [✓] Back-in-stock alerts                       |
| • Notifications     | - [ ] News and promotions                        |
| • Account overview  | - [Save email preferences] button                |
|                     | ──────────────────────────────────────────────── |
|                     | TAB 3: Delivery addresses (List + Add Form)      |
|                     | TAB 4: Order history (Past orders & receipts)    |
|                     | TAB 5: Notifications (Alerts & mark-as-read)     |
|                     | TAB 6: Account overview (Security & Delete)      |
+---------------------+--------------------------------------------------+
```

---

## 3. Admin Portal Screens

*Controlled in `public/app.js` by `renderAdminContent()` (line 3139)*

### Admin Dashboard (`/admin`)
Designed for store owners with instant visibility into operations:

```
+------------------------------------------------------------------------+
| 8 KEY METRIC STAT CARDS (.admin-stat)                                  |
| [ 2 ] Products        [ 5 ] Orders       [ 1 ] Customers  [ 0 ] Enquiries|
| [ 1 ] Low-Stock       [ 0 ] Out-of-Stock [ 0 ] Pending Rev [ 6 ] Total Rev|
+------------------------------------------------------------------------+
| 6 ACTION SHORTCUT CARDS (.admin-shortcut)                              |
| 1. Products & Inventory  -> Manage products →                          |
| 2. Orders & Requests     -> Manage orders →                            |
| 3. Customer Reviews      -> Moderate reviews →                         |
| 4. Enquiries             -> Manage enquiries →                         |
| 5. Customers             -> View customers →                           |
| 6. My Profile            -> Manage profile →                           |
+------------------------------------------------------------------------+
| STORE VISITOR ODOMETER CARD (.admin-visit-counter-card)                |
|           [ 0 ] [ 0 ] [ 0 ] [ 7 ] [ 6 ] [ 7 ]                          |
|                         Page Visits                                    |
+------------------------------------------------------------------------+
```

### Manage Products & Inventory (`/admin/manage-products`)
- Form to create new products with web slug, description, category, and image upload.
- Full inventory manager:
  - SKU, Pack Size, Price (₹), Current Stock, Low Stock Threshold.
  - Active / Inactive switch.
  - **Permanent Delete Product Button** with cascade deletion of variant movements.

### Admin Profile & Working Hours (`/profile` for Admin)
- Store public contact details:
  - Contact phone number
  - Contact email
  - WhatsApp contact number
  - Physical store address & city
- **Store Working Hours Schedule**: Set open & close times (12-hour AM/PM format) and working days.
- Admin password change & account security controls.

---

## 4. Key CSS Selectors & Classes

| Component | CSS Class | Purpose |
| :--- | :--- | :--- |
| **Sticky Header** | `.site-header` | Sticky top navigation on mobile and desktop |
| **Brand Wordmark** | `.brand-wordmark`, `.brand-logo` | Store logo and typography |
| **Layout Grid** | `.site-layout`, `.site-sidebar`, `.site-content` | Responsive two-pane dashboard layout |
| **Landing Hero** | `.landing-hero`, `.typing-brand-title` | Animated homepage hero |
| **Bento Cards** | `.ingredient-bento-hero`, `.ingredient-pill-card` | Ingredient grid visual showcase |
| **Profile Grid** | `.profile-layout`, `.profile-sidebar`, `.profile-nav-tab` | Side-by-side profile tabs |
| **Admin Stats** | `.admin-stat`, `.admin-shortcut` | Dashboard KPI counters and action cards |
| **Odometer Counter** | `.visit-counter-widget`, `.visit-digit-box` | 6-box animated page visit counter |
| **Buttons** | `.btn-brand`, `.btn-outline-brand`, `.btn-hero-primary` | Standardized forest green button theme |
