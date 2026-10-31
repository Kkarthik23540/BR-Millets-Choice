const appRoot = document.querySelector('#main-content');
const toastRegion = document.querySelector('#toast-region');
const state = { config: null, analyticsStarted: false, eventSource: null, adminEventSource: null, adminOrdersOffset: 0, adminOrdersRequest: 0, user: null };
let csrfToken = '';

const pageMeta = {
  '/': ['BR Millet Choice | Millet powder', 'Discover millet powder products from BR Millet Choice. Browse available pack options and request an order.'],
  '/shop': ['Shop | BR Millet Choice', 'Browse BR Millet Choice millet powder products and available pack sizes.'],
  '/about': ['About | BR Millet Choice', 'Learn about BR Millet Choice. Business story and product details are published as supplied by the owner.'],
  '/millets': ['Millets | BR Millet Choice', 'Millet information from BR Millet Choice. Product claims and ingredients are published only when verified.'],
  '/recipes': ['Usage ideas | BR Millet Choice', 'Explore general usage ideas for millet powder. Follow the specific product label for instructions.'],
  '/contact': ['Contact | BR Millet Choice', 'Contact BR Millet Choice with a product, order or general enquiry.'],
  '/faq': ['FAQs | BR Millet Choice', 'Answers about product options, order requests and customer accounts.'],
  '/shipping': ['Shipping | BR Millet Choice', 'Shipping and delivery information for BR Millet Choice order requests.'],
  '/refunds': ['Cancellation and refunds | BR Millet Choice', 'Information about cancelling an order request and discussing refunds.'],
  '/privacy': ['Privacy | BR Millet Choice', 'How BR Millet Choice handles account, delivery and enquiry data.'],
  '/terms': ['Terms | BR Millet Choice', 'Terms for browsing and submitting order requests to BR Millet Choice.'],
  '/signup': ['Create account | BR Millet Choice', 'Create a customer account for BR Millet Choice.'],
  '/login': ['Sign in | BR Millet Choice', 'Sign in to your BR Millet Choice account.'],
  '/verify': ['Email verification | BR Millet Choice', 'Verify your BR Millet Choice email address.'],
  '/forgot-password': ['Forgot password | BR Millet Choice', 'Request a secure password reset link.'],
  '/reset-password': ['Choose a new password | BR Millet Choice', 'Set a new password for your BR Millet Choice account.'],
  '/account': ['My account | BR Millet Choice', 'Manage your private BR Millet Choice account.'],
  '/profile': ['My account | BR Millet Choice', 'Manage your private BR Millet Choice account.'],
  '/addresses': ['Saved addresses | BR Millet Choice', 'Manage your private delivery addresses.'],
  '/cart': ['Shopping cart | BR Millet Choice', 'Review your selected product options.'],
  '/checkout': ['Checkout | BR Millet Choice', 'Review your order request and delivery information.'],
  '/orders': ['My orders | BR Millet Choice', 'Review your private order requests and their latest statuses.'],
  '/notifications': ['Notifications | BR Millet Choice', 'Review your private BR Millet Choice notifications.'],
  '/admin': ['Admin | BR Millet Choice', 'Authorized BR Millet Choice administration.'],
  '/admin/products': ['Add products | Admin | BR Millet Choice', 'Create products for the BR Millet Choice catalogue.'],
  '/admin/manage-products': ['Manage products | Admin | BR Millet Choice', 'Manage product details and inventory.'],
  '/admin/orders': ['Orders | Admin | BR Millet Choice', 'Review and update customer orders.'],
  '/admin/reviews': ['Customer reviews | Admin | BR Millet Choice', 'Review and moderate customer feedback and ratings.'],
  '/admin/enquiries': ['Enquiries | Admin | BR Millet Choice', 'Review customer enquiries and email delivery status.'],
  '/admin/customers': ['Customers | Admin | BR Millet Choice', 'Review customer accounts and order summaries.'],
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function money(paise) {
  const amount = Number(paise ?? 0) / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

function dateInputValue(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function pageHeader(eyebrow, title, description = '') {
  return `<section class="page-hero"><div class="container"><p class="eyebrow mb-2">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1>${description ? `<p class="section-intro mb-0">${escapeHtml(description)}</p>` : ''}</div></section>`;
}

function buttonLink(href, label, style = 'btn-brand') {
  return `<a class="btn ${style}" href="${href}">${escapeHtml(label)}</a>`;
}

function emptyState(title, message, href = '/contact', action = 'Contact us') {
  return `<div class="empty-state"><h2>${escapeHtml(title)}</h2><p class="text-secondary mb-3">${escapeHtml(message)}</p>${buttonLink(href, action, 'btn-outline-brand')}</div>`;
}

function startTopLoader() {
  const loader = document.getElementById('top-nav-loader');
  if (loader) {
    loader.classList.remove('is-loading');
    void loader.offsetWidth;
    loader.classList.add('is-loading');
  }
}

function stopTopLoader() {
  const loader = document.getElementById('top-nav-loader');
  if (loader) {
    loader.classList.remove('is-loading');
  }
}

function updatePageScrollProgress() {
  const indicator = document.getElementById('page-scroll-indicator');
  if (!indicator) return;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
  indicator.style.width = `${progress}%`;
}
window.addEventListener('scroll', updatePageScrollProgress, { passive: true });

function productSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toast(message, error = false, href = '') {
  const toastEl = document.createElement('div');
  toastEl.className = `app-toast${error ? ' error' : ''}`;
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `
    <div class="toast-body">
      <span class="toast-symbol" aria-hidden="true">${error ? '✕' : '✓'}</span>
      <span class="toast-text">${escapeHtml(message)}</span>
      ${href ? `<a class="toast-link" href="${escapeHtml(href)}">Review</a>` : ''}
    </div>
    <button class="toast-close" type="button" aria-label="Dismiss notification" title="Close">✕</button>
  `;
  const removeToast = () => {
    toastEl.classList.add('toast-leaving');
    window.setTimeout(() => toastEl.remove(), 260);
  };
  toastEl.querySelector('.toast-close').addEventListener('click', removeToast);
  toastRegion.appendChild(toastEl);
  window.setTimeout(removeToast, 5000);
}

async function compressImageFile(file, maxWidth = 1200, quality = 0.85) {
  if (!file || !file.type.startsWith('image/')) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function uploadAdminImage(form) {
  const file = form.querySelector('[data-product-image]')?.files?.[0];
  if (!file) return null;
  const compressed = await compressImageFile(file);
  const payload = new FormData();
  payload.append('image', compressed);
  const result = await api('/api/admin/product-images', { method: 'POST', body: payload });
  return result.image.url;
}

function showButtonProgress(button) {
  if (!button || button.disabled) return null;
  const stateBefore = { html: button.innerHTML, disabled: button.disabled };
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Working…';
  return stateBefore;
}

function restoreButtonProgress(button, previous) {
  if (!button || !previous) return;
  if (!previous.preserve) {
    button.innerHTML = previous.html;
    button.disabled = previous.disabled;
  }
  button.removeAttribute('aria-busy');
}

function setMobileNavigationOpen(isOpen, restoreFocus = false) {
  const sidebar = document.querySelector('#site-sidebar');
  const toggle = document.querySelector('[data-nav-toggle]');
  const backdrop = document.querySelector('.site-nav-backdrop');
  const mobile = window.matchMedia('(max-width: 991.98px)').matches;
  const open = mobile && isOpen;
  sidebar?.classList.toggle('is-open', open);
  if (sidebar) sidebar.setAttribute('aria-hidden', String(mobile && !open));
  if (backdrop) backdrop.hidden = !open;
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  document.querySelector('.site-content').inert = open;
  document.body.classList.toggle('site-nav-open', open);
  if (open) requestAnimationFrame(() => sidebar?.querySelector('.mobile-navigation-close')?.focus());
  else if (restoreFocus && mobile) toggle?.focus();
}

function syncPageScrollControl() {
  const control = document.querySelector('[data-page-scroll]');
  if (!control) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const canScroll = maxScroll > 80;
  const scrollUp = canScroll && window.scrollY > Math.min(160, maxScroll / 2);
  control.hidden = !canScroll;
  control.dataset.direction = scrollUp ? 'up' : 'down';
  control.setAttribute('aria-label', scrollUp ? 'Scroll to top' : 'Scroll to bottom');
  control.title = scrollUp ? 'Scroll to top' : 'Scroll to bottom';
  control.innerHTML = scrollUp
    ? '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V4m-7 5 7-7 7 7"></path></svg>'
    : '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16m-7-5 7 7 7-7"></path></svg>';
}

async function loadCsrf() {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/csrf', { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Could not establish a secure session. Refresh and try again.');
  const result = await response.json();
  csrfToken = result.csrfToken;
  return csrfToken;
}

async function api(url, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers ?? {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (!['GET', 'HEAD'].includes(options.method ?? 'GET')) headers['X-CSRF-Token'] = await loadCsrf();
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? data.message ?? 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}



function confirmAction({ title = 'Confirmation', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false } = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'brmc-modal-backdrop';
    backdrop.innerHTML = `
      <div class="brmc-modal-card" role="dialog" aria-modal="true" aria-labelledby="brmc-modal-title">
        <div class="brmc-modal-header">
          <div class="brmc-modal-icon ${isDanger ? 'is-danger' : 'is-brand'}">${isDanger ? '⚠️' : '🌾'}</div>
          <div>
            <h3 class="h5 mb-0 fw-bold ${isDanger ? 'text-danger' : 'text-forest'}" id="brmc-modal-title">${escapeHtml(title)}</h3>
          </div>
        </div>
        <div class="brmc-modal-body my-3">
          <p class="mb-0 text-secondary" style="font-size:0.95rem;line-height:1.5;">${escapeHtml(message)}</p>
        </div>
        <div class="brmc-modal-footer d-flex justify-content-end gap-2 pt-2 border-top">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-modal-cancel>${escapeHtml(cancelText)}</button>
          <button type="button" class="btn btn-sm ${isDanger ? 'btn-danger' : 'btn-brand'}" data-modal-confirm>${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    const finish = (accepted) => {
      backdrop.classList.add('is-closing');
      setTimeout(() => backdrop.remove(), 160);
      resolve(accepted);
    };
    backdrop.querySelector('[data-modal-confirm]').addEventListener('click', () => finish(true));
    backdrop.querySelector('[data-modal-cancel]').addEventListener('click', () => finish(false));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) finish(false);
    });
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        finish(false);
      }
    };
    document.addEventListener('keydown', keyHandler);
  });
}



async function refreshCartBadge() {
  try {
    const data = await api('/api/cart');
    const totalQuantity = (data.items || []).reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(totalQuantity);
    });
  } catch {}
}

async function getConfig() {
  if (!state.config) {
    try {
      state.config = await api('/api/config');
    } catch (err) {
      console.warn('Could not load dynamic config, using fallback settings:', err);
      state.config = {
        businessName: 'BR Millet Choice',
        supportEmail: 'kkarthik23540@gmail.com',
        supportPhone: '',
        whatsapp: '',
        supportAddress: 'Hyderabad, Telangana, India',
        businessHours: '',
        businessLatitude: null,
        businessLongitude: null,
        emailConfigured: true,
        googleConfigured: false,
        paymentsEnabled: false,
        paymentMethods: [
          { value: 'cash_on_handover', label: 'Cash on delivery (confirmed by the team)' },
          { value: 'manual_transfer', label: 'Manual transfer (instructions provided after confirmation)' },
        ],
        analyticsId: null,
      };
    }
  }
  return state.config;
}

function productCard(product) {
  const variants = product.variants ?? [];
  const firstVariant = variants[0];
  const image = product.images?.[0];
  const availability = firstVariant?.availability ?? 'temporarily_unavailable';
  const label = availability === 'in_stock' ? 'In stock'
    : availability === 'low_stock' ? 'Low stock'
      : availability === 'out_of_stock' ? 'Out of stock' : 'Temporarily unavailable';
  const prices = variants.map((variant) => Number(variant.pricePaise));
  const price = prices.length ? (prices.length === 1 ? money(prices[0]) : `${money(Math.min(...prices))} – ${money(Math.max(...prices))}`) : 'Price to be announced';
  return `<article class="product-card">
    <a class="text-decoration-none" href="/product/${encodeURIComponent(product.slug)}" aria-label="View ${escapeHtml(product.name)}">
      <div class="product-image">${image ? `<img loading="lazy" src="${escapeHtml(image.url)}" alt="${escapeHtml(image.altText)}">` : '<span class="product-placeholder">Product details coming soon</span>'}</div>
    </a>
    <div class="product-body">
      <div class="d-flex justify-content-between align-items-start gap-2"><h3 class="mb-2"><a class="text-decoration-none" href="/product/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></h3>${firstVariant ? `<span class="availability ${availability}">${label}</span>` : ''}</div>
      <p class="product-meta mb-3">${escapeHtml(product.category || 'Millet powder')} · ${variants.map((variant) => escapeHtml(variant.packSize)).join(' / ') || 'Pack options to be announced'}</p>
      <div class="d-flex justify-content-between align-items-center"><strong>${price}</strong><a class="link-underline link-underline-opacity-0 fw-semibold" href="/product/${encodeURIComponent(product.slug)}">View details <span aria-hidden="true">→</span></a></div>
    </div>
  </article>`;
}

function cardGrid(products) {
  if (!products.length) return `
    <div class="empty-products-slider my-4">
      <div class="sliding-empty-card">
        <div class="sliding-empty-icon">🌾</div>
        <div class="sliding-empty-content">
          <h3 class="h5 mb-1 text-forest fw-bold">Fresh Harvest Batches Arriving Soon!</h3>
          <p class="mb-2 text-secondary">Our stone mills in Hyderabad are freshly preparing new unpolished millet powder batches. Check back soon or contact us directly.</p>
          <div class="d-flex gap-2 flex-wrap mt-3">
            <a href="/contact" class="btn btn-sm btn-brand">Ask about restock</a>
            <a href="https://whatsapp.com/channel/0029Vb909Ye7oQhkdutTQM24" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-brand">Follow WhatsApp Updates</a>
          </div>
        </div>
      </div>
    </div>`;
  return `<div class="row g-4">${products.map((product) => `<div class="col-md-6 col-lg-4">${productCard(product)}</div>`).join('')}</div>`;
}

async function renderHome() {
  const [data, reviewsRes] = await Promise.all([
    api('/api/products').catch(() => ({ products: [] })),
    api('/api/reviews').catch(() => ({ reviews: [] })),
  ]);
  const products = data.products || [];
  const realReviews = (reviewsRes.reviews || []).filter((r) => r.isApproved !== false && r.comment);

  appRoot.innerHTML = `
    <!-- Clean Minimal Hero -->
    <section class="hero scroll-reveal-item position-relative overflow-hidden py-4">
      <div class="container">
        <div class="row align-items-center gy-4">
          <div class="col-lg-7">
            <div class="hero-badge-pill mb-3">
              <span class="badge-dot"></span>
              <span>100% Native Stone-Ground Millets</span>
            </div>
            <h1 class="hero-main-title">Pure Millets, Healthy Living.</h1>
            <p class="hero-copy">
              100% pure stone-ground unpolished millets freshly prepared in Hyderabad. Wholesome daily nutrition for your entire family.
            </p>
            <div class="d-flex flex-wrap gap-2 my-3">
              <span class="hero-tag">🌾 100% Unpolished</span>
              <span class="hero-tag">⚙️ Stone-Ground</span>
              <span class="hero-tag">🌿 Gluten-Free</span>
              <span class="hero-tag">💵 COD Available</span>
            </div>
            <div class="d-flex flex-wrap gap-3 mt-4">
              ${buttonLink('/shop', 'Shop Fresh Millets →', 'btn-brand btn-lg shadow-sm')}
              ${buttonLink('/recipes', 'Usage Ideas 🍲', 'btn-outline-brand btn-lg')}
            </div>
          </div>
          <div class="col-lg-5 text-center">
            <div class="hero-brand-card position-relative">
              <img src="/images/br-millet-choice-logo.png" alt="BR Millets Choice" width="480" height="480" class="img-fluid hero-logo-img">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4 Quick Trust Badges -->
    <section class="trust-strip py-4 scroll-reveal-item">
      <div class="container">
        <div class="row gy-3">
          <div class="col-6 col-md-3">
            <div class="trust-item">
              <span class="trust-icon" aria-hidden="true">🌾</span>
              <div>
                <strong>100% Pure &amp; Raw</strong>
                <small>Unpolished with bran</small>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="trust-item">
              <span class="trust-icon" aria-hidden="true">⚙️</span>
              <div>
                <strong>Stone-Ground</strong>
                <small>Traditional milling</small>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="trust-item">
              <span class="trust-icon" aria-hidden="true">🩺</span>
              <div>
                <strong>Diabetic Friendly</strong>
                <small>Rich in natural fiber</small>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="trust-item">
              <span class="trust-icon" aria-hidden="true">🚚</span>
              <div>
                <strong>Direct Delivery</strong>
                <small>Cash on Delivery</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Live Products on Homepage -->
    <section class="section-space scroll-reveal-item">
      <div class="container">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <p class="eyebrow mb-1">Our Products</p>
            <h2 class="section-heading mb-0">Fresh Millet Flour &amp; Grains</h2>
          </div>
          ${buttonLink('/shop', 'View all products →', 'btn-outline-brand')}
        </div>
        ${cardGrid(products)}
      </div>
    </section>

    <!-- Real Customer Reviews Only -->
    ${realReviews.length ? `
    <section class="section-space soft-section scroll-reveal-item">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <p class="eyebrow mb-1">Customer Feedback</p>
            <h2 class="section-heading mb-0">What Customers Say</h2>
          </div>
          <a href="/about" class="btn btn-sm btn-outline-brand">View all →</a>
        </div>
        <div class="row g-3">
          ${realReviews.slice(0, 3).map((r) => `
            <div class="col-md-4">
              <div class="feature-card p-4 h-100 bg-white border rounded-3 shadow-sm">
                <div class="text-warning mb-2">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
                ${r.title ? `<h3 class="h6 fw-bold mb-2">${escapeHtml(r.title)}</h3>` : ''}
                <p class="small text-secondary mb-3">${escapeHtml(r.comment)}</p>
                <div class="small fw-semibold text-dark">${escapeHtml(r.customerName || 'Verified Customer')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>` : ''}

    <!-- Quick Help & WhatsApp Callout -->
    <section class="home-contact-cta scroll-reveal-item my-4">
      <div class="container d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 class="h4 mb-1 text-forest fw-bold">Need Help or Want to Order Directly?</h2>
          <p class="mb-0 text-secondary">Chat with BR Millet Choice on WhatsApp for instant orders, pack details, and delivery assistance.</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <a class="btn btn-success" href="https://wa.me/917893176982?text=${encodeURIComponent('Hello BR Millet Choice, I would like to inquire about fresh millets.')}" target="_blank" rel="noopener noreferrer">💬 Chat on WhatsApp</a>
          <a class="btn btn-outline-brand" href="https://whatsapp.com/channel/0029Vb909Ye7oQhkdutTQM24" target="_blank" rel="noopener noreferrer">📢 Follow Channel</a>
        </div>
      </div>
    </section>
  `;
  markViewedPage();
  void refreshCartBadge();
}

async function renderShop() {
  const search = new URLSearchParams(location.search).get('q') ?? '';
  const data = await api(`/api/products${search ? `?q=${encodeURIComponent(search)}` : ''}`);
  let currentProducts = data.products || [];
  let activeFilter = 'all';
  let activeSort = 'featured';

  function filterAndSortProducts() {
    let result = [...currentProducts];
    if (activeFilter !== 'all') {
      const q = activeFilter.toLowerCase();
      result = result.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      });
    }
    if (activeSort === 'price-asc') {
      result.sort((a, b) => {
        const pA = a.variants?.[0]?.pricePaise ?? 0;
        const pB = b.variants?.[0]?.pricePaise ?? 0;
        return pA - pB;
      });
    } else if (activeSort === 'price-desc') {
      result.sort((a, b) => {
        const pA = a.variants?.[0]?.pricePaise ?? 0;
        const pB = b.variants?.[0]?.pricePaise ?? 0;
        return pB - pA;
      });
    } else if (activeSort === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return result;
  }

  function updateShopGrid() {
    const gridContainer = appRoot.querySelector('[data-shop-grid]');
    if (gridContainer) {
      gridContainer.innerHTML = cardGrid(filterAndSortProducts());
    }
  }

  appRoot.innerHTML = `${pageHeader('The Shop', 'Millet Powder Products', 'Choose a product to see its pack options, stone-ground details and current stock availability.')}
    <section class="container section-space">
      <div class="shop-filter-bar mb-4 p-3 bg-white border rounded-4 shadow-sm">
        <form class="d-flex gap-2 mb-3" data-form="shop-search">
          <input class="form-control form-control-sm" name="q" value="${escapeHtml(search)}" placeholder="Search millets (ragi, foxtail, jowar...)">
          <button class="btn btn-sm btn-brand text-nowrap" type="submit">Search</button>
          ${search ? '<a href="/shop" class="btn btn-sm btn-outline-secondary text-nowrap">Clear</a>' : ''}
        </form>
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="shop-category-pills">
            <button type="button" class="filter-pill active" data-category-filter="all">All Millets</button>
            <button type="button" class="filter-pill" data-category-filter="ragi">Ragi (Finger)</button>
            <button type="button" class="filter-pill" data-category-filter="foxtail">Foxtail</button>
            <button type="button" class="filter-pill" data-category-filter="jowar">Jowar</button>
            <button type="button" class="filter-pill" data-category-filter="bajra">Bajra</button>
            <button type="button" class="filter-pill" data-category-filter="little">Little Millet</button>
          </div>
          <div class="shop-sort-compact d-flex align-items-center gap-1 ms-auto">
            <label class="small text-secondary text-nowrap" for="shop-sort">Sort:</label>
            <select class="form-select form-select-sm" id="shop-sort" data-shop-sort style="width:auto">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>
      <div data-shop-grid>
        ${cardGrid(filterAndSortProducts())}
      </div>
    </section>`;

  appRoot.querySelectorAll('[data-category-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      appRoot.querySelectorAll('[data-category-filter]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.categoryFilter;
      updateShopGrid();
    });
  });

  appRoot.querySelector('[data-shop-sort]')?.addEventListener('change', (e) => {
    activeSort = e.target.value;
    updateShopGrid();
  });
}

async function renderProduct(slug) {
  const [{ product }, reviewsData] = await Promise.all([
    api(`/api/products/${encodeURIComponent(slug)}`),
    api(`/api/products/${encodeURIComponent(slug)}/reviews`).catch(() => ({ reviews: [], totalCount: 0, averageRating: 0 })),
  ]);
  const image = product.images?.[0];
  const variants = product.variants ?? [];
  const firstAvailable = variants.find((variant) => variant.stockQuantity > 0) ?? variants[0];
  const ratingRound = Math.round(reviewsData.averageRating || 5);
  const starsHtml = '★'.repeat(ratingRound) + '☆'.repeat(5 - ratingRound);

  appRoot.innerHTML = `
    <section class="container section-space product-detail-page">
      <nav class="breadcrumb-nav mb-4" aria-label="Breadcrumb">
        <a href="/">Home</a> <span class="mx-1">/</span>
        <a href="/shop">Products</a> <span class="mx-1">/</span>
        <span class="text-secondary">${escapeHtml(product.name)}</span>
      </nav>

      <div class="row g-4 g-lg-5 align-items-start">
        <!-- Product Visual / Gallery -->
        <div class="col-lg-6">
          <div class="product-visual-card position-relative bg-white p-3 rounded-4 border shadow-sm">
            <span class="badge bg-success-subtle text-success position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill fw-semibold border border-success-subtle">
              🌾 100% Stone-Ground
            </span>
            <div class="product-main-image-wrap text-center py-2">
              ${image ? `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.altText || product.name)}" class="img-fluid rounded-3 product-zoom-img">` : '<div class="product-placeholder-box"><span class="fs-1">🌾</span><p class="text-secondary small mt-2">100% Pure Millet Powder</p></div>'}
            </div>
          </div>
          <div class="product-perks-row mt-3 d-flex gap-2 text-center">
            <div class="perk-box flex-fill p-2 rounded-3 bg-light border"><span class="small fw-bold d-block">🚫 Zero Bleach</span><span class="small text-secondary">Chemical-free</span></div>
            <div class="perk-box flex-fill p-2 rounded-3 bg-light border"><span class="small fw-bold d-block">⚙️ Cold Milled</span><span class="small text-secondary">Retains oils</span></div>
            <div class="perk-box flex-fill p-2 rounded-3 bg-light border"><span class="small fw-bold d-block">🌿 Whole Bran</span><span class="small text-secondary">High fiber</span></div>
          </div>
        </div>

        <!-- Product Purchase Information -->
        <div class="col-lg-6">
          <div class="product-summary-card">
            <span class="badge bg-light text-secondary border px-3 py-1 rounded-pill mb-2">${escapeHtml(product.category || 'Millet Powders')}</span>
            <h1 class="h2 fw-bold text-dark mb-2">${escapeHtml(product.name)}</h1>
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="text-warning fs-5">${starsHtml}</span>
              <strong class="text-dark">${reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '5.0'} / 5</strong>
              <span class="text-secondary small">(${reviewsData.totalCount} verified review${reviewsData.totalCount === 1 ? '' : 's'})</span>
            </div>

            <div class="product-price-box p-3 bg-light rounded-3 border mb-4 d-flex align-items-center justify-content-between">
              <div>
                <span class="small text-secondary d-block">Special Price</span>
                <strong class="fs-2 text-success" data-product-price>${firstAvailable ? money(firstAvailable.pricePaise) : 'Contact for price'}</strong>
                <span class="small text-secondary d-block">Inclusive of all taxes</span>
              </div>
              <div>
                <span class="availability ${firstAvailable?.availability ?? ''}" data-product-stock>
                  ${firstAvailable?.availability === 'out_of_stock' ? 'Out of stock' : firstAvailable?.availability === 'low_stock' ? 'Low stock' : firstAvailable ? 'In stock' : 'Unavailable'}
                </span>
              </div>
            </div>

            <!-- Pack Size Selection Pills -->
            <div class="mb-4">
              <label class="form-label fw-bold small text-dark d-block">Select Pack Size:</label>
              <div class="pack-size-pills d-flex flex-wrap gap-2" data-pack-selector>
                ${variants.map((variant) => `
                  <button type="button" class="btn pack-pill ${variant.id === firstAvailable?.id ? 'active' : ''}" data-variant-btn="${escapeHtml(variant.id)}" data-price="${escapeHtml(variant.pricePaise)}" data-stock="${escapeHtml(variant.stockQuantity)}" data-availability="${escapeHtml(variant.availability)}">
                    ${escapeHtml(variant.packSize)}
                  </button>
                `).join('')}
              </div>
              <select id="variant-select" class="d-none" ${variants.length ? '' : 'disabled'}>
                ${variants.map((v) => `<option value="${escapeHtml(v.id)}" data-price="${escapeHtml(v.pricePaise)}" data-stock="${escapeHtml(v.stockQuantity)}" data-availability="${escapeHtml(v.availability)}">${escapeHtml(v.packSize)}</option>`).join('')}
              </select>
            </div>

            <!-- Quantity & Actions -->
            <div class="product-actions-box mb-4">
              <div class="d-flex align-items-center gap-3 mb-3">
                <span class="fw-bold small text-dark">Quantity:</span>
                <div class="quantity-stepper d-inline-flex align-items-center border rounded-3 bg-white">
                  <button type="button" class="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none" data-qty-dec>−</button>
                  <input id="product-quantity" class="form-control text-center border-0 p-0 fw-bold" style="width: 44px;" type="number" min="1" max="99" value="1">
                  <button type="button" class="btn btn-sm btn-link text-dark px-3 py-1 text-decoration-none" data-qty-inc>+</button>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-outline-brand btn-lg flex-fill fw-bold" data-add-to-cart="${escapeHtml(firstAvailable?.id ?? '')}" ${!firstAvailable || firstAvailable.stockQuantity < 1 ? 'disabled' : ''}>
                  🛒 Add to Cart
                </button>
                <button class="btn btn-brand btn-lg flex-fill fw-bold" data-buy-now="${escapeHtml(firstAvailable?.id ?? '')}" ${!firstAvailable || firstAvailable.stockQuantity < 1 ? 'disabled' : ''}>
                  ⚡ Buy Now
                </button>
              </div>
              ${firstAvailable?.availability === 'out_of_stock' ? `<button class="btn btn-outline-brand w-100 mt-2" data-restock="${escapeHtml(firstAvailable.id)}">Notify me when available</button>` : ''}
            </div>

            <!-- Delivery & Payment reassurance -->
            <div class="p-3 bg-light rounded-3 border mb-4">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fs-5">🚚</span>
                <strong class="small text-dark">Free Hyderabad Delivery on orders over ₹500</strong>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="fs-5">💵</span>
                <span class="small text-secondary">Cash on Delivery (COD) &amp; Instant UPI accepted</span>
              </div>
            </div>

            <!-- Product details accordion -->
            <div class="product-info-tabs">
              <details class="product-accordion-item border rounded-3 p-3 mb-2 bg-white" open>
                <summary class="fw-bold text-dark" style="cursor:pointer">Description &amp; Benefits</summary>
                <p class="small text-secondary mt-2 mb-0">${escapeHtml(product.description || 'Pure stone-ground millet powder with natural dietary fiber and rich mineral content.')}</p>
              </details>
              ${product.ingredients ? `
                <details class="product-accordion-item border rounded-3 p-3 mb-2 bg-white">
                  <summary class="fw-bold text-dark" style="cursor:pointer">Ingredients &amp; Sourcing</summary>
                  <p class="small text-secondary mt-2 mb-0">${escapeHtml(product.ingredients)}</p>
                </details>
              ` : ''}
              ${product.storage_instructions ? `
                <details class="product-accordion-item border rounded-3 p-3 mb-2 bg-white">
                  <summary class="fw-bold text-dark" style="cursor:pointer">Storage Instructions</summary>
                  <p class="small text-secondary mt-2 mb-0">${escapeHtml(product.storage_instructions)}</p>
                </details>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <hr class="my-5">
      <div class="product-reviews-section">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h2 class="h3 mb-1">Customer Reviews &amp; Ratings</h2>
            <div class="d-flex align-items-center gap-2">
              <span class="text-warning fs-4">${starsHtml}</span>
              <strong>${reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : '5.0'} out of 5</strong>
              <span class="text-secondary">(${reviewsData.totalCount} review${reviewsData.totalCount === 1 ? '' : 's'})</span>
            </div>
          </div>
          <details class="w-100 mt-2">
            <summary class="btn btn-outline-brand">✍️ Write a Customer Review</summary>
            <div class="feature-card p-4 border rounded-3 bg-light mt-3">
              <h3 class="h5 mb-3">Share your feedback for ${escapeHtml(product.name)}</h3>
              <form data-form="submit-review" data-product-slug="${escapeHtml(slug)}">
                <div class="mb-3">
                  <label class="form-label fw-semibold" for="review-rating">Overall Rating</label>
                  <select class="form-select w-auto" id="review-rating" name="rating" required>
                    <option value="5" selected>★★★★★ 5 - Excellent, loved it!</option>
                    <option value="4">★★★★☆ 4 - Very good</option>
                    <option value="3">★★★☆☆ 3 - Good / Average</option>
                    <option value="2">★★☆☆☆ 2 - Below expectations</option>
                    <option value="1">★☆☆☆☆ 1 - Poor</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold" for="review-title">Review Headline (optional)</label>
                  <input class="form-control" id="review-title" name="title" placeholder="e.g. Pure, aromatic and fresh millet flour!" maxlength="120">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-semibold" for="review-comment">Your Review / Experience</label>
                  <textarea class="form-control" id="review-comment" name="comment" rows="3" placeholder="Tell us about the freshness, taste, or how you cooked it..." required minlength="5" maxlength="1500"></textarea>
                  <div class="form-text">Minimum 5 characters. Authentic feedback helps other families make healthy choices.</div>
                </div>
                <button class="btn btn-brand" type="submit">Publish Review</button>
              </form>
            </div>
          </details>
        </div>

        <div class="reviews-list mt-3">
          ${reviewsData.reviews.length ? reviewsData.reviews.map((r) => `
            <article class="p-3 mb-3 bg-white border rounded-3 shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex align-items-center gap-2">
                  <span class="text-warning">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                  <strong class="text-dark">${escapeHtml(r.customerName)}</strong>
                  <span class="badge bg-success-subtle text-success border border-success-subtle">Verified Customer</span>
                </div>
                <span class="small text-secondary">${new Date(r.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              ${r.title ? `<h4 class="h6 fw-bold mb-1">${escapeHtml(r.title)}</h4>` : ''}
              <p class="mb-0 text-secondary">${escapeHtml(r.comment)}</p>
            </article>
          `).join('') : '<div class="p-4 bg-light rounded text-center text-secondary">No customer reviews yet. Be the first to share your experience with this millet product!</div>'}
        </div>
      </div>
    </section>`;

  // Handle pack pill selection
  document.querySelectorAll('[data-variant-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-variant-btn]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const variantId = btn.dataset.variantBtn;
      const pricePaise = btn.dataset.price;
      const stock = Number(btn.dataset.stock);
      const avail = btn.dataset.availability;

      document.querySelector('[data-product-price]').textContent = money(pricePaise);
      const stockEl = document.querySelector('[data-product-stock]');
      stockEl.textContent = avail.replaceAll('_', ' ');
      stockEl.className = `availability ${avail}`;

      const addBtn = document.querySelector('[data-add-to-cart]');
      const buyBtn = document.querySelector('[data-buy-now]');
      if (addBtn) {
        addBtn.dataset.addToCart = variantId;
        addBtn.disabled = stock < 1;
      }
      if (buyBtn) {
        buyBtn.dataset.buyNow = variantId;
        buyBtn.disabled = stock < 1;
      }
    });
  });

  // Quantity stepper
  const qtyInput = document.querySelector('#product-quantity');
  document.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.min(99, Number(qtyInput.value) + 1);
  });

  markViewedPage(product);
}

function renderMilletsPage() {
  const milletsList = [
    { name: 'Foxtail Millet', telugu: 'Korra', hindi: 'Kangni', badge: 'Diabetic Friendly', icon: '🌾', color: '#15803d', bg: '#f0fdf4', query: 'foxtail' },
    { name: 'Finger Millet', telugu: 'Ragi', hindi: 'Mandua / Nachani', badge: 'High Calcium & Bone Strength', icon: '🥣', color: '#b45309', bg: '#fef3c7', query: 'ragi' },
    { name: 'Pearl Millet', telugu: 'Sajjalu', hindi: 'Bajra', badge: 'Energy & Iron Rich', icon: '⚡', color: '#c2410c', bg: '#fff7ed', query: 'bajra' },
    { name: 'Sorghum', telugu: 'Jonnalu', hindi: 'Jowar', badge: 'Gluten-Free Daily Staple', icon: '🌿', color: '#047857', bg: '#ecfdf5', query: 'jowar' },
    { name: 'Little Millet', telugu: 'Samalu', hindi: 'Sama / Kutki', badge: 'Weight Balance & Detox', icon: '🍃', color: '#0369a1', bg: '#f0f9ff', query: 'little' },
    { name: 'Barnyard Millet', telugu: 'Udalu', hindi: 'Sanwa', badge: 'Highest Dietary Fiber', icon: '🍲', color: '#4338ca', bg: '#eef2ff', query: 'barnyard' },
    { name: 'Kodo Millet', telugu: 'Arikelu', hindi: 'Kodra', badge: 'Antioxidant Powerhouse', icon: '✨', color: '#6d28d9', bg: '#f5f3ff', query: 'kodo' },
    { name: 'Proso Millet', telugu: 'Varigalu', hindi: 'Barri', badge: 'High Protein & Nerves', icon: '🧠', color: '#be185d', bg: '#fdf2f8', query: 'proso' },
  ];

  appRoot.innerHTML = `${pageHeader('Superfoods of India', 'Traditional Millets', 'Pure, unpolished, stone-ground ancient grains for wholesome daily nutrition.')}
    <section class="container section-space">
      <div class="millet-simple-grid">
        ${milletsList.map((m) => `
          <a class="millet-simple-card" href="/shop?q=${encodeURIComponent(m.query)}" style="background:${m.bg};">
            <span class="millet-simple-icon" aria-hidden="true">${m.icon}</span>
            <h2 class="h5 mb-1 text-dark fw-bold">${escapeHtml(m.name)}</h2>
            <div class="small text-secondary mb-2">
              <strong>${escapeHtml(m.telugu)}</strong> (Telugu) • <strong>${escapeHtml(m.hindi)}</strong> (Hindi)
            </div>
            <span class="millet-simple-badge" style="background:${m.color};color:#fff;">${escapeHtml(m.badge)}</span>
          </a>
        `).join('')}
      </div>
    </section>`;
}

async function renderAboutPage() {
  let reviewsList = [];
  try {
    const res = await api('/api/reviews');
    reviewsList = res.reviews || [];
  } catch {}

  const storiesToDisplay = reviewsList.map((r) => ({
    title: r.title || `Review on ${r.productName || 'BR Millets'}`,
    author: r.customerName || 'Verified Customer',
    location: `${r.productName || 'Pure Millets'} • Verified Purchase`,
    rating: r.rating || 5,
    story: r.comment,
  }));

  appRoot.innerHTML = `${pageHeader('Wholesome Living', 'Our Story & Real Customer Journeys', 'From farm fields to your kitchen table — 100% stone-ground unpolished millet goodness crafted in Hyderabad.')}
    <section class="container section-space">
      <div class="row align-items-center gy-4 mb-5">
        <div class="col-lg-6">
          <p class="eyebrow mb-2">The BR Millet Choice Philosophy</p>
          <h2 class="h3 mb-3">Reviving Ancient Indian Grains For Modern Vitality</h2>
          <p class="lead text-secondary">BR Millet Choice was founded in Hyderabad with a singular mission: to eliminate adulterated, machine-polished grains and bring pure, uncompromised, farm-fresh millets back to Indian family dining tables.</p>
          <p class="text-secondary">We partner directly with sustainable dryland millet farmers across Telangana and Andhra Pradesh. Each harvest is thoroughly cleaned, de-stoned, sun-dried, and slowly cold stone-ground in small hygienic batches. This time-honored slow grinding process protects delicate grain oils and dietary fibers from heat destruction.</p>
        </div>
        <div class="col-lg-6">
          <div class="p-4 p-md-5 rounded-4 bg-light border">
            <h3 class="h5 mb-3 text-dark">Our 4 Core Quality Promises</h3>
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="fs-4" aria-hidden="true">🌾</span>
              <div>
                <strong>100% Whole &amp; Unpolished</strong>
                <p class="small text-secondary mb-0">Zero artificial polishing, keeping all dietary fiber, iron, and minerals intact.</p>
              </div>
            </div>
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="fs-4" aria-hidden="true">⚙️</span>
              <div>
                <strong>Traditional Cold Stone-Ground</strong>
                <p class="small text-secondary mb-0">Slow-speed milling prevents friction heat and preserves natural grain nutrition.</p>
              </div>
            </div>
            <div class="d-flex align-items-start gap-3 mb-3">
              <span class="fs-4" aria-hidden="true">🚫</span>
              <div>
                <strong>Zero Preservatives or Additives</strong>
                <p class="small text-secondary mb-0">No synthetic anti-caking agents, no bleaching, 100% pure whole grains.</p>
              </div>
            </div>
            <div class="d-flex align-items-start gap-3">
              <span class="fs-4" aria-hidden="true">🚚</span>
              <div>
                <strong>Fresh Weekly Batches in Hyderabad</strong>
                <p class="small text-secondary mb-0">Milled fresh every single week and delivered directly to your doorstep.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Moving Customer Reviews / Success Stories Marquee with Real Customer Feedback -->
      <div class="stories-section my-5 pt-3">
        <div class="text-center mb-4">
          <p class="eyebrow mb-1">Customer Reviews &amp; Feedback</p>
          <h2 class="h3">Real Families, Real Health Feedback</h2>
          <p class="text-secondary small">Real feedback submitted by customers. Hover over any card to pause and read.</p>
        </div>

        ${storiesToDisplay.length ? `
        <div class="stories-marquee-wrapper" aria-label="Customer transformation stories marquee">
          <div class="stories-track">
            ${[...storiesToDisplay, ...storiesToDisplay].map((story) => `
              <article class="story-card">
                <div>
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-warning fw-bold">${'★'.repeat(story.rating || 5)}</span>
                    <span class="badge bg-success-subtle text-success small">Verified Feedback</span>
                  </div>
                  <h3 class="h6 mb-2 text-dark">${escapeHtml(story.title)}</h3>
                  <p class="small text-secondary mb-3">"${escapeHtml(story.story)}"</p>
                </div>
                <div class="border-top pt-2 mt-auto d-flex align-items-center gap-2">
                  <div class="account-avatar" style="width:32px;height:32px;font-size:0.85rem;" aria-hidden="true">${escapeHtml(story.author.slice(0, 1).toUpperCase())}</div>
                  <div>
                    <strong class="d-block small text-dark">${escapeHtml(story.author)}</strong>
                    <span class="small text-secondary">${escapeHtml(story.location)}</span>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        </div>` : '<div class="p-4 bg-light rounded text-center text-secondary">No customer reviews yet. Be the first to share your experience with BR Millets on any product page!</div>'}
      </div>

      <div class="text-center mt-5">
        <a class="btn btn-brand btn-lg px-4" href="/shop">Experience Pure Millets Today ➔</a>
      </div>
    </section>`;
}

function renderIdeas() {
  appRoot.innerHTML = `
    ${pageHeader('Usage Ideas & Recipes', 'Cook Delicious with Pure Millets', 'Discover easy traditional and modern recipes made with 100% stone-ground millets. Nutritious, gluten-free, and loved by families.')}
    <section class="container section-space">
      <div class="row g-4 mb-5">
        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">Breakfast • 10 mins</span>
              <span class="fs-4">🥣</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Traditional Ragi Malt (Ambali)</h3>
            <p class="small text-secondary mb-3">Cooling, calcium-rich morning drink loved across Telangana and Andhra. Perfect for daily energy and bone strength.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">2 tbsp Finger Millet (Ragi) Powder, 1.5 cups water, fresh buttermilk, crushed shallots, roasted cumin powder &amp; pinch of rock salt.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Mix Ragi flour in cold water without lumps. Simmer on low flame for 4 mins until glossy. Let cool, whisk in churned buttermilk, crushed cumin &amp; salt. Serve fresh!
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop Stone-Ground Ragi Flour →</a>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fw-semibold">Lunch / Tiffin • 20 mins</span>
              <span class="fs-4">🥞</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Foxtail Millet Idli &amp; Crispy Dosa</h3>
            <p class="small text-secondary mb-3">Golden, light, and digestible dosas and idlis without white rice. High dietary fiber with low glycemic index for diabetic wellness.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">2 cups Foxtail Millet (Kangni) Flour, 1/2 cup Urad dal, 1 tsp fenugreek seeds, salt to taste, pure sesame oil.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Combine foxtail flour with fermented urad batter. Steam for 10 minutes in idli molds for fluffy idlis, or pour thin onto a hot cast-iron tawa for golden crispy dosas.
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop Foxtail Millet Flour →</a>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-info-subtle text-info border border-info-subtle rounded-pill px-3 py-1 fw-semibold">Dinner • 25 mins</span>
              <span class="fs-4">🍲</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Wholesome Little Millet Pongal</h3>
            <p class="small text-secondary mb-3">Fragrant, gut-soothing comfort meal tempered with pure desi ghee, black peppercorns, crushed ginger, and roasted cashews.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">1 cup Little Millet (Samai), 1/2 cup yellow moong dal, 2 tbsp pure cow ghee, whole peppercorns, curry leaves, ginger, cashews.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Pressure cook little millet &amp; moong dal with 4 cups water. Temper cumin, black pepper, ginger, and cashews in ghee; pour sizzling hot over pongal and mix well.
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop Little Millet Flour →</a>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fw-semibold">Gluten-Free • 15 mins</span>
              <span class="fs-4">🫓</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Authentic Jowar Bhakri (Rotla)</h3>
            <p class="small text-secondary mb-3">Traditional sorghum flatbread. Naturally 100% gluten-free, light on digestion, and keeps hunger satiated for hours.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">2 cups stone-ground Jowar Flour, 1 cup hot boiling water, pinch of sea salt.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Knead jowar flour with boiling water into a smooth, pliable dough. Hand-pat into circles, transfer to hot tawa, smear water on top, flip and roast both sides till puffed.
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop Pure Jowar Flour →</a>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-1 fw-semibold">Winter Superfood • 20 mins</span>
              <span class="fs-4">🌾</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Bajra (Pearl Millet) Methi Poori / Roti</h3>
            <p class="small text-secondary mb-3">Iron-loaded flatbreads flavored with fresh fenugreek leaves, crushed green chili, and roasted sesame seeds. Natural winter warmth.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">1.5 cups Bajra Flour, 1/2 cup fresh methi leaves, 1 tsp carom seeds (ajwain), 1 tbsp white sesame seeds, warm water.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Mix ingredients and knead soft. Roll gently with dry flour dusting. Roast on tawa with a drizzle of cold-pressed oil or ghee until speckled golden brown.
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop Pearl Millet (Bajra) →</a>
            </div>
          </div>
        </div>

        <div class="col-md-6 col-lg-4">
          <div class="feature-card recipe-card h-100 p-4 border rounded-4 shadow-sm bg-white d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fw-semibold">Healthy Sweet • 15 mins</span>
              <span class="fs-4">🍬</span>
            </div>
            <h3 class="h5 fw-bold text-forest mb-2">Millet Dry-Fruit Power Ladoos</h3>
            <p class="small text-secondary mb-3">No refined sugar, no additives. Made with slow-roasted mixed millets, organic jaggery, pure ghee, and roasted almonds &amp; walnuts.</p>
            <div class="recipe-meta-box p-3 bg-light rounded-3 mb-3 small">
              <div class="fw-bold text-dark mb-1">🛒 Key Ingredients:</div>
              <p class="text-secondary mb-0">1 cup Ragi or Multi-millet flour, 1/2 cup grated organic jaggery, 1/4 cup pure cow ghee, cardamom powder, chopped almonds &amp; cashews.</p>
            </div>
            <div class="recipe-steps small mb-4 text-secondary">
              <strong>Quick Steps:</strong> Roast millet flour in ghee on low heat for 8 mins till aromatic. Add warm melted jaggery, cardamom and nuts. Shape into round bite-sized ladoos while warm!
            </div>
            <div class="mt-auto">
              <a href="/shop" class="btn btn-sm btn-outline-brand w-100">Shop All Pure Millets →</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Cooking Tips Banner -->
      <div class="p-4 p-lg-5 bg-cream rounded-4 border shadow-sm">
        <div class="row align-items-center gy-3">
          <div class="col-lg-8">
            <span class="eyebrow mb-1">Kitchen Guide</span>
            <h2 class="h3 fw-bold text-forest mb-2">Golden Rules for Cooking With Stone-Ground Millets</h2>
            <ul class="text-secondary small mb-0 ps-3">
              <li class="mb-1"><strong>Kneading tip:</strong> Use warm or boiling water when making gluten-free flatbreads (Jowar &amp; Bajra) to release natural starches for pliable, soft dough.</li>
              <li class="mb-1"><strong>Digestibility:</strong> Stone-ground millets are naturally high in fiber; always allow cooked porridge or malt to cool slightly before serving.</li>
              <li><strong>Storage:</strong> Store stone-ground powders in a cool, dry, airtight container away from moisture to preserve the natural grain oils.</li>
            </ul>
          </div>
          <div class="col-lg-4 text-lg-end">
            <a href="/shop" class="btn btn-brand btn-lg">Browse All Millets Online</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderContentPage(route) {
  const pages = {
    '/about': ['Our story', 'BR Millet Choice is a millet powder business. This page will share the owner-approved story, sourcing and preparation information when supplied. No certification, origin or health claims are implied.'],
    '/millets': ['Millet information', 'Millets are grains used in a range of regional food traditions. The variety, ingredients and processing details of each BR Millet Choice product are listed on that product page when verified by the business.'],
    '/recipes': ['Usage ideas', 'Use each product according to its label and your own recipe. Product-specific quantities and cooking instructions will be added only after the business supplies and approves them.'],
    '/faq': ['Frequently asked questions', '<strong>Is an order request confirmed immediately?</strong><p>No. It is first recorded as awaiting availability confirmation. The business confirms an order before fulfilment.</p><strong>Which pack sizes are available?</strong><p>Available pack sizes are shown on each active product.</p><strong>How do I pay?</strong><p>Available methods depend on owner configuration. Online card payments are not enabled in this version.</p><strong>How can I cancel?</strong><p>Eligible requests can be cancelled from My Orders. For later order stages, contact the business.</p><strong>Where is my delivery information?</strong><p>Delivery is coordinated after the team reviews your request. Shipping estimates are not shown until supported by the business.</p>'],
    '/shipping': ['Shipping and delivery', 'Delivery options, costs and time estimates have not yet been supplied by the owner. An order request remains awaiting confirmation until the team verifies availability and coordinates delivery. Please contact the business before relying on a delivery date.'],
    '/refunds': ['Cancellation and refunds', 'A customer may cancel an order request before it reaches a fulfilment stage where cancellation is allowed. Payment/refund details depend on the payment method and must be coordinated with the business. No online payment processing is enabled. Ask the business to confirm any refund before assuming it is complete.'],
    '/privacy': ['Privacy policy', 'The application stores account details, saved delivery addresses, customer enquiries, order snapshots, inventory records and notifications needed to provide the service. Customers can access their own account data; administrators can access data needed to fulfil orders and support customers. Passwords are hashed. Analytics is only loaded after consent when configured. Contact-page maps use OpenStreetMap tiles; the map provider may receive your IP address and the map area requested by your browser. Contact the business using its verified contact details to ask about your data or request account deletion. The owner must review and complete this policy, including retention periods and verified contact details, before launch.'],
    '/terms': ['Terms and conditions', 'Submitting an order creates an order request, not an immediate acceptance or confirmed delivery. The business must confirm availability and coordinate delivery. Product information, price and payment method are shown before submission; the order stores a snapshot of the requested items. The owner must provide and legally review final business terms, including pricing, tax, shipping, cancellation and dispute terms, before launch.'],
  };
  const [title, body] = pages[route];
  appRoot.innerHTML = `${pageHeader('BR Millet Choice', title)}
    <section class="container content-shell"><div class="notice mb-4">Owner review required: business-specific details and final policy terms must be approved before public launch.</div><div class="policy-copy">${body}</div>${route === '/about' || route === '/recipes' ? `<div class="mt-4">${buttonLink('/shop', 'Browse products')}</div>` : ''}</section>`;
}

function renderContact() {
  appRoot.innerHTML = `${pageHeader('We are here to help', 'Contact BR Millet Choice', 'Send a product, order or general enquiry.')}
    <section class="container section-space"><div class="row g-4 g-lg-5 align-items-start"><div class="col-xl-7"><form class="form-shell contact-form" data-form="contact"><h2 class="h4 mb-4"><svg class="contact-heading-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>Send us a message</h2><div class="row g-3"><div class="col-md-6"><label class="form-label" for="contact-name">Your name</label><input class="form-control" id="contact-name" name="name" autocomplete="name" required maxlength="100"></div><div class="col-md-6"><label class="form-label" for="contact-email">Email address</label><input class="form-control" id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254"></div><div class="col-12"><label class="form-label" for="contact-subject">Subject</label><input class="form-control" id="contact-subject" name="subject" required maxlength="120"></div><div class="col-12"><label class="form-label" for="contact-message">Message</label><textarea class="form-control" id="contact-message" name="message" rows="5" required minlength="10" maxlength="2000"></textarea></div><div class="col-12"><button class="btn btn-brand" type="submit">Send enquiry</button><p class="small text-secondary mt-3 mb-0">Your enquiry is recorded for the BR Millet Choice team. Email acknowledgements are sent when email is configured.</p></div></div></form></div><div class="col-xl-5"><div class="feature-card contact-card"><p class="eyebrow mb-2">Get in touch</p><h2 class="h4 mb-2">Contact us directly</h2><p class="contact-card-intro">Choose the option that works best for you. The footer also links to this contact page.</p><div data-contact-details class="text-secondary">Loading business contact details…</div><section class="location-map-card mt-4" data-location-map aria-label="Business location" hidden></section></div></div></div></section>`;
  updateSupportDetails();
}

function initializeGoogleMapPicker() {
  const frame = document.querySelector('#admin-google-maps-frame');
  if (!frame) return;
  const form = frame.closest('form');
  const addressInput = form.elements.namedItem('address');
  const latitudeInput = form.elements.namedItem('latitude');
  const longitudeInput = form.elements.namedItem('longitude');
  const status = form.querySelector('[data-business-location-status]');
  const extLink = document.querySelector('#admin-google-maps-link');

  const updatePreview = () => {
    const address = addressInput?.value.trim() || '';
    const lat = latitudeInput?.value.trim() || '';
    const lng = longitudeInput?.value.trim() || '';
    const query = address || (lat && lng ? `${lat},${lng}` : 'Soverign Shelters, lakdi ka pul, Hyderabad');
    frame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    if (extLink) extLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    if (status) status.textContent = `Google Maps previewing: ${query}`;
  };

  form.querySelector('[data-google-map-preview]')?.addEventListener('click', updatePreview);
  addressInput?.addEventListener('change', updatePreview);

  form.querySelector('[data-google-map-current]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    if (!navigator.geolocation) {
      if (status) status.textContent = 'Geolocation is not available in this browser.';
      return;
    }
    const previous = showButtonProgress(button);
    if (status) status.textContent = 'Fetching current GPS coordinates…';
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        latitudeInput.value = coords.latitude.toFixed(6);
        longitudeInput.value = coords.longitude.toFixed(6);
        const query = `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
        frame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
        if (extLink) extLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        if (status) status.textContent = `GPS coordinates captured: ${query}. Click "Save public details" to publish.`;
        toast('GPS location coordinates updated.');
        restoreButtonProgress(button, previous);
      },
      (err) => {
        if (status) status.textContent = `GPS error: ${err.message}. Enter your business address above.`;
        restoreButtonProgress(button, previous);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

function renderPublicLocationMap() {
  const section = document.querySelector('[data-location-map]');
  if (!section) return;
  const address = state.config.supportAddress || '';
  const lat = state.config.businessLatitude;
  const lng = state.config.businessLongitude;
  const query = address || (lat != null && lng != null ? `${lat},${lng}` : 'Soverign Shelters, lakdi ka pul, Hyderabad');
  if (!query) {
    section.hidden = true;
    section.innerHTML = '';
    return;
  }
  section.hidden = false;
  section.innerHTML = `
    <div class="location-map-heading d-flex align-items-center justify-content-between mb-2">
      <h3 class="h5 mb-0">Our Location</h3>
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-brand">
        <svg class="me-1" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Google Maps
      </a>
    </div>
    <div class="google-map-container">
      <iframe src="https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" title="Google Maps business location"></iframe>
    </div>`;
}

function renderAuthPage(kind, user = null) {
  const accountDestination = user?.role === 'admin' ? '/admin' : '/account';
  const recoveryBackLink = user
    ? `Already signed in? <a href="${accountDestination}">Return to your account</a>`
    : 'Remembered your password? <a href="/login">Sign in</a>';
  const verificationNotice = kind === 'login'
    && new URLSearchParams(location.search).get('verification') === 'pending'
    ? '<div class="notice mb-3">Check your inbox and verify your email before signing in. After confirming, return here and sign in.</div>'
    : '';
  const content = {
    signup: `<div class="auth-page auth-signup">${pageHeader('Join us', 'Create your account', 'Your account keeps your own addresses and order requests private.')}<section class="container auth-content"><form class="form-shell auth-form auth-signup-form" data-form="register"><div class="auth-fields"><div class="auth-field"><label class="form-label" for="full-name">Full name</label><input class="form-control" id="full-name" name="fullName" autocomplete="name" required minlength="2" maxlength="100"></div><div class="auth-field"><label class="form-label" for="email">Email address</label><input class="form-control" id="email" name="email" type="email" autocomplete="email" required></div><div class="auth-field"><label class="form-label" for="password">Password</label><input class="form-control" id="password" name="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required><div class="form-text">Use at least 12 characters.</div></div><div class="auth-field"><label class="form-label" for="confirm-password">Confirm password</label><input class="form-control" id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required></div></div><div class="form-check my-3"><input class="form-check-input" id="terms-accept" name="acceptTerms" type="checkbox" required><label class="form-check-label" for="terms-accept">I accept the <a href="/terms">terms</a> and have read the <a href="/privacy">privacy policy</a>.</label></div><button class="btn btn-brand w-100" type="submit">Create account</button><p class="text-center small mt-3 mb-0">Already registered? <a href="/login">Sign in</a></p></form></section></div>`,
    login: `<div class="auth-page auth-login">${pageHeader('Welcome back', 'Sign in', 'Access your own profile, addresses and orders.')}<section class="container auth-content">${verificationNotice}<div class="auth-login-grid"><form class="form-shell auth-form" data-form="login"><div class="auth-field"><label class="form-label" for="email">Email address</label><input class="form-control" id="email" name="email" type="email" autocomplete="email" required></div><div class="auth-field mt-3"><label class="form-label" for="password">Password</label><input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required></div><button class="btn btn-brand w-100 mt-3" type="submit">Sign in</button><div class="d-flex justify-content-between mt-3 small"><a href="/forgot-password">Forgot password?</a><a href="/signup">Create account</a></div><div data-google-link class="mt-3"></div></form></div></section></div>`,
    'forgot-password': `<div class="auth-page auth-recovery-page">${pageHeader('Account security', 'Reset your password', 'Enter the email address for your account and we’ll send a reset link if it matches.')}<section class="container auth-content"><form class="form-shell auth-form recovery-form" data-form="forgot"><div class="mb-4"><label class="form-label" for="email">Email address</label><input class="form-control" id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div><button class="btn btn-brand w-100" type="submit">Send reset link</button><p class="recovery-privacy-note small text-secondary mb-0">For your privacy, we’ll show the same confirmation whether or not an account matches.</p><p class="recovery-back-link mb-0">${recoveryBackLink}</p></form></section></div>`,
    'reset-password': `${pageHeader('Account security', 'Choose a new password')}<section class="container section-space"><form class="form-shell" data-form="reset"><input type="hidden" name="token" value="${escapeHtml(new URLSearchParams(location.search).get('token') ?? '')}"><div class="mb-3"><label class="form-label" for="password">New password</label><input class="form-control" id="password" name="password" type="password" minlength="12" maxlength="128" autocomplete="new-password" required></div><div class="mb-3"><label class="form-label" for="confirm-password">Confirm new password</label><input class="form-control" id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required></div><button class="btn btn-brand w-100" type="submit">Update password</button></form></section>`,
  };
  appRoot.innerHTML = content[kind];
}

async function renderVerify() {
  const token = new URLSearchParams(location.search).get('token');
  appRoot.innerHTML = `${pageHeader('Account security', 'Verifying your email')}<section class="container content-shell"><div data-verify-result class="notice">Checking your verification link…</div><div class="mt-3"><a href="/login">Continue to sign in</a></div></section>`;
  if (!token) {
    document.querySelector('[data-verify-result]').textContent = 'This link is missing its verification token.';
    return;
  }
  try {
    const result = await api(`/api/auth/verify?token=${encodeURIComponent(token)}`);
    document.querySelector('[data-verify-result]').textContent = result.message;
  } catch (error) {
    document.querySelector('[data-verify-result]').textContent = error.message;
  }
}

async function getSignedInUser() {
  try {
    return (await api('/api/auth/me')).user;
  } catch (error) {
    return null;
  }
}

async function updateAccountMenu(user = undefined) {
  const menu = document.querySelector('[data-account-menu]');
  if (!menu) return;
  const signedInUser = user === undefined ? await getSignedInUser() : user;
  state.user = signedInUser;
  updateAdminShell(signedInUser);
  const initials = signedInUser
    ? signedInUser.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : '';
  menu.innerHTML = signedInUser
    ? `<summary class="account-menu-summary" aria-label="Account menu for ${escapeHtml(signedInUser.fullName)}">
         <span class="account-avatar" aria-hidden="true">${escapeHtml(initials)}</span><span class="account-user-name">${escapeHtml(signedInUser.fullName)}</span>
       </summary>
       <div class="account-menu-panel">
         <p class="account-menu-greeting">Hi, ${escapeHtml(signedInUser.fullName)}</p>
         ${signedInUser.role === 'admin'
    ? '<a href="/profile">Admin profile</a><a href="/admin">Admin dashboard</a>'
    : '<a href="/account#account-profile">Profile</a><a href="/account">My account</a>'}
         <a href="/forgot-password">Reset password</a>
         ${signedInUser.role === 'customer' ? '<a href="/account#account-delete">Delete account</a>' : ''}
         <button type="button" data-logout>Sign out</button>
       </div>`
    : `<summary class="account-menu-summary" aria-label="Sign in or create an account">
         <span class="account-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.7-3.5 3.2-5.3 7-5.3s6.3 1.8 7 5.3"></path></svg></span>
         <span class="account-user-name">Sign in</span>
       </summary>
       <div class="account-menu-panel">
         <a href="/login">Sign in</a>
         <a href="/signup">Create account</a>
       </div>`;
}

function updateAdminShell(user) {
  const isAdmin = user?.role === 'admin';
  document.body.classList.toggle('admin-mode', isAdmin);
  const navigation = document.querySelector('.site-nav');
  if (!navigation) return;
  if (isAdmin) {
    navigation.innerHTML = `
      <a href="/admin" aria-label="Dashboard" title="Dashboard"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="5" rx="1"></rect><rect x="13" y="10" width="8" height="11" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect></svg><span>Dashboard</span></a>
      <a href="/admin/products" aria-label="Add products" title="Add products"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path><rect x="3" y="3" width="18" height="18" rx="3"></rect></svg><span>Add products</span></a>
      <a href="/admin/manage-products" aria-label="Manage products" title="Manage products"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16l-1 13H5L4 7Z"></path><path d="M9 8V5a3 3 0 0 1 6 0v3"></path></svg><span>Products</span></a>
      <a href="/admin/orders" aria-label="Orders" title="Orders"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h14v17H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path></svg><span>Orders</span></a>
      <a href="/admin/reviews" aria-label="Customer reviews" title="Customer reviews"><svg aria-hidden="true" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span>Reviews</span></a>
      <a href="/admin/enquiries" aria-label="Enquiries" title="Enquiries"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 4z"></path><path d="M8 9h8M8 13h5"></path></svg><span>Enquiries</span></a>
      <a href="/admin/customers" aria-label="Customers" title="Customers"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.3"></circle><path d="M3 20c.5-3.4 2.5-5 6-5s5.5 1.6 6 5M15 15c3.4-.2 5.2 1.3 6 4"></path></svg><span>Customers</span></a>
      <a href="/profile" aria-label="Admin profile" title="Admin profile"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"></circle><path d="M5 20c.7-3.5 3.2-5 7-5s6.3 1.5 7 5"></path></svg><span>Admin profile</span></a>`;
  } else {
    navigation.innerHTML = `
      <a href="/" aria-label="Home" title="Home"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"></path></svg><span>Home</span></a>
      <a href="/shop" aria-label="Products" title="Products"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16l-1 13H5L4 7Z"></path><path d="M9 8V5a3 3 0 0 1 6 0v3"></path></svg><span>Products</span></a>
      <a href="/about" aria-label="Our story" title="Our story"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"></circle><path d="M5 20c.7-3.5 3.2-5 7-5s6.3 1.5 7 5"></path></svg><span>Our story</span></a>
      <a href="/millets" aria-label="Millets" title="Millets"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21V4m0 7c-4 0-6-2-7-5 4 0 6 2 7 5Zm0 4c4 0 6-2 7-5-4 0-6 2-7 5Z"></path></svg><span>Millets</span></a>
      <a href="/recipes" aria-label="Ideas" title="Ideas"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"></path><path d="M8 8h8M8 12h8M8 16h5"></path></svg><span>Ideas</span></a>
      <a href="/orders" aria-label="My Orders" title="My Orders"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h14v17H5z"></path><path d="M8 8h8M8 12h8M8 16h5"></path></svg><span>My Orders</span></a>
      <a href="/contact" aria-label="Contact" title="Contact"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 4z"></path><path d="M8 9h8M8 13h5"></path></svg><span>Contact</span></a>
      <a class="site-nav-cart" href="/cart" aria-label="Cart" title="Cart"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 4h2l2.2 11h11.5l2-8H6"></path><circle cx="9" cy="19" r="1"></circle><circle cx="18" cy="19" r="1"></circle></svg><span>Cart</span><span class="cart-count" data-cart-count>0</span></a>
      ${user?.role === 'admin' ? '<a class="site-nav-cart" href="/admin" aria-label="Admin Console" title="Admin Console" style="border-top:1px dashed var(--earth);color:var(--forest)"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1"></rect><rect x="13" y="3" width="8" height="5" rx="1"></rect><rect x="13" y="10" width="8" height="11" rx="1"></rect><rect x="3" y="13" width="8" height="8" rx="1"></rect></svg><span class="fw-bold">⚙️ Admin Console</span></a>' : ''}`;
  }
  const brand = document.querySelector('.brand-wordmark');
  if (brand) {
    brand.href = isAdmin ? '/admin' : '/';
    brand.setAttribute('aria-label', isAdmin ? 'BR Millet Choice admin dashboard' : 'BR Millet Choice home');
  }
  const headerCart = document.querySelector('[data-header-cart]');
  if (headerCart) {
    headerCart.hidden = Boolean(isAdmin || (user && user.role === 'admin'));
  }
}

async function renderAccount() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your account', 'Sign in to continue')}<section class="container section-space"><div class="empty-state account-access-card"><h2>Sign in to view your account</h2><p class="text-secondary mb-3">Sign in to see your profile, saved addresses and order requests.</p><div class="d-flex flex-wrap justify-content-center gap-2">${buttonLink('/login', 'Sign in')}${buttonLink('/signup', 'Create account', 'btn-outline-brand')}</div></div></section>`;
    return;
  }
  if (user.role === 'admin') {
    state.adminBusinessDetails = (await api('/api/admin/business-details')).details;
    return renderAdminProfile(user);
  }
  let addresses = [];
  let orders = [];
  let notifications = { notifications: [], unreadCount: 0 };
  let restock = { subscriptions: [] };
  let emailPreferences = { orderUpdates: true, enquiryAcknowledgements: true, backInStock: true, promotions: false };
  if (user.emailVerified) {
    const [addrRes, orderRes, notifRes, restockRes, prefRes] = await Promise.all([
      api('/api/addresses').then((result) => result.addresses),
      api('/api/orders').then((result) => result.orders),
      api('/api/notifications'),
      api('/api/restock-subscriptions'),
      api('/api/profile/email-preferences').then((result) => result.preferences).catch(() => emailPreferences),
    ]);
    addresses = addrRes;
    orders = orderRes;
    notifications = notifRes;
    restock = restockRes;
    emailPreferences = prefRes;
  }
  const addressCards = addresses.length
    ? addresses.map((address) => `<article class="address-card account-address-card">
        <div class="d-flex justify-content-between align-items-start gap-2"><h3 class="h6 mb-2">${escapeHtml(address.label)} ${address.isDefault ? '<span class="status-pill">Default</span>' : ''}</h3><button class="btn btn-sm btn-outline-danger" data-delete-address="${escapeHtml(address.id)}">Delete</button></div>
        <p class="small mb-0">${escapeHtml(address.recipientName)} · ${escapeHtml(address.phone)}<br>${escapeHtml(address.line1)} ${escapeHtml(address.line2)}<br>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</p>
        ${addressEditForm(address)}
      </article>`).join('')
    : '<p class="text-secondary">No saved addresses yet. Add one here to use it at checkout.</p>';
  const orderCards = orders.length
    ? orders.slice(0, 8).map((order) => `<article class="account-order-card">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2"><div><strong>${escapeHtml(order.orderNumber)}</strong><p class="small text-secondary mb-1">${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</p></div><span class="status-pill">${escapeHtml(order.status.replaceAll('_', ' '))}</span></div>
        <div class="d-flex justify-content-between align-items-center gap-2 mt-2"><span class="small text-secondary">Payment: ${escapeHtml(order.paymentStatus.replaceAll('_', ' '))}</span><strong>${money(order.totalPaise)}</strong></div>
        <div class="d-flex gap-2 mt-3"><a class="btn btn-sm btn-outline-brand" href="/orders/${encodeURIComponent(order.id)}">Order details</a>${['awaiting_confirmation', 'confirmed'].includes(order.status) ? `<button class="btn btn-sm btn-outline-danger" data-cancel-order="${escapeHtml(order.id)}">Cancel request</button>` : ''}</div>
      </article>`).join('')
    : '<p class="text-secondary">Your order requests will appear here.</p>';
  const notificationCards = notifications.notifications.length
    ? notifications.notifications.slice(0, 5).map((item) => `<article class="account-notification ${item.readAt ? '' : 'is-unread'}">
        <div class="d-flex flex-wrap justify-content-between gap-2"><h3 class="h6 mb-1">${escapeHtml(item.title)}</h3><time class="small text-secondary">${new Date(item.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</time></div>
        <p class="small mb-1">${escapeHtml(item.body)}</p>${item.href ? `<a class="small me-2" href="${escapeHtml(item.href)}">View</a>` : ''}${!item.readAt ? `<button class="btn btn-link btn-sm p-0" data-read-notification="${escapeHtml(item.id)}">Mark as read</button>` : ''}
      </article>`).join('')
    : '<p class="text-secondary">No notifications yet.</p>';
  const rawHash = (location.hash || '').replace('#account-', '');
  const activeTab = ['profile', 'addresses', 'orders', 'notifications', 'preferences'].includes(rawHash)
    ? rawHash
    : 'profile';

  appRoot.innerHTML = `${pageHeader('Your account', `Hello, ${user.fullName}`, 'Your profile, addresses, order requests and updates—together on one page.')}
    <section class="container account-page">
      <nav class="account-jump-nav" aria-label="Account sections">
        <button type="button" class="account-nav-tab ${activeTab === 'profile' ? 'active' : ''}" data-tab-target="profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>
          <span>Profile</span>
        </button>
        <button type="button" class="account-nav-tab ${activeTab === 'addresses' ? 'active' : ''}" data-tab-target="addresses">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>Addresses</span>
          ${addresses.length ? `<span class="tab-badge">${addresses.length}</span>` : ''}
        </button>
        <button type="button" class="account-nav-tab ${activeTab === 'orders' ? 'active' : ''}" data-tab-target="orders">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Orders</span>
          ${orders.length ? `<span class="tab-badge">${orders.length}</span>` : ''}
        </button>
        <button type="button" class="account-nav-tab ${activeTab === 'notifications' ? 'active' : ''}" data-tab-target="notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span>Updates</span>
          ${notifications.unreadCount ? `<span class="tab-badge tab-badge-alert">${notifications.unreadCount}</span>` : ''}
        </button>
        <button type="button" class="account-nav-tab ${activeTab === 'preferences' ? 'active' : ''}" data-tab-target="preferences">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Preferences</span>
        </button>
      </nav>

      <div class="account-dashboard-tabbed mt-3">
        <!-- Profile Panel -->
        <section class="feature-card account-panel ${activeTab === 'profile' ? 'active-tab-panel' : ''}" id="account-profile" data-panel-name="profile">
          <div class="account-panel-heading"><div><p class="eyebrow mb-1">Your details</p><h2 class="h4 mb-0">Profile</h2></div><span class="profile-status ${user.emailVerified ? 'is-verified' : 'is-unverified'}">${user.emailVerified ? 'Verified' : 'Needs verification'}</span></div>
          ${!user.emailVerified ? `<div class="notice mt-3"><strong>Verify your email.</strong> Customer account features are locked until you confirm ${escapeHtml(user.email)}.<form data-form="resend-verification" class="mt-3"><input type="hidden" name="email" value="${escapeHtml(user.email)}"><button class="btn btn-sm btn-outline-brand" type="submit">Resend verification email</button></form></div>` : ''}
          <form data-form="profile" class="mt-4"><div class="row g-3">
            <div class="col-12"><label class="form-label" for="account-profile-name">Full name</label><input class="form-control" id="account-profile-name" name="fullName" value="${escapeHtml(user.fullName)}" autocomplete="name" required minlength="2" maxlength="100"></div>
            <div class="col-12"><label class="form-label" for="account-profile-email">Email address</label><input class="form-control" id="account-profile-email" type="email" value="${escapeHtml(user.email)}" readonly></div>
            <div class="col-12"><button class="btn btn-brand" type="submit">Save profile</button></div>
          </div></form>
          <div class="mt-4 pt-3 border-top">
            <details class="account-delete-panel" id="account-delete">
              <summary class="text-danger fw-semibold" style="cursor:pointer">Delete my account</summary>
              <p class="small text-secondary mt-3">Deletion removes your profile, saved addresses, notifications, and enquiries. Completed order records are retained in anonymized form for business recordkeeping.</p>
              <form data-form="delete-account" class="row g-2 align-items-end">
                ${user.hasPassword ? '<div class="col-md-6"><label class="form-label" for="delete-password">Current password</label><input class="form-control" id="delete-password" name="currentPassword" type="password" autocomplete="current-password" required></div>' : '<div class="col-12"><p class="small text-secondary mb-0">You signed in with Google, so no account password is needed. Confirm while signed in by typing DELETE.</p></div>'}
                <div class="${user.hasPassword ? 'col-md-3' : 'col-md-6'}"><label class="form-label" for="delete-confirm">Type DELETE</label><input class="form-control" id="delete-confirm" name="confirm" required pattern="DELETE"></div>
                <div class="col-md-3"><button class="btn btn-danger" type="submit">Delete account</button></div>
              </form>
            </details>
          </div>
        </section>

        <!-- Addresses Panel -->
        <section class="feature-card account-panel ${activeTab === 'addresses' ? 'active-tab-panel' : ''}" id="account-addresses" data-panel-name="addresses">
          <div class="account-panel-heading"><div><p class="eyebrow mb-1">Delivery information</p><h2 class="h4 mb-0">Saved addresses</h2></div><span class="account-count">${addresses.length}</span></div>
          ${user.emailVerified ? `<div class="account-address-list mt-3">${addressCards}</div><details class="address-form-disclosure mt-3" ${addresses.length ? '' : 'open'}><summary class="fw-semibold text-forest" style="cursor:pointer">+ Add new delivery address</summary><div class="mt-3">${addressForm()}</div></details>` : '<p class="text-secondary mt-3 mb-0">Verify your email to manage addresses.</p>'}
        </section>

        <!-- Orders Panel -->
        <section class="feature-card account-panel ${activeTab === 'orders' ? 'active-tab-panel' : ''}" id="account-orders" data-panel-name="orders">
          <div class="account-panel-heading"><div><p class="eyebrow mb-1">Purchases</p><h2 class="h4 mb-0">My orders</h2></div><span class="account-count">${orders.length}</span></div>
          ${user.emailVerified ? `<div class="account-order-list mt-3">${orderCards}</div>` : '<p class="text-secondary mt-3 mb-0">Verify your email to view orders.</p>'}
        </section>

        <!-- Updates Panel -->
        <section class="feature-card account-panel ${activeTab === 'notifications' ? 'active-tab-panel' : ''}" id="account-notifications" data-panel-name="notifications">
          <div class="account-panel-heading"><div><p class="eyebrow mb-1">Account activity</p><h2 class="h4 mb-0">Notifications</h2></div><div class="d-flex align-items-center gap-2"><span class="account-count">${notifications.unreadCount} unread</span>${notifications.unreadCount ? '<button class="btn btn-sm btn-outline-brand" data-read-all>Mark all read</button>' : ''}</div></div>
          ${user.emailVerified ? `<div class="account-notification-list mt-3">${notificationCards}</div><h3 class="h6 mt-4">Restock alerts</h3>${restock.subscriptions.length ? `<ul class="account-restock-list">${restock.subscriptions.map((item) => `<li><a href="/product/${encodeURIComponent(item.slug)}">${escapeHtml(item.productName)} · ${escapeHtml(item.packSize)}</a><button class="btn btn-link btn-sm" data-remove-restock="${escapeHtml(item.variantId)}">Remove</button></li>`).join('')}</ul>` : '<p class="small text-secondary mb-0">No active restock alerts.</p>'}` : '<p class="text-secondary mt-3 mb-0">Verify your email to view account notifications.</p>'}
        </section>

        <!-- Preferences Panel -->
        <section class="feature-card account-panel ${activeTab === 'preferences' ? 'active-tab-panel' : ''}" id="account-preferences" data-panel-name="preferences">
          <div class="account-panel-heading"><div><p class="eyebrow mb-1">Preferences</p><h2 class="h4 mb-0">Email &amp; Notifications</h2></div></div>
          <p class="small text-secondary mt-2">Manage which emails and notifications you receive from BR Millet Choice. Security notices are always sent.</p>
          <form data-form="email-preferences" class="mt-3">
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="pref-orders" name="orderUpdates" ${emailPreferences.orderUpdates ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="pref-orders">📦 Order &amp; Fulfilment Updates</label>
              <div class="small text-secondary">Emails when your order request is accepted, preparing, or delivered.</div>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="pref-enquiries" name="enquiryAcknowledgements" ${emailPreferences.enquiryAcknowledgements ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="pref-enquiries">💬 Enquiry Acknowledgements</label>
              <div class="small text-secondary">Immediate email copies when you reach out through the contact page.</div>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="pref-stock" name="backInStock" ${emailPreferences.backInStock ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="pref-stock">🔔 Back-in-Stock Alerts</label>
              <div class="small text-secondary">Instant alerts when an out-of-stock millet pack is available again.</div>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="pref-promotions" name="promotions" ${emailPreferences.promotions ? 'checked' : ''}>
              <label class="form-check-label fw-bold" for="pref-promotions">🎁 Promotions &amp; Recipes</label>
              <div class="small text-secondary">Updates on seasonal millet harvests and culinary ideas.</div>
            </div>
            <button class="btn btn-brand btn-sm" type="submit">Save preferences</button>
          </form>
        </section>
      </div>
    </section>`;

  appRoot.querySelectorAll('[data-tab-target]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tabBtn.dataset.tabTarget;
      appRoot.querySelectorAll('[data-tab-target]').forEach((b) => b.classList.remove('active'));
      tabBtn.classList.add('active');
      appRoot.querySelectorAll('[data-panel-name]').forEach((panel) => {
        panel.classList.toggle('active-tab-panel', panel.dataset.panelName === target);
      });
      window.history.replaceState(null, '', location.pathname + `#account-${target}`);
      const nav = document.querySelector('.account-jump-nav');
      if (nav) {
        const rect = nav.getBoundingClientRect();
        if (rect.top < 70) {
          window.scrollTo({ top: nav.offsetTop - 80, behavior: 'smooth' });
        }
      }
    });
  });
}

async function renderProfile() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your account', 'Sign in required')}<section class="container section-space">${emptyState('This page is private', 'Sign in to access your profile.', '/login', 'Sign in')}</section>`;
    return;
  }
  if (user.role === 'admin') {
    state.adminBusinessDetails = (await api('/api/admin/business-details')).details;
    return renderAdminProfile(user);
  }
  const emailPreferences = (await api('/api/profile/email-preferences')).preferences;
  appRoot.innerHTML = `${pageHeader('Your account', 'Profile', 'Review and update your account information.')}
    <section class="container profile-section">
      <div class="profile-layout">
        <aside class="profile-sidebar feature-card">
          <div class="profile-avatar" aria-hidden="true">${escapeHtml(user.fullName.trim().slice(0, 1).toUpperCase())}</div>
          <h2 class="h4 text-break">${escapeHtml(user.fullName)}</h2>
          <p class="profile-email text-break">${escapeHtml(user.email)}</p>
          <span class="profile-status ${user.emailVerified ? 'is-verified' : 'is-unverified'}">${user.emailVerified ? 'Email verified' : 'Email not verified'}</span>
          <nav class="profile-nav mt-4" aria-label="Account navigation">
            <a class="active" href="/profile" aria-current="page">Profile details</a>
            <a href="/addresses">Delivery addresses</a>
            <a href="/orders">Order history</a>
            <a href="/notifications">Notifications</a>
            <a href="/account">Account overview</a>
          </nav>
        </aside>
        <div class="profile-main">
          <div class="feature-card">
            <p class="eyebrow mb-2">Personal information</p>
            <h2 class="h3 mb-4">Profile details</h2>
            <form data-form="profile">
              <div class="mb-3"><label class="form-label" for="profile-name">Full name</label><input class="form-control" id="profile-name" name="fullName" value="${escapeHtml(user.fullName)}" autocomplete="name" required minlength="2" maxlength="100"></div>
              <div class="mb-3"><label class="form-label" for="profile-email">Email address</label><input class="form-control" id="profile-email" type="email" value="${escapeHtml(user.email)}" readonly aria-describedby="profile-email-help"><div id="profile-email-help" class="form-text">Your sign-in email can’t be changed here.</div></div>
              <div class="d-flex flex-column flex-sm-row gap-2 mt-4"><button class="btn btn-brand" type="submit">Save changes</button><a class="btn btn-outline-brand" href="/account">Back to account</a></div>
            </form>
          </div>
          <div class="feature-card mt-3">
            <p class="eyebrow mb-2">Your choices</p>
            <h2 class="h5">Email preferences</h2>
            <p class="small text-secondary">Choose which optional account emails you receive. Security emails for verification and password changes are always sent.</p>
            <form data-form="email-preferences" class="email-preferences-form">
              <label class="form-check"><input class="form-check-input" type="checkbox" name="orderUpdates" ${emailPreferences.orderUpdates ? 'checked' : ''}><span class="form-check-label">Order and payment updates</span></label>
              <label class="form-check"><input class="form-check-input" type="checkbox" name="enquiryAcknowledgements" ${emailPreferences.enquiryAcknowledgements ? 'checked' : ''}><span class="form-check-label">Enquiry acknowledgements</span></label>
              <label class="form-check"><input class="form-check-input" type="checkbox" name="backInStock" ${emailPreferences.backInStock ? 'checked' : ''}><span class="form-check-label">Back-in-stock alerts</span></label>
              <label class="form-check"><input class="form-check-input" type="checkbox" name="promotions" ${emailPreferences.promotions ? 'checked' : ''}><span class="form-check-label">News and promotions</span></label>
              <button class="btn btn-outline-brand mt-3" type="submit">Save email preferences</button>
            </form>
          </div>
          <div class="feature-card mt-3">
            <h2 class="h5">Email verification</h2>
            <p class="mb-0">${user.emailVerified ? 'Your email address is confirmed and ready for account updates.' : 'Confirm your email address to use customer account features.'}</p>
            ${!user.emailVerified ? `<form data-form="resend-verification" class="mt-3"><input type="hidden" name="email" value="${escapeHtml(user.email)}"><button class="btn btn-outline-brand" type="submit">Resend verification email</button></form>` : ''}
          </div>
        </div>
      </div>
    </section>`;
}

function renderAdminProfile(user) {
  const details = state.adminBusinessDetails ?? {};
  appRoot.innerHTML = `${pageHeader('Administration', 'Admin profile', 'Manage your administrator account details and sign-in security.') }
    <section class="container profile-section">
      <div class="profile-layout admin-profile-layout">
        <div class="profile-main">
          <section class="feature-card admin-profile-card">
            <div class="admin-profile-heading"><div class="profile-avatar" aria-hidden="true">${escapeHtml(user.fullName.trim().slice(0, 1).toUpperCase())}</div><div><p class="eyebrow mb-1">Administrator</p><h2 class="h3 mb-1">${escapeHtml(user.fullName)}</h2><p class="profile-email text-break mb-0">${escapeHtml(user.email)}</p></div><a class="btn btn-outline-brand" href="/forgot-password">Change password</a></div>
            <form data-form="profile" class="admin-profile-name-form mt-4">
              <div><label class="form-label" for="profile-name">Administrator name</label><input class="form-control" id="profile-name" name="fullName" value="${escapeHtml(user.fullName)}" autocomplete="name" required minlength="2" maxlength="100"></div>
              <div><label class="form-label" for="profile-email">Sign-in email</label><input class="form-control" id="profile-email" type="email" value="${escapeHtml(user.email)}" readonly></div>
              <button class="btn btn-brand align-self-end" type="submit">Save name</button>
            </form>
          </section>
          <section class="feature-card mt-3">
            <p class="eyebrow mb-1">Shown to customers</p><h2 class="h4 mb-2">Public business details</h2>
            <p class="small text-secondary">These details appear on the Contact page. Enter your address or click "Use GPS coordinates" to preview your pin on Google Maps.</p>
            <form data-form="admin-business-details" class="admin-business-form">
              <div><label class="form-label" for="business-address">Business address / location</label><textarea class="form-control" id="business-address" name="address" rows="3" maxlength="500">${escapeHtml(details.address ?? '')}</textarea></div>
              <div class="business-location-picker">
                <div class="d-flex flex-wrap gap-2 mb-2 align-items-center justify-content-between">
                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-brand" type="button" data-google-map-current>Use GPS coordinates</button>
                    <button class="btn btn-sm btn-outline-secondary" type="button" data-google-map-preview>Refresh Google Map</button>
                  </div>
                  <a id="admin-google-maps-link" class="btn btn-sm btn-outline-brand" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.address || 'Soverign Shelters, lakdi ka pul, Hyderabad')}" target="_blank" rel="noopener noreferrer">
                    <svg class="me-1" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Open in Google Maps
                  </a>
                </div>
                <div class="google-map-container mb-2">
                  <iframe id="admin-google-maps-frame" src="https://www.google.com/maps?q=${encodeURIComponent(details.address || (details.latitude && details.longitude ? `${details.latitude},${details.longitude}` : 'Soverign Shelters, lakdi ka pul, Hyderabad'))}&output=embed" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" title="Google Maps business location"></iframe>
                </div>
                <input type="hidden" name="latitude" value="${escapeHtml(details.latitude ?? '')}">
                <input type="hidden" name="longitude" value="${escapeHtml(details.longitude ?? '')}">
                <p class="small text-secondary mb-0" data-business-location-status role="status">${details.latitude != null && details.longitude != null ? `Google Maps location active: ${Number(details.latitude).toFixed(6)}, ${Number(details.longitude).toFixed(6)}` : 'Google Maps displays your business location based on your address and coordinates.'}</p>
              </div>
              <div><label class="form-label" for="business-phone">Contact phone</label><input class="form-control" id="business-phone" name="phone" type="tel" autocomplete="tel" maxlength="40" value="${escapeHtml(details.phone ?? '')}"></div>
              <div><label class="form-label" for="business-email">Contact email</label><input class="form-control" id="business-email" name="email" type="email" maxlength="254" value="${escapeHtml(details.email ?? '')}"></div>
              <div><label class="form-label" for="business-whatsapp">WhatsApp number</label><input class="form-control" id="business-whatsapp" name="whatsapp" type="tel" maxlength="40" value="${escapeHtml(details.whatsapp ?? '')}"><div class="form-text">Include country code, for example +91.</div></div>
              <div class="admin-business-hours"><label class="form-label" for="business-hours">Business hours</label><textarea class="form-control" id="business-hours" name="hours" rows="3" maxlength="300" placeholder="For example: Monday–Saturday, 9 AM–6 PM">${escapeHtml(details.hours ?? '')}</textarea></div>
              <div class="admin-business-save"><button class="btn btn-brand" type="submit">Save public details</button></div>
            </form>
          </section>
        </div>
      </div>
    </section>`;
  initializeGoogleMapPicker();
}

function addressForm() {
  return `<form class="address-card" data-form="address"><h2 class="h5 mb-3">New delivery address</h2><div class="row g-3">
    <div class="col-sm-6"><label class="form-label" for="recipient">Recipient name</label><input class="form-control" id="recipient" name="recipientName" required maxlength="100"></div>
    <div class="col-sm-6"><label class="form-label" for="phone">Phone</label><input class="form-control" id="phone" name="phone" autocomplete="tel" required maxlength="20"></div>
    <div class="col-12"><label class="form-label" for="line1">Address line 1</label><input class="form-control" id="line1" name="line1" autocomplete="address-line1" required maxlength="150"></div>
    <div class="col-12"><label class="form-label" for="line2">Address line 2 (optional)</label><input class="form-control" id="line2" name="line2" autocomplete="address-line2" maxlength="150"></div>
    <div class="col-sm-6"><label class="form-label" for="city">City</label><input class="form-control" id="city" name="city" autocomplete="address-level2" required maxlength="80"></div>
    <div class="col-sm-6"><label class="form-label" for="state">State</label><input class="form-control" id="state" name="state" autocomplete="address-level1" required maxlength="80"></div>
    <div class="col-sm-6"><label class="form-label" for="postal">Postal code</label><input class="form-control" id="postal" name="postalCode" autocomplete="postal-code" required maxlength="12"></div>
    <div class="col-sm-6"><label class="form-label" for="address-label">Label</label><input class="form-control" id="address-label" name="label" value="Home" maxlength="40"></div>
    <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="default-address" name="isDefault"><label class="form-check-label" for="default-address">Set as default address</label></div></div>
    <div class="col-12"><button class="btn btn-brand" type="submit">Save address</button></div>
  </div></form>`;
}

function addressEditForm(address) {
  const field = (label, name, value, required = true, extra = '') => `<div class="col-sm-6"><label class="form-label">${label}<input class="form-control" name="${name}" value="${escapeHtml(value)}" ${required ? 'required' : ''} maxlength="${name === 'line1' || name === 'line2' ? '150' : name === 'label' ? '40' : '100'}" ${extra}></label></div>`;
  return `<details class="mt-3"><summary>Edit address</summary><form class="row g-2 mt-1" data-form="address-edit" data-address-id="${escapeHtml(address.id)}">
    ${field('Label', 'label', address.label, true)}
    ${field('Recipient', 'recipientName', address.recipientName)}
    ${field('Phone', 'phone', address.phone, true, 'autocomplete="tel"')}
    ${field('Address line 1', 'line1', address.line1)}
    ${field('Address line 2', 'line2', address.line2 ?? '', false)}
    ${field('City', 'city', address.city)}
    ${field('State', 'state', address.state)}
    ${field('Postal code', 'postalCode', address.postalCode)}
    <div class="col-12"><div class="form-check"><input class="form-check-input" type="checkbox" id="default-${escapeHtml(address.id)}" name="isDefault" ${address.isDefault ? 'checked' : ''}><label class="form-check-label" for="default-${escapeHtml(address.id)}">Set as default</label></div></div>
    <div class="col-12"><button class="btn btn-sm btn-outline-brand">Save changes</button></div>
  </form></details>`;
}

async function renderAddresses() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your account', 'Sign in required')}<section class="container section-space">${emptyState('Addresses are private', 'Sign in to manage your saved delivery addresses.', '/login', 'Sign in')}</section>`;
    return;
  }
  const data = await api('/api/addresses');
  appRoot.innerHTML = `${pageHeader('Your account', 'Saved addresses', 'Only you can view and manage your delivery addresses.')}
    <section class="container section-space"><div class="row g-4"><div class="col-lg-7"><div class="row g-3">${data.addresses.length ? data.addresses.map((address) => `<div class="col-12"><article class="address-card"><div class="d-flex justify-content-between gap-2"><h2 class="h5">${escapeHtml(address.label)} ${address.isDefault ? '<span class="status-pill">Default</span>' : ''}</h2><button class="btn btn-sm btn-outline-danger" data-delete-address="${escapeHtml(address.id)}">Delete</button></div><p class="mb-0">${escapeHtml(address.recipientName)} · ${escapeHtml(address.phone)}<br>${escapeHtml(address.line1)} ${escapeHtml(address.line2)}<br>${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</p>${addressEditForm(address)}</article></div>`).join('') : `<div class="col-12">${emptyState('No saved addresses yet', 'Add an address to use it at checkout.', '/addresses', 'Add an address')}</div>`}</div></div><div class="col-lg-5">${addressForm()}</div></div></section>`;
}

async function renderCart() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your basket', 'Shopping cart')}<section class="container section-space">${emptyState('Sign in to use your cart', 'Your cart is associated with your customer account.', '/login', 'Sign in')}</section>`;
    return;
  }
  const data = await api('/api/cart');
  const totalQuantity = (data.items || []).reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(totalQuantity);
  });

  appRoot.innerHTML = `${pageHeader('Your basket', 'Shopping cart', 'Live instantaneous cart updates. 100% Cash on Delivery.')}
    <section class="container section-space">
      ${data.items.length ? `
        <div class="row g-4 justify-content-center">
          <div class="col-lg-8">
            <div class="cart-items-wrapper">
              ${data.items.map((item) => `
                <article class="cart-item-card p-3 p-md-4 rounded-3 border bg-white shadow-sm" data-cart-row="${escapeHtml(item.variantId)}" data-unit-paise="${item.pricePaise}">
                  <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div class="d-flex align-items-center gap-3">
                      <div class="p-2 rounded-2 bg-light text-forest fs-3" aria-hidden="true">🌾</div>
                      <div>
                        <h2 class="h6 mb-1 fw-bold text-dark">${escapeHtml(item.productName)}</h2>
                        <div class="small text-secondary">${escapeHtml(item.packSize)} · <span class="fw-semibold text-dark">${money(item.pricePaise)}</span> / pack</div>
                        ${item.productActive && item.variantActive ? '' : '<span class="badge bg-danger-subtle text-danger mt-1">Currently unavailable</span>'}
                      </div>
                    </div>
                    <div class="d-flex align-items-center gap-3 ms-auto">
                      <div class="input-group input-group-sm" style="width: 120px;">
                        <button class="btn btn-outline-secondary cart-stepper-btn" type="button" data-cart-step="-1" data-variant-id="${escapeHtml(item.variantId)}" aria-label="Decrease quantity">−</button>
                        <input class="form-control text-center fw-bold cart-qty-val" type="number" min="1" max="99" value="${item.quantity}" data-cart-quantity="${escapeHtml(item.variantId)}" readonly aria-label="Quantity for ${escapeHtml(item.productName)}">
                        <button class="btn btn-outline-secondary cart-stepper-btn" type="button" data-cart-step="1" data-variant-id="${escapeHtml(item.variantId)}" aria-label="Increase quantity">+</button>
                      </div>
                      <div class="text-end" style="min-width: 85px;">
                        <div class="small text-secondary">Total</div>
                        <strong class="fs-6 text-forest line-item-total" data-line-total="${escapeHtml(item.variantId)}">${money(Number(item.pricePaise) * item.quantity)}</strong>
                      </div>
                      <button class="btn btn-sm btn-outline-danger" type="button" data-remove-cart="${escapeHtml(item.variantId)}" title="Remove item" aria-label="Remove ${escapeHtml(item.productName)}">✕</button>
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
          <div class="col-lg-4">
            <div class="feature-card p-4 rounded-3 border bg-white shadow-sm sticky-top" style="top: 5rem;">
              <h2 class="h5 fw-bold mb-3">Order summary</h2>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-secondary">Subtotal</span>
                <strong class="fs-5 text-forest" data-cart-subtotal>${money(data.subtotalPaise)}</strong>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-2 small text-secondary">
                <span>Doorstep Delivery</span>
                <span class="text-success fw-bold">FREE (Hyderabad)</span>
              </div>
              <div class="d-flex justify-content-between align-items-center mb-3 small text-secondary">
                <span>Payment Mode</span>
                <span class="badge bg-success-subtle text-success fw-bold">💵 Cash on Delivery</span>
              </div>
              <hr class="my-3">
              <div class="d-flex justify-content-between align-items-center fs-5 fw-bold mb-4">
                <span>Total to Pay</span>
                <strong class="fs-4 text-forest" data-cart-grandtotal>${money(data.subtotalPaise)}</strong>
              </div>
              <div class="d-grid gap-2">
                ${buttonLink('/checkout', 'Proceed to Checkout (COD) →', 'btn btn-brand btn-lg w-100')}
                <a href="/shop" class="btn btn-outline-secondary w-100">← Continue shopping</a>
              </div>
            </div>
          </div>
        </div>
      ` : emptyState('Your cart is empty', 'Browse the catalogue and choose an available product option.', '/shop', 'Browse products')}
    </section>`;
}

async function renderCheckout() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Checkout', 'Sign in to continue')}<section class="container section-space">${emptyState('An account is required', 'Sign in or create an account before placing an order request.', '/login', 'Sign in')}</section>`;
    return;
  }
  const [cart, addressData] = await Promise.all([api('/api/cart'), api('/api/addresses')]);
  if (!cart.items.length) {
    appRoot.innerHTML = `${pageHeader('Checkout', 'Review your request')}<section class="container section-space">${emptyState('Your cart is empty', 'Add a product option before checkout.', '/shop', 'Browse products')}</section>`;
    return;
  }
  appRoot.innerHTML = `${pageHeader('Checkout', 'Complete your order', '100% Cash on Delivery (COD) — pay when your fresh millets reach your doorstep.')}
    <section class="container section-space"><div class="row g-5"><div class="col-lg-7">
      ${addressData.addresses.length ? `<form data-form="checkout"><h2 class="h4 mb-3">Delivery address</h2><select class="form-select mb-4" name="addressId" required>${addressData.addresses.map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.label)} — ${escapeHtml(a.recipientName)}, ${escapeHtml(a.city)} (${escapeHtml(a.phone)})</option>`).join('')}</select>
      <h2 class="h4 mb-3">Payment method</h2>
      <div class="feature-card p-3 p-md-4 border rounded-3 mb-4 bg-light-subtle">
        <div class="d-flex align-items-center gap-3">
          <span class="fs-1">💵</span>
          <div>
            <h3 class="h5 mb-1 text-success-emphasis fw-bold">Cash on Delivery (COD)</h3>
            <p class="small text-secondary mb-0">Pay with cash or scan delivery partner's UPI QR at your doorstep upon arrival. No advance online payment required!</p>
          </div>
        </div>
        <input type="hidden" name="paymentMethod" value="cash_on_handover">
      </div>
      <div class="mt-4"><label class="form-label" for="customer-note">Delivery instructions or landmark (optional)</label><textarea class="form-control" id="customer-note" name="customerNote" rows="2" maxlength="500" placeholder="e.g. Leave with security, call before arrival..."></textarea></div>
      <div class="form-check mt-3 mb-3"><input class="form-check-input" type="checkbox" id="confirm-request" checked required><label class="form-check-label" for="confirm-request">I confirm that all delivery details are correct.</label></div><button class="btn btn-brand btn-lg w-100" type="submit">Place Cash on Delivery Order</button></form>` : emptyState('Add a delivery address first', 'Checkout requires a saved address for your account.', '/addresses', 'Manage addresses')}
    </div><aside class="col-lg-5"><div class="feature-card"><h2 class="h4">Order summary</h2><ul class="detail-list">${cart.items.map((item) => `<li class="d-flex justify-content-between gap-2"><span>${escapeHtml(item.productName)} · ${escapeHtml(item.packSize)} × ${item.quantity}</span><strong>${money(Number(item.pricePaise) * item.quantity)}</strong></li>`).join('')}</ul><div class="d-flex justify-content-between fs-5"><span>Total to pay (COD)</span><strong>${money(cart.subtotalPaise)}</strong></div><p class="small text-secondary mt-3 mb-0">Free delivery in Hyderabad on orders above ₹500.</p></div></aside></div></section>`;
}

async function renderOrders(orderId = '') {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your account', 'My orders')}<section class="container section-space">${emptyState('Sign in to view your orders', 'Your order history is private to your account.', '/login', 'Sign in')}</section>`;
    return;
  }
  if (orderId) {
    const { order } = await api(`/api/orders/${encodeURIComponent(orderId)}`);
    const isPaid = order.paymentStatus === 'paid';
    appRoot.innerHTML = `${pageHeader(order.orderNumber, 'Order details', `Order status: ${order.status.replaceAll('_', ' ')}.`)}
      <section class="container section-space">
        <div class="alert alert-success d-flex align-items-center gap-3 mb-4 p-3 rounded-3 shadow-sm">
          <span class="fs-2">💵</span>
          <div>
            <h3 class="h6 fw-bold mb-1">Payment Method: Cash on Delivery (COD)</h3>
            <p class="small mb-0">Please keep <strong>${money(order.totalPaise)}</strong> ready in cash or UPI scan when your fresh millets arrive at your doorstep.</p>
          </div>
        </div>

        <div class="row g-4"><div class="col-lg-7"><div class="feature-card"><h2 class="h4">Items</h2><ul class="detail-list">${order.items.map((item) => `<li class="d-flex justify-content-between"><span>${escapeHtml(item.productName)} · ${escapeHtml(item.packSize)} × ${item.quantity}</span><strong>${money(item.lineTotalPaise)}</strong></li>`).join('')}</ul><div class="d-flex justify-content-between"><span>Total</span><strong>${money(order.totalPaise)}</strong></div><p class="small text-secondary mt-2 mb-0">Payment status: <span class="badge ${isPaid ? 'bg-success' : 'bg-warning-subtle text-dark'}">${escapeHtml(order.paymentStatus.replaceAll('_', ' '))}</span> · Method: Cash on Delivery</p></div></div>
        <div class="col-lg-5"><div class="feature-card"><h2 class="h4">Delivery details</h2><p>${escapeHtml(order.address.recipient_name)} · ${escapeHtml(order.address.phone)}<br>${escapeHtml(order.address.line1)} ${escapeHtml(order.address.line2)}<br>${escapeHtml(order.address.city)}, ${escapeHtml(order.address.state)} ${escapeHtml(order.address.postal_code)}</p><h3 class="h5">Status history</h3><ul class="detail-list">${order.history.map((item) => `<li><strong>${escapeHtml(item.status.replaceAll('_', ' '))}</strong><br><span class="small text-secondary">${new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · ${escapeHtml(item.note || 'Status updated')}</span></li>`).join('')}</ul>${['awaiting_confirmation', 'confirmed'].includes(order.status) ? `<button class="btn btn-outline-danger" data-cancel-order="${escapeHtml(order.id)}">Cancel order</button>` : ''}</div></div></div>
      </section>`;
    return;
  }
  const data = await api('/api/orders');
  appRoot.innerHTML = `${pageHeader('Your account', 'My orders', 'View your order details and track delivery progress.')}
    <section class="container section-space">${data.orders.length ? `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>${data.orders.map((order) => `<tr><td>${escapeHtml(order.orderNumber)}</td><td>${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td><span class="status-pill">${escapeHtml(order.status.replaceAll('_', ' '))}</span></td><td>${money(order.totalPaise)}</td><td><a href="/orders/${encodeURIComponent(order.id)}">View details</a></td></tr>`).join('')}</tbody></table></div>` : emptyState('No orders yet', 'Your orders will appear here.', '/shop', 'Explore products')}</section>`;
}

async function renderNotifications() {
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Your account', 'Notifications')}<section class="container section-space">${emptyState('Sign in to view notifications', 'Notifications are private to your account.', '/login', 'Sign in')}</section>`;
    return;
  }
  const [data, restockData] = await Promise.all([
    api('/api/notifications'),
    api('/api/restock-subscriptions'),
  ]);
  appRoot.innerHTML = `${pageHeader('Your account', 'Notifications', 'Private updates about your account and orders.')}
    <section class="container section-space">
      <div class="d-flex justify-content-between align-items-center mb-3"><p class="mb-0">${data.unreadCount} unread</p><button class="btn btn-outline-brand btn-sm" data-read-all>Mark all as read</button></div>
      ${data.notifications.length ? `<div class="row g-3">${data.notifications.map((item) => `<div class="col-12"><article class="address-card"><div class="d-flex justify-content-between gap-3"><h2 class="h5">${escapeHtml(item.title)} ${item.readAt ? '' : '<span class="status-pill">New</span>'}</h2><span class="small text-secondary">${new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div><p>${escapeHtml(item.body)}</p>${item.href ? `<a href="${escapeHtml(item.href)}">View details</a>` : ''}${!item.readAt ? ` <button class="btn btn-link btn-sm" data-read-notification="${escapeHtml(item.id)}">Mark read</button>` : ''}</article></div>`).join('')}</div>` : emptyState('All caught up', 'New updates will appear here.')}
      <h2 class="h4 mt-5">Restock alerts</h2>
      ${restockData.subscriptions.length ? `<div class="row g-3">${restockData.subscriptions.map((item) => `<div class="col-md-6"><article class="address-card"><h3 class="h6">${escapeHtml(item.productName)} · ${escapeHtml(item.packSize)}</h3><a href="/product/${encodeURIComponent(item.slug)}">Product details</a><button class="btn btn-sm btn-outline-danger ms-2" data-remove-restock="${escapeHtml(item.variantId)}">Unsubscribe</button></article></div>`).join('')}</div>` : '<p class="text-secondary">No active restock alerts.</p>'}
    </section>`;
  if (state.eventSource) state.eventSource.close();
  state.eventSource = new EventSource('/api/notifications/events');
  state.eventSource.addEventListener('notifications', (event) => {
    const result = JSON.parse(event.data);
    if (Number(result.unreadCount) > data.unreadCount) {
      toast('You have a new notification.');
      void renderNotifications();
    }
  });
}

function applyAdminFilters(kind) {
  const form = appRoot.querySelector('[data-admin-filter]');
  if (!form || form.dataset.adminFilter !== kind) return;
  const values = new FormData(form);
  const query = String(values.get('search') ?? '').trim().toLowerCase();
  const status = String(values.get('status') ?? '');
  const payment = String(values.get('payment') ?? '');
  const from = String(values.get('from') ?? '');
  const to = String(values.get('to') ?? '');
  let visible = 0;
  const rows = [...appRoot.querySelectorAll('[data-admin-filter-row]')];
  rows.forEach((row) => {
    const matches = (!query || row.dataset.search.includes(query))
      && (!status || row.dataset.status === status)
      && (!payment || row.dataset.payment === payment)
      && (!from || row.dataset.date >= from)
      && (!to || row.dataset.date <= to);
    row.hidden = !matches;
    if (matches) visible += 1;
  });
  const count = appRoot.querySelector('[data-admin-filter-count]');
  if (count) count.textContent = `${visible} result${visible === 1 ? '' : 's'}`;
  const empty = appRoot.querySelector('[data-admin-filter-empty]');
  if (empty) empty.hidden = rows.length === 0 || visible !== 0;
}

function renderAdminOrder(order) {
  const date = new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  let phone = String(order.phone ?? '').replace(/\D/g, '');
  if (phone.length === 10) phone = `91${phone}`;
  const message = [
    `Hello ${order.fullName}, your order ${order.orderNumber} is confirmed.`,
    ...(order.items ?? []).map((item) => `${item.productName} (${item.packSize}) × ${item.quantity}`),
    `Total: ${money(order.totalPaise)}.`,
    'Thank you for choosing BR Millet Choice.',
  ].join('\n');
  const whatsappLink = order.status === 'confirmed' && phone.length >= 10 && phone.length <= 15
    ? `<a class="admin-order-whatsapp" href="https://wa.me/${phone}?text=${encodeURIComponent(message)}" target="_blank" rel="noopener noreferrer">Prepare WhatsApp message</a>`
    : '';
  const orderStatuses = [
    ['confirmed', 'Confirm'],
    ['preparing', 'Preparing'],
    ['ready_for_dispatch', 'Ready for dispatch'],
    ['shipped', 'Shipped'],
    ['out_for_delivery', 'Out for delivery'],
    ['delivered', 'Delivered'],
    ['rejected', 'Reject'],
    ['cancelled', 'Cancel'],
  ];
  const refDisplay = order.paymentReference
    ? `<div class="mt-1 small"><span class="badge bg-light text-dark border">Ref: ${escapeHtml(order.paymentReference)}</span></div>`
    : '';
  const markPaidButton = order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded'
    ? `<button class="btn btn-sm btn-success mt-1 py-0 px-2" style="font-size:0.75rem" data-quick-mark-paid="${escapeHtml(order.id)}" data-ref="${escapeHtml(order.paymentReference || '')}">✓ Quick Mark Paid</button>`
    : '';
  return `<article class="admin-order-row">
    <div class="admin-order-customer" data-label="Order / customer"><strong>${escapeHtml(order.orderNumber)}</strong><span>${escapeHtml(order.fullName)} · ${escapeHtml(order.email)}</span>${refDisplay}</div>
    <div data-label="Date">${escapeHtml(date)}</div>
    <div data-label="Total">${money(order.totalPaise)}</div>
    <div data-label="Order status"><span class="status-pill">${escapeHtml(order.status.replaceAll('_', ' '))}</span>${whatsappLink}</div>
    <div data-label="Payment"><span class="status-pill">${escapeHtml(order.paymentStatus)}</span>${markPaidButton}</div>
    <form data-form="admin-order-status" data-order-id="${escapeHtml(order.id)}" class="admin-order-control">
      <label class="visually-hidden" for="order-status-${escapeHtml(order.id)}">Update order status for ${escapeHtml(order.orderNumber)}</label>
      <select class="form-select form-select-sm" id="order-status-${escapeHtml(order.id)}" name="status"><option value="">Update order…</option>${orderStatuses.map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>
      <button class="btn btn-sm btn-outline-brand" type="submit">Save</button>
    </form>
    <form data-form="admin-payment" data-order-id="${escapeHtml(order.id)}" class="admin-order-control admin-payment-control">
      <label class="visually-hidden" for="payment-status-${escapeHtml(order.id)}">Update payment status for ${escapeHtml(order.orderNumber)}</label>
      <select class="form-select form-select-sm" id="payment-status-${escapeHtml(order.id)}" name="status"><option value="">Update payment…</option><option value="pending">Pending</option><option value="paid">Verified paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select>
      <input class="form-control form-control-sm" name="providerReference" aria-label="Payment reference" placeholder="Reference" value="${escapeHtml(order.paymentReference || '')}" maxlength="200">
      <button class="btn btn-sm btn-outline-brand" type="submit">Save</button>
    </form>
  </article>`;
}

async function loadAdminOrders({ append = false, reset = false } = {}) {
  const form = appRoot.querySelector('[data-admin-filter="orders"]');
  const list = appRoot.querySelector('[data-admin-order-list]');
  const moreButton = appRoot.querySelector('[data-admin-order-more]');
  const count = appRoot.querySelector('[data-admin-order-count]');
  const empty = appRoot.querySelector('[data-admin-order-empty]');
  if (!form || !list || !moreButton || !count || !empty) return;

  const sequence = ++state.adminOrdersRequest;
  const offset = append && !reset ? state.adminOrdersOffset : 0;
  const values = new FormData(form);
  const query = new URLSearchParams({ offset: String(offset) });
  const previousButtonState = append ? showButtonProgress(moreButton) : null;
  for (const key of ['search', 'status', 'payment', 'from', 'to']) {
    const value = String(values.get(key) ?? '').trim();
    if (value) query.set(key === 'search' ? 'q' : key, value);
  }
  if (!append) {
    count.textContent = 'Loading orders…';
    moreButton.hidden = true;
  }
  list.setAttribute('aria-busy', 'true');
  moreButton.disabled = true;
  if (!append) moreButton.textContent = 'Loading…';
  try {
    const result = await api(`/api/admin/orders?${query}`);
    if (sequence !== state.adminOrdersRequest) return;
    const rows = result.orders.map(renderAdminOrder).join('');
    if (append) list.insertAdjacentHTML('beforeend', rows);
    else list.innerHTML = rows;
    state.adminOrdersOffset = offset + result.orders.length;
    count.textContent = result.total
      ? `Showing ${state.adminOrdersOffset} of ${result.total} order${result.total === 1 ? '' : 's'}`
      : '0 orders';
    empty.hidden = result.total !== 0;
    moreButton.hidden = !result.hasMore;
    moreButton.textContent = 'Load more orders';
  } catch (error) {
    if (sequence !== state.adminOrdersRequest) return;
    toast(error.message, true);
    if (!append) list.replaceChildren();
    count.textContent = 'Could not load orders.';
    empty.hidden = true;
    moreButton.hidden = true;
    moreButton.textContent = 'Load more orders';
  } finally {
    if (sequence === state.adminOrdersRequest) {
      moreButton.disabled = false;
      list.removeAttribute('aria-busy');
      restoreButtonProgress(moreButton, previousButtonState);
    }
  }
}

async function renderAdminContent() {
  state.adminOrdersRequest += 1;
  const user = await getSignedInUser();
  if (!user) {
    appRoot.innerHTML = `${pageHeader('Restricted area', 'Admin sign-in required')}<section class="container section-space">${emptyState('Sign in to continue', 'Admin pages are available only after signing in with an authorized admin account.', '/login', 'Sign in')}</section>`;
    return;
  }
  if (user.role !== 'admin') {
    appRoot.innerHTML = `${pageHeader('Restricted area', 'Admin access not enabled')}<section class="container section-space"><div class="empty-state"><h2>This account has customer access</h2><p class="text-secondary">You are signed in, but this account is not marked as an admin in the active database. Sign in with an admin account, or ask the database owner to enable admin access for your existing account.</p><a class="btn btn-outline-brand" href="/account">Return to my account</a></div></section>`;
    return;
  }

  const requestedPage = location.pathname.split('/')[2];
  const adminPage = ['products', 'manage-products', 'orders', 'reviews', 'enquiries', 'customers'].includes(requestedPage) ? requestedPage : 'dashboard';
  const [summary, productsData, enquiriesData, customersData, emailData, auditData, reviewsData] = await Promise.all([
    api('/api/admin/summary'),
    ['products', 'manage-products'].includes(adminPage) ? api('/api/admin/products') : Promise.resolve({ products: [] }),
    adminPage === 'enquiries' ? api('/api/admin/enquiries') : Promise.resolve({ enquiries: [] }),
    adminPage === 'customers' ? api('/api/admin/customers') : Promise.resolve({ customers: [] }),
    adminPage === 'enquiries' ? api('/api/admin/email-jobs') : Promise.resolve({ emailJobs: [] }),
    adminPage === 'enquiries' ? api('/api/admin/audit') : Promise.resolve({ events: [] }),
    adminPage === 'reviews' ? api('/api/admin/reviews') : Promise.resolve({ reviews: [] }),
  ]);
  const orderTotal = summary.ordersByStatus.reduce((total, row) => total + Number(row.count), 0);
  const productEditor = productsData.products.map((product) => `<article class="address-card mb-3">
    <form data-form="admin-product-edit" data-product-id="${escapeHtml(product.id)}">
      <div class="d-flex justify-content-between align-items-start gap-3"><div><h3 class="h5">${escapeHtml(product.name)}</h3><span class="small text-secondary">/${escapeHtml(product.slug)} · ${product.active ? 'Active' : 'Inactive'}</span></div><div class="form-check"><input class="form-check-input" type="checkbox" name="active" id="active-${escapeHtml(product.id)}" ${product.active ? 'checked' : ''}><label class="form-check-label" for="active-${escapeHtml(product.id)}">Active</label></div></div>
      <div class="row g-2 mt-1"><div class="col-md-6"><label class="form-label">Product name</label><input class="form-control form-control-sm" name="name" value="${escapeHtml(product.name)}" required maxlength="120"></div><div class="col-md-6"><label class="form-label">Category</label><input class="form-control form-control-sm" name="category" value="${escapeHtml(product.category)}" maxlength="80"></div><div class="col-12"><label class="form-label">Description</label><textarea class="form-control form-control-sm" name="description" rows="2" maxlength="5000">${escapeHtml(product.description)}</textarea></div><div class="col-md-6"><label class="form-label">Ingredients</label><textarea class="form-control form-control-sm" name="ingredients" rows="2" maxlength="1000">${escapeHtml(product.ingredients ?? '')}</textarea></div><div class="col-md-6"><label class="form-label">Storage instructions</label><textarea class="form-control form-control-sm" name="storageInstructions" rows="2" maxlength="1000">${escapeHtml(product.storageInstructions ?? '')}</textarea></div><div class="col-12"><label class="form-label" for="edit-image-${escapeHtml(product.id)}">Product image</label><input class="form-control form-control-sm" id="edit-image-${escapeHtml(product.id)}" data-product-image type="file" accept="image/jpeg,image/png,image/webp"><div class="form-text">Choose a JPEG, PNG, or WebP image up to 5 MB. Leave empty to keep the current image.</div>${product.imageUrl ? `<img class="admin-image-preview mt-2" data-image-preview src="${escapeHtml(product.imageUrl)}" alt="Current image for ${escapeHtml(product.name)}">` : '<img class="admin-image-preview mt-2" data-image-preview alt="Selected product image" hidden>'}</div><div class="col-12 d-flex justify-content-between align-items-center mt-2 pt-2 border-top"><button class="btn btn-sm btn-outline-brand">Save product details</button><button type="button" class="btn btn-sm btn-outline-danger" data-delete-product="${escapeHtml(product.id)}" data-product-name="${escapeHtml(product.name)}">Delete product</button></div></div>
    </form>
    <h4 class="h6 mt-4">Pack options and inventory</h4>
    ${product.variants.map((variant) => `<form data-form="admin-variant" data-variant-id="${escapeHtml(variant.id)}" class="admin-variant-form mb-3"><div><label class="form-label small">SKU</label><input class="form-control form-control-sm" name="sku" value="${escapeHtml(variant.sku)}" required maxlength="60"></div><div><label class="form-label small">Pack size</label><input class="form-control form-control-sm" name="packSize" value="${escapeHtml(variant.packSize)}" required maxlength="30"></div><div><label class="form-label small">Price (₹)</label><input class="form-control form-control-sm" name="priceRupees" type="number" step="0.01" min="0" value="${(Number(variant.pricePaise) / 100).toFixed(2)}" required></div><div><label class="form-label small">Stock</label><input class="form-control form-control-sm" name="stockQuantity" type="number" min="0" value="${variant.stockQuantity}" required></div><div><label class="form-label small">Low-stock alert</label><input class="form-control form-control-sm" name="lowStockThreshold" type="number" min="0" value="${variant.lowStockThreshold}" required></div><div class="admin-variant-active"><span class="form-label small">Availability</span><div class="form-check"><input class="form-check-input" name="active" type="checkbox" id="variant-${escapeHtml(variant.id)}" ${variant.active ? 'checked' : ''}><label class="form-check-label small" for="variant-${escapeHtml(variant.id)}">Active</label></div></div><div class="admin-variant-save"><span class="form-label small d-none d-sm-block">&nbsp;</span><div class="d-flex gap-1"><button class="btn btn-sm btn-outline-brand">Save</button><button type="button" class="btn btn-sm btn-outline-danger" data-delete-variant="${escapeHtml(variant.id)}" data-variant-name="${escapeHtml(variant.packSize)}">Delete</button></div></div><div class="admin-variant-history"><button class="btn btn-link btn-sm p-0" type="button" data-inventory-history="${escapeHtml(variant.id)}">View inventory history</button><div class="small" data-movement-list="${escapeHtml(variant.id)}"></div></div></form>`).join('') || '<p class="small text-secondary">No pack options have been added.</p>'}
    <form data-form="admin-add-variant" data-product-id="${escapeHtml(product.id)}" class="admin-variant-form border-top pt-3"><div><label class="form-label small">New SKU</label><input class="form-control form-control-sm" name="sku" required maxlength="60"></div><div><label class="form-label small">Pack size</label><input class="form-control form-control-sm" name="packSize" required maxlength="30"></div><div><label class="form-label small">Price (₹)</label><input class="form-control form-control-sm" name="priceRupees" type="number" step="0.01" min="0" required></div><div><label class="form-label small">Stock</label><input class="form-control form-control-sm" name="stockQuantity" type="number" min="0" required></div><div><label class="form-label small">Threshold</label><input class="form-control form-control-sm" name="lowStockThreshold" type="number" min="0" value="5" required></div><div class="admin-variant-active"><span class="form-label small">Availability</span><div class="form-check"><input class="form-check-input" name="active" type="checkbox" id="new-variant-${escapeHtml(product.id)}" checked><label class="form-check-label small" for="new-variant-${escapeHtml(product.id)}">Active</label></div></div><div class="admin-variant-save"><span class="form-label small d-none d-sm-block">&nbsp;</span><button class="btn btn-sm btn-outline-brand">Add</button></div></form>
  </article>`).join('') || '<p class="text-secondary">No products in the catalogue.</p>';
  const enquiryCards = enquiriesData.enquiries.map((item) => {
    const searchable = `${item.subject} ${item.name} ${item.email} ${item.message}`.toLowerCase();
    const date = dateInputValue(item.createdAt);
    return `<article class="enquiry-card-elevated mb-3 admin-filter-row" data-admin-filter-row data-search="${escapeHtml(searchable)}" data-status="${escapeHtml(item.status)}" data-date="${date}">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div class="d-flex align-items-center gap-3">
          <div class="enquiry-avatar">${escapeHtml(item.name.trim().slice(0, 1).toUpperCase())}</div>
          <div>
            <h3 class="h6 mb-0 text-dark fw-bold">${escapeHtml(item.subject)}</h3>
            <span class="small text-secondary">${escapeHtml(item.name)} · <a href="mailto:${encodeURIComponent(item.email)}" class="text-decoration-none text-forest">${escapeHtml(item.email)}</a></span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="enquiry-status-badge status-${item.status}">${escapeHtml(item.status.replaceAll('_', ' '))}</span>
          <span class="small text-secondary text-nowrap">${new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })}</span>
        </div>
      </div>
      <div class="enquiry-body my-3">
        <p class="enquiry-message mb-0">${escapeHtml(item.message)}</p>
      </div>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
        <form data-form="admin-enquiry" data-enquiry-id="${escapeHtml(item.id)}" class="d-flex align-items-center gap-2">
          <select class="form-select form-select-sm" name="status" style="width: auto;">
            <option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option>
            <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>In progress</option>
            <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          </select>
          <button class="btn btn-sm btn-brand-soft" type="submit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Save Status
          </button>
        </form>
        <button type="button" class="btn btn-sm btn-danger-soft" data-delete-enquiry="${escapeHtml(item.id)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete Enquiry
        </button>
      </div>
    </article>`;
  }).join('') || '<p class="text-secondary">No customer enquiries yet.</p>';
  const customerCards = customersData.customers.map((customer) => {
    const searchable = `${customer.fullName} ${customer.email}`.toLowerCase();
    const date = dateInputValue(customer.createdAt);
    const verification = customer.emailVerifiedAt ? 'verified' : 'unverified';
    const recentOrders = customer.recentOrders?.length
      ? `<ul class="small mt-3 mb-0">${customer.recentOrders.map((order) => `<li><strong>${escapeHtml(order.orderNumber)}</strong> · <span class="badge bg-secondary">${escapeHtml(order.status.replaceAll('_', ' '))}</span> · payment ${escapeHtml(order.paymentStatus)} · <strong>${money(order.totalPaise)}</strong> · ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>`).join('')}</ul>`
      : '<p class="small text-secondary mt-3 mb-0">No orders placed yet.</p>';
    return `<article class="customer-card-elevated mb-3 admin-filter-row" data-admin-filter-row data-search="${escapeHtml(searchable)}" data-status="${verification}" data-date="${date}">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-2 border-bottom">
        <div class="d-flex align-items-center gap-3">
          <div class="customer-avatar">${escapeHtml(customer.fullName.trim().slice(0, 1).toUpperCase())}</div>
          <div>
            <h3 class="h6 mb-0 fw-bold text-dark">${escapeHtml(customer.fullName)}</h3>
            <a class="small text-secondary text-decoration-none" href="mailto:${encodeURIComponent(customer.email)}">${escapeHtml(customer.email)}</a>
          </div>
        </div>
        <span class="badge ${verification === 'verified' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning border border-warning-subtle'} px-2 py-1 rounded-pill">
          ${verification === 'verified' ? '✓ Email Verified' : '⚠️ Unverified'}
        </span>
      </div>
      <div class="row g-2 mt-2">
        <div class="col-sm-4"><div class="stat-pill"><span class="label">Joined</span><strong>${new Date(customer.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></div></div>
        <div class="col-sm-4"><div class="stat-pill"><span class="label">Order Requests</span><strong class="text-success">${customer.orderCount}</strong></div></div>
        <div class="col-sm-4"><div class="stat-pill"><span class="label">Lifetime Spend</span><strong class="text-primary">${money(customer.totalOrderPaise)}</strong></div></div>
      </div>
      <details class="customer-activity-details mt-3">
        <summary class="fw-semibold text-secondary" style="cursor:pointer">Recent order activity (${customer.recentOrders?.length || 0})</summary>
        ${recentOrders}
      </details>
    </article>`;
  }).join('') || '<p class="text-secondary">No customer accounts registered yet.</p>';
  const filterForm = (kind, includePayment = false, verification = false) => `<form class="admin-filter-panel mb-3" data-admin-filter="${kind}" role="search"><div class="admin-filter-grid"><div><label class="form-label small" for="${kind}-search">Search</label><input class="form-control" id="${kind}-search" name="search" type="search" placeholder="${kind === 'orders' ? 'Order, name, or email' : kind === 'enquiries' ? 'Name, email, subject, or message' : 'Customer name or email'}"></div><div><label class="form-label small" for="${kind}-status">${verification ? 'Email status' : 'Status'}</label><select class="form-select" id="${kind}-status" name="status"><option value="">All</option>${verification ? '<option value="verified">Verified</option><option value="unverified">Not verified</option>' : kind === 'orders' ? '<option value="awaiting_confirmation">Awaiting confirmation</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="ready_for_dispatch">Ready for dispatch</option><option value="shipped">Shipped</option><option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option>' : '<option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>'}</select></div>${includePayment ? '<div><label class="form-label small" for="orders-payment">Payment status</label><select class="form-select" id="orders-payment" name="payment"><option value="">All payments</option><option value="unpaid">Unpaid</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>' : ''}<div><label class="form-label small" for="${kind}-from">From</label><input class="form-control" id="${kind}-from" name="from" type="date"></div><div><label class="form-label small" for="${kind}-to">To</label><input class="form-control" id="${kind}-to" name="to" type="date"></div></div><p class="small text-secondary mt-2 mb-0" data-admin-filter-count></p></form>`;
  const emailJobs = emailData.emailJobs.map((job) => `<li>${escapeHtml(job.template)} → ${escapeHtml(job.recipient)} · ${escapeHtml(job.status)}${job.lastError ? ` · ${escapeHtml(job.lastError)}` : ''}</li>`).join('') || '<li>No email jobs recorded.</li>';
  const dashboard = `<section class="container section-space"><div class="row g-3 mb-4"><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.productCount}</strong><span>Products</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${orderTotal}</strong><span>Order requests</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.customerCount}</strong><span>Customers</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.newEnquiries}</strong><span>New enquiries</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.lowStock}</strong><span>Low-stock options</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.outOfStock}</strong><span>Out of stock</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.pendingReviews || 0}</strong><span>Pending reviews</span></div></div><div class="col-6 col-xl-3"><div class="admin-stat"><strong>${summary.reviewCount || 0}</strong><span>Total reviews</span></div></div></div><div class="row g-3 mb-5"><div class="col-sm-6 col-xl-3"><a class="admin-shortcut" href="/admin/products"><strong>Products and inventory</strong><span>${summary.productCount} products in your catalogue</span><span class="admin-shortcut-action">Manage products</span></a></div><div class="col-sm-6 col-xl-3"><a class="admin-shortcut" href="/admin/orders"><strong>Orders</strong><span>Search requests and update status or payment</span><span class="admin-shortcut-action">Manage orders</span></a></div><div class="col-sm-6 col-xl-3"><a class="admin-shortcut" href="/admin/reviews"><strong>Customer Reviews</strong><span>${summary.reviewCount || 0} reviews (${summary.pendingReviews || 0} pending)</span><span class="admin-shortcut-action">Moderate reviews</span></a></div><div class="col-sm-6 col-xl-3"><a class="admin-shortcut" href="/admin/enquiries"><strong>Enquiries</strong><span>Filter, respond to, or delete messages</span><span class="admin-shortcut-action">Manage enquiries</span></a></div><div class="col-sm-6 col-xl-3"><a class="admin-shortcut" href="/admin/customers"><strong>Customers</strong><span>Review customer accounts and order summaries</span><span class="admin-shortcut-action">View customers</span></a></div></div><section class="admin-visits-card"><div><p class="eyebrow mb-1">Store traffic</p><h2 class="h4 mb-1">Public page visits</h2><p class="small text-secondary mb-0">Aggregate count only. No visitor names, addresses, or IP addresses are stored.</p></div><strong>${Number(summary.pageVisits).toLocaleString('en-IN')}</strong></section><p class="small text-secondary mt-3 mb-0">Failed email jobs: ${summary.failedEmails}. Visits count public page loads; analytics are separate and only load after consent.</p></section>`;
  const productsPage = `<section class="container section-space"><div class="row g-4"><div class="col-12"><form id="products" class="address-card" data-form="admin-product"><p class="eyebrow mb-1">Catalogue management</p><h2 class="h4">Add product</h2><p class="small text-secondary">Add the product details and its initial pack option. Published products appear immediately on the storefront for customers to order.</p><div class="row g-3"><div class="col-md-6"><label class="form-label" for="product-name">Product Name</label><input class="form-control" id="product-name" name="name" data-product-name required maxlength="120" placeholder="e.g. Pure Foxtail Millet Powder"></div><div class="col-md-6"><label class="form-label" for="product-slug">Web Link Identifier (Slug)</label><input class="form-control" id="product-slug" name="slug" data-product-slug pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="Auto-generated from product name"></div><div class="col-12"><label class="form-label" for="product-description">Description &amp; Health Benefits</label><textarea class="form-control" id="product-description" name="description" rows="3" maxlength="5000" placeholder="Describe the health benefits, grain source, or preparation method..."></textarea></div><div class="col-md-6"><label class="form-label" for="product-category">Product Category</label><input class="form-control" id="product-category" name="category" maxlength="80" placeholder="e.g. Whole Millets, Flours, Health Mixes"></div><div class="col-md-6"><label class="form-label" for="ingredients">Ingredients List</label><textarea class="form-control" id="ingredients" name="ingredients" rows="2" maxlength="1000" placeholder="e.g. 100% Whole Foxtail Millet (No preservatives)"></textarea></div><div class="col-md-6"><label class="form-label" for="storage-instructions">Storage Instructions</label><textarea class="form-control" id="storage-instructions" name="storageInstructions" rows="2" maxlength="1000" placeholder="e.g. Store in an airtight container in a cool, dry place."></textarea></div><div class="col-md-6"><label class="form-label" for="product-image-new">Product Image (Photo)</label><input class="form-control" id="product-image-new" data-product-image type="file" accept="image/jpeg,image/png,image/webp,image/jpg"><div class="form-text">JPG, PNG, or WebP. Automatically optimized for fast mobile loading.</div><img class="admin-image-preview mt-2 border rounded-3" data-image-preview alt="Selected product image" style="max-height:160px;object-fit:cover" hidden></div></div><hr><h3 class="h5">First Pack Option &amp; Pricing</h3><div class="row g-3"><div class="col-md-6"><label class="form-label" for="variant-sku">Product Code / SKU (Optional)</label><input class="form-control" id="variant-sku" name="sku" maxlength="60" placeholder="Auto-generated if left blank"></div><div class="col-md-6"><label class="form-label" for="pack-size">Pack Size / Weight</label><input class="form-control" id="pack-size" name="packSize" required maxlength="30" placeholder="e.g. 500g, 1 kg"></div><div class="col-md-6"><label class="form-label" for="price">Selling Price (₹)</label><input class="form-control" id="price" name="priceRupees" type="number" step="0.01" min="0" placeholder="e.g. 180" required></div><div class="col-md-6"><label class="form-label" for="stock">Available Stock (Packets)</label><input class="form-control" id="stock" name="stockQuantity" type="number" min="0" placeholder="e.g. 20" required></div></div><div class="form-check my-3"><input class="form-check-input" type="checkbox" id="active" name="active" checked><label class="form-check-label fw-bold text-success" for="active">✓ Publish immediately (Visible to customers)</label><div class="form-text">When checked, customers can immediately see and purchase this product on the shop page.</div></div><button class="btn btn-brand btn-lg" type="submit">Create and Publish Product</button></form></div><div class="col-12"><h2 class="h4">Products and inventory <span class="small text-secondary">(${productsData.products.length})</span></h2>${productEditor}</div></div></section>`;
  const addProductsPage = productsPage.replace(
    '<div class="col-12"><h2 class="h4">Products and inventory',
    '<div class="col-12" hidden><h2 class="h4">Products and inventory',
  );
  const manageProductsPage = productsPage
    .replace('Products and inventory', 'Manage products')
    .replace('<div class="col-12"><form id="products"', '<div class="col-12" hidden><form id="products"');
  const ordersPage = `<section class="container section-space">${filterForm('orders', true)}<div class="admin-order-toolbar"><p class="small text-secondary mb-0" data-admin-order-count aria-live="polite">Loading orders…</p><button class="btn btn-sm btn-outline-brand" type="button" data-admin-clear-filters>Clear filters</button></div><div class="admin-order-table"><div class="admin-order-header" aria-hidden="true"><span>Order / customer</span><span>Date</span><span>Total</span><span>Order status</span><span>Payment</span><span>Update order</span><span>Update payment</span></div><div data-admin-order-list></div></div><p class="empty-state mt-3" data-admin-order-empty hidden>No orders match these filters.</p><div class="text-center mt-3"><button class="btn btn-outline-brand" type="button" data-admin-order-more hidden>Load more orders</button></div></section>`;
  const reviewsPage = `<section class="container section-space">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <p class="small text-secondary mb-0">Manage customer ratings and reviews. Approved reviews appear publicly on product pages.</p>
    </div>
    ${reviewsData.reviews.length ? `<div class="row g-3">${reviewsData.reviews.map((r) => `
      <div class="col-12">
        <article class="address-card">
          <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <h3 class="h5 mb-1">${escapeHtml(r.title)}</h3>
              <div class="small text-secondary">By <strong>${escapeHtml(r.customerName)}</strong> on <strong>${escapeHtml(r.productName)}</strong> · ${new Date(r.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="badge ${r.isApproved ? 'bg-success' : 'bg-warning text-dark'}">${r.isApproved ? 'Approved & Public' : 'Pending Approval'}</span>
              <span class="text-warning fw-bold">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
          </div>
          <p class="mt-2 mb-3">${escapeHtml(r.comment)}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm ${r.isApproved ? 'btn-outline-warning' : 'btn-outline-success'}" data-admin-review-toggle="${escapeHtml(r.id)}" data-approved="${r.isApproved ? 'false' : 'true'}">${r.isApproved ? 'Hide from public' : 'Approve for public'}</button>
            <button class="btn btn-sm btn-outline-danger" data-admin-review-delete="${escapeHtml(r.id)}">Delete review</button>
          </div>
        </article>
      </div>`).join('')}</div>` : emptyState('No reviews submitted yet', 'Customer reviews submitted on product pages will appear here for moderation.')}
  </section>`;
  const enquiriesPage = `<section class="container section-space">${filterForm('enquiries')}${enquiryCards}<p class="empty-state mt-3" data-admin-filter-empty hidden>No enquiries match these filters.</p><div class="row g-4 mt-4"><div class="col-lg-6"><div class="feature-card h-100 p-3"><div class="d-flex justify-content-between align-items-center mb-2"><h2 class="h5 mb-0 fw-bold">Email Notifications</h2><button class="btn btn-sm btn-outline-brand" type="button" data-test-email>⚡ Send test email</button></div><p class="small text-secondary mb-3">Delivery log for customer order confirmations, receipts, and admin alerts.</p><ul class="small ps-3 mb-0">${emailJobs}</ul></div></div><div class="col-lg-6"><div class="feature-card h-100 p-3"><h2 class="h5 mb-2 fw-bold">Recent Admin Activity</h2><ul class="small ps-3 mb-0">${auditData.events.map((event) => `<li>${escapeHtml(event.action)} · ${escapeHtml(event.entityType)} ${escapeHtml(event.entityId ?? '')} · ${new Date(event.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>`).join('') || '<li>No audit events yet.</li>'}</ul></div></div></div></section>`;
  const customersPage = `<section class="container section-space"><p class="small text-secondary">Customer contact and order summary only; private delivery addresses are not displayed here.</p>${filterForm('customers', false, true)}${customerCards}<p class="empty-state mt-3" data-admin-filter-empty hidden>No customers match these filters.</p></section>`;
  const pageTitles = { dashboard: ['Dashboard', 'Your store at a glance, with direct access to every management area.'], products: ['Add products', 'Create a new product and its first pack option.'], 'manage-products': ['Manage products', 'Update catalogue details, pack options and inventory.'], orders: ['Order management', 'Search and filter requests, then update order or payment status.'], reviews: ['Customer reviews', 'Moderate customer feedback and approve ratings to appear on product pages.'], enquiries: ['Customer enquiries', 'Search, filter, update, or delete customer messages.'], customers: ['Customers', 'Review customer accounts, verification, and order summaries.'] };
  const dashboardContent = dashboard.replaceAll('/admin/products', '/admin/manage-products');
  const pageContent = { dashboard: dashboardContent, products: addProductsPage, 'manage-products': manageProductsPage, orders: ordersPage, reviews: reviewsPage, enquiries: enquiriesPage, customers: customersPage }[adminPage];
  appRoot.innerHTML = `${pageHeader('Administration', pageTitles[adminPage][0], pageTitles[adminPage][1])}${pageContent}`;
  if (adminPage === 'orders') {
    state.adminOrdersOffset = 0;
    void loadAdminOrders();
  }
  const filter = appRoot.querySelector('[data-admin-filter]');
  if (filter) {
    filter.addEventListener('submit', (event) => event.preventDefault());
    if (filter.dataset.adminFilter === 'orders') {
      let searchTimer;
      filter.addEventListener('input', (event) => {
        if (event.target.name !== 'search') return;
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => void loadAdminOrders({ reset: true }), 250);
      });
      filter.addEventListener('change', () => {
        window.clearTimeout(searchTimer);
        void loadAdminOrders({ reset: true });
      });
      filter.addEventListener('reset', () => {
        window.clearTimeout(searchTimer);
        window.setTimeout(() => void loadAdminOrders({ reset: true }), 0);
      });
      appRoot.querySelector('[data-admin-clear-filters]').addEventListener('click', () => filter.reset());
      appRoot.querySelector('[data-admin-order-more]').addEventListener('click', () => void loadAdminOrders({ append: true }));
    } else {
      const apply = () => applyAdminFilters(filter.dataset.adminFilter);
      filter.addEventListener('input', apply);
      filter.addEventListener('change', apply);
      apply();
    }
  }
}
async function renderPage() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const route = path.startsWith('/product/') ? '/product'
    : path.startsWith('/orders/') ? '/orders'
      : path;
  const [title, description] = pageMeta[route] ?? ['Page not found | BR Millet Choice', 'The page you requested could not be found.'];
  updateSiteNavigation(route);
  void refreshCartBadge();
  document.title = title;
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[name="robots"]').content = ['/account', '/profile', '/addresses', '/cart', '/checkout', '/orders', '/notifications', '/admin', '/admin/products', '/admin/manage-products', '/admin/orders', '/admin/enquiries', '/admin/customers', '/login', '/signup', '/reset-password', '/forgot-password', '/verify'].includes(route) ? 'noindex,nofollow' : 'index,follow';
  const canonical = document.querySelector('link[rel="canonical"]');
  canonical.href = `${location.origin}${route === '/product' ? path : route}`;
  document.querySelector('[data-year]').textContent = String(new Date().getFullYear());

  const footer = document.querySelector('.site-footer');
  if (footer) {
    if (route === '/') {
      footer.classList.remove('d-none');
    } else {
      footer.classList.add('d-none');
    }
  }
  updatePageScrollProgress();

  try {
    await getConfig();
    updateSupportDetails();
    if (route === '/') return await renderHome();
    if (route === '/shop') return await renderShop();
    if (route === '/product') return await renderProduct(decodeURIComponent(path.split('/').pop()));
    if (route === '/about') return await renderAboutPage();
    if (route === '/millets') return renderMilletsPage();
    if (route === '/recipes') return renderIdeas();
    if (route === '/faq' || route === '/shipping' || route === '/refunds' || route === '/privacy' || route === '/terms') return renderContentPage(route);
    if (route === '/contact') return renderContact();
    if (route === '/signup' || route === '/login' || route === '/forgot-password' || route === '/reset-password') {
      renderAuthPage(route.slice(1), state.user);
      if (route === '/login') updateGoogleLink();
      return;
    }
    if (route === '/verify') return await renderVerify();
    if (route === '/account') return await renderAccount();
    if (route === '/profile') return await renderProfile();
    if (route === '/addresses') return await renderAccount();
    if (route === '/cart') return await renderCart();
    if (route === '/checkout') return await renderCheckout();
    if (route === '/orders') {
      if (!path.startsWith('/orders/')) return await renderOrders();
      return await renderOrders(path.split('/').pop());
    }
    if (route === '/notifications') return await renderAccount();
    if (route.startsWith('/admin')) return await renderAdminContent();
    appRoot.innerHTML = `${pageHeader('Not found', 'We couldn’t find that page')}<section class="container section-space">${emptyState('The page may have moved', 'Return to the shop or contact the business.', '/', 'Go home')}</section>`;
  } catch (error) {
    appRoot.innerHTML = `${pageHeader('Something went wrong', 'This page is temporarily unavailable')}<section class="container content-shell"><div class="notice">${escapeHtml(error.message)}</div><button class="btn btn-outline-brand mt-3" data-reload>Try again</button></section>`;
  }
}

function updateSupportDetails() {
  if (!state.config) return;
  const icon = {
    email: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>',
    phone: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3h3l2 5-2.2 1.8a15 15 0 0 0 4.4 4.4L16 12l5 2v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.7-3 2-3Z"></path></svg>',
    whatsapp: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L4 20l1.1-3.3A8.5 8.5 0 1 1 20 11.5Z"></path><path d="M9 8.5c.6 2.4 2.1 3.9 4.5 4.5l1-1 2 .8c-.3 1.5-1.1 2.2-2.6 2.2-3.5-.3-6.3-3.1-6.6-6.6 0-1.5.7-2.3 2.2-2.6l.8 2-1.3.7Z"></path></svg>',
    address: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg>',
    hours: '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
  };
  const label = (name, type) => `<span class="contact-label">${icon[type]}<span>${name}</span></span>`;
  const entries = [
    state.config.supportAddress ? `<li>${label('Business location', 'address')}<span>${escapeHtml(state.config.supportAddress)}</span></li>` : '',
    state.config.supportEmail ? `<li>${label('Email', 'email')}<a href="mailto:${encodeURIComponent(state.config.supportEmail)}">${escapeHtml(state.config.supportEmail)}</a></li>` : '',
    state.config.supportPhone ? `<li>${label('Phone', 'phone')}<a href="tel:${encodeURIComponent(state.config.supportPhone)}">${escapeHtml(state.config.supportPhone)}</a></li>` : '',
    state.config.whatsapp ? `<li>${label('WhatsApp', 'whatsapp')}<a href="https://wa.me/${encodeURIComponent(state.config.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener noreferrer">Message us</a></li>` : '',
  ].filter(Boolean);
  if (state.config.businessHours) {
    entries.push(`<li>${label('Business hours', 'hours')}<span class="business-hours">${escapeHtml(state.config.businessHours)}</span></li>`);
  }
  const updatedHtml = entries.length
    ? `<ul class="contact-detail-list">${entries.join('')}</ul>`
    : 'Contact details will appear here when the business adds them.';
  document.querySelectorAll('[data-support-details], [data-contact-details]').forEach((el) => { el.innerHTML = updatedHtml; });
  renderPublicLocationMap();
}

function updateSiteNavigation(route) {
  const activeHref = route === '/' ? '/'
    : ['/shop', '/product'].includes(route) ? '/shop'
      : ['/cart', '/checkout'].includes(route) ? '/cart'
        : route;
  document.querySelectorAll('.site-nav a').forEach((link) => {
    const linkUrl = new URL(link.href, location.origin);
    const active = linkUrl.pathname === activeHref;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function enhancePasswordInputs(root = appRoot) {
  root.querySelectorAll('input[type="password"]:not([data-password-toggle-ready])').forEach((input) => {
    input.dataset.passwordToggleReady = 'true';
    const wrapper = document.createElement('div');
    wrapper.className = 'password-input-wrap';
    input.before(wrapper);
    wrapper.append(input);
    const toggle = document.createElement('button');
    toggle.className = 'password-visibility-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('aria-pressed', 'false');
    toggle.title = 'Show password';
    toggle.innerHTML = '<svg class="password-eye-open" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg><svg class="password-eye-closed" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.9"/><path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.5 10.5 0 0 0 3-.4"/></svg>';
    toggle.addEventListener('click', () => {
      const showing = input.type === 'password';
      input.type = showing ? 'text' : 'password';
      toggle.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
      toggle.setAttribute('aria-pressed', String(showing));
      toggle.title = showing ? 'Hide password' : 'Show password';
      toggle.dataset.visible = String(showing);
    });
    wrapper.append(toggle);
  });
}

const passwordInputObserver = new MutationObserver(() => enhancePasswordInputs());
passwordInputObserver.observe(appRoot, { childList: true, subtree: true });
enhancePasswordInputs();

function updateGoogleLink() {
  if (state.config?.googleConfigured) {
    document.querySelector('[data-google-link]').innerHTML = '<div class="auth-divider" aria-label="Or sign in with"><span>OR</span></div><a class="btn btn-outline-brand w-100" href="/api/auth/google"><svg class="google-signin-icon" aria-hidden="true" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.4-4.55H24v9.02h12.94c-.58 2.96-2.25 5.47-4.72 7.16l7.62 5.91c4.45-4.1 7.14-10.14 7.14-17.54Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.95 23.95 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.91l-7.62-5.91c-2.12 1.42-4.84 2.26-8.28 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>Continue with Google</a>';
  } else {
    document.querySelector('[data-google-link]').innerHTML = '<p class="small text-secondary mb-0">Google sign-in will be available after the owner configures OAuth credentials.</p>';
  }
}

function markViewedPage(product = null) {
  if (!state.analyticsStarted || typeof window.gtag !== 'function') return;
  const privatePath = /^\/(account|profile|addresses|cart|checkout|orders|notifications|admin|login|signup|verify|forgot-password|reset-password)(\/|$)/;
  if (privatePath.test(location.pathname)) return;
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: `${location.origin}${location.pathname}`,
    page_path: location.pathname,
  });
  if (product) window.gtag('event', 'view_item', {
    currency: 'INR',
    items: product.variants.map((variant) => ({
      item_id: variant.sku,
      item_name: product.name,
      item_variant: variant.packSize,
      price: Number(variant.pricePaise) / 100,
    })),
  });
}

function startAnalytics() {
  if (state.analyticsStarted || !state.config?.analyticsId) return;
  state.analyticsStarted = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(state.config.analyticsId)}`;
  document.head.append(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', state.config.analyticsId, { send_page_view: false, anonymize_ip: true });
  markViewedPage();
}

function showAnalyticsPrompt() {
  if (!state.config?.analyticsId || localStorage.getItem('brmc-analytics-consent')) return;
  document.querySelector('#analytics-consent').classList.remove('d-none');
}

window.addEventListener('popstate', () => {
  startTopLoader();
  void renderPage().finally(stopTopLoader);
});

document.addEventListener('click', async (event) => {
  const upiChip = event.target.closest('[data-upi-chip]');
  if (upiChip) {
    event.preventDefault();
    const upiInput = document.querySelector('#checkout-upi-id');
    if (upiInput) {
      const handle = upiInput.value.split('@')[0] || 'yourname';
      upiInput.value = handle + upiChip.dataset.upiChip;
      upiInput.focus();
    }
    return;
  }
  const anchor = event.target.closest('a');
  if (anchor && anchor.href && !anchor.target && !anchor.hasAttribute('download') && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    try {
      const url = new URL(anchor.href, location.origin);
      if (url.origin === location.origin && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/uploads/') && !anchor.dataset.noSpa) {
        if (url.pathname === location.pathname && url.search === location.search) {
          if (url.hash) {
            const accountTab = anchor.closest('.account-nav-tab');
            if (accountTab) {
              document.querySelectorAll('.account-nav-tab').forEach((t) => t.classList.remove('active'));
              accountTab.classList.add('active');
            }
            setMobileNavigationOpen(false);
            return;
          }
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        event.preventDefault();
        setMobileNavigationOpen(false);
        window.history.pushState({}, '', url.pathname + url.search + url.hash);
        startTopLoader();
        try {
          await renderPage();
          window.scrollTo({ top: 0, behavior: 'instant' });
        } finally {
          stopTopLoader();
        }
        return;
      }
    } catch {
      // Allow standard browser navigation if URL parsing fails
    }
  }

  const clickedNavLink = event.target.closest('.site-nav a');
  if (clickedNavLink) {
    setMobileNavigationOpen(false);
  }
  const target = event.target.closest('button');
  if (!target) return;
  if (target.matches('[data-nav-toggle]')) {
    setMobileNavigationOpen(!target.matches('[aria-expanded="true"]'));
    return;
  }
  if (target.matches('[data-nav-close]')) {
    setMobileNavigationOpen(false, true);
    return;
  }
  const actionButton = target.matches('[data-add-to-cart], [data-buy-now], [data-restock], [data-delete-address], [data-remove-restock], [data-inventory-history], [data-remove-cart], [data-logout], [data-read-notification], [data-read-all], [data-cancel-order], [data-delete-enquiry], [data-admin-review-toggle], [data-admin-review-delete], [data-quick-mark-paid], [data-delete-product], [data-delete-variant], [data-test-email]');
  const previousButtonState = actionButton ? showButtonProgress(target) : null;
  try {
    if (target.matches('[data-sidebar-collapse]')) {
      const layout = document.querySelector('.site-layout');
      const collapsed = layout?.classList.toggle('sidebar-collapsed') ?? false;
      try {
        localStorage.setItem('brmc-sidebar-collapsed', String(collapsed));
      } catch (error) {
        console.warn('Sidebar preference could not be saved.', error);
      }
      target.setAttribute('aria-expanded', String(!collapsed));
      target.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      target.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    } else if (target.matches('[data-page-scroll]')) {
      const direction = target.dataset.direction;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: direction === 'up' ? 0 : document.documentElement.scrollHeight,
        behavior: reduceMotion ? 'instant' : 'smooth',
      });
    } else if (target.matches('[data-reload]')) {
      location.reload();
    } else if (target.matches('[data-analytics-choice]')) {
      const allowed = target.dataset.analyticsChoice === 'yes';
      localStorage.setItem('brmc-analytics-consent', allowed ? 'yes' : 'no');
      document.querySelector('#analytics-consent').classList.add('d-none');
      if (allowed) startAnalytics();
    } else if (target.matches('[data-add-to-cart]')) {
      const variantId = target.dataset.addToCart;
      const quantity = Number(document.querySelector('#product-quantity')?.value ?? 1);
      // Instant optimistic live update of cart badges across the screen
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        const prev = parseInt(el.textContent || '0', 10) || 0;
        el.textContent = String(prev + quantity);
      });
      target.textContent = '✓ Added to Cart';
      try {
        await api('/api/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
        if (state.analyticsStarted) window.gtag('event', 'add_to_cart', { currency: 'INR' });
        toast('Added to your cart.');
        void refreshCartBadge();
      } catch (err) {
        toast(err.message || 'Could not add to cart', true);
        void refreshCartBadge();
      }
      target.disabled = false;
      if (previousButtonState) previousButtonState.preserve = true;
    } else if (target.closest('[data-cart-step]')) {
      const stepBtn = target.closest('[data-cart-step]');
      const step = parseInt(stepBtn.dataset.cartStep, 10);
      const variantId = stepBtn.dataset.variantId;
      const row = document.querySelector(`[data-cart-row="${CSS.escape(variantId)}"]`);
      if (row) {
        const qtyInput = row.querySelector('.cart-qty-val');
        const lineTotalEl = row.querySelector('[data-line-total]');
        const unitPaise = parseInt(row.dataset.unitPaise, 10) || 0;
        let currentQty = parseInt(qtyInput?.value || '1', 10);
        let newQty = currentQty + step;

        if (newQty < 1) {
          const confirmed = await confirmAction({
            title: 'Remove Item',
            message: 'Do you want to remove this product from your cart?',
            confirmText: 'Remove',
            cancelText: 'Keep Item',
            isDanger: true,
          });
          if (!confirmed) return;
          row.style.opacity = '0.3';
          row.style.pointerEvents = 'none';
          try {
            await api(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
            toast('Item removed from cart.');
            await renderCart();
            void refreshCartBadge();
          } catch (err) {
            toast(err.message || 'Could not remove item', true);
            row.style.opacity = '1';
            row.style.pointerEvents = 'auto';
          }
          return;
        }

        if (newQty > 99) return;

        // 1. INSTANT 0ms DOM UPDATE: quantity & line total
        if (qtyInput) qtyInput.value = String(newQty);
        if (lineTotalEl) lineTotalEl.textContent = money(unitPaise * newQty);

        // Recalculate subtotal & grandtotal instantly across all rows
        let newSubtotalPaise = 0;
        let newTotalQty = 0;
        document.querySelectorAll('[data-cart-row]').forEach((r) => {
          const q = parseInt(r.querySelector('.cart-qty-val')?.value || '0', 10);
          const p = parseInt(r.dataset.unitPaise, 10) || 0;
          newSubtotalPaise += (q * p);
          newTotalQty += q;
        });
        const subtotalEl = document.querySelector('[data-cart-subtotal]');
        if (subtotalEl) subtotalEl.textContent = money(newSubtotalPaise);
        const grandTotalEl = document.querySelector('[data-cart-grandtotal]');
        if (grandTotalEl) grandTotalEl.textContent = money(newSubtotalPaise);

        // Instantly update ALL cart count badges across the page
        document.querySelectorAll('[data-cart-count]').forEach((el) => {
          el.textContent = String(newTotalQty);
        });

        // 2. Background API sync
        try {
          await api(`/api/cart/items/${encodeURIComponent(variantId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: newQty }),
          });
        } catch (err) {
          toast(err.message || 'Could not update quantity', true);
          await renderCart();
        }
      }
    } else if (target.matches('[data-buy-now]')) {
      const variantId = target.dataset.buyNow;
      const quantity = Number(document.querySelector('#product-quantity')?.value ?? 1);
      await api('/api/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
      void refreshCartBadge();
      toast('Proceeding to checkout...');
      history.pushState(null, '', '/checkout');
      await renderPage();
    } else if (target.matches('[data-qty-btn]')) {
      const action = target.dataset.qtyBtn;
      const qtyInput = document.querySelector('#product-quantity');
      if (qtyInput) {
        let current = parseInt(qtyInput.value, 10) || 1;
        if (action === 'plus') current = Math.min(20, current + 1);
        else if (action === 'minus') current = Math.max(1, current - 1);
        qtyInput.value = current;
      }
    } else if (target.matches('[data-pack-pill]')) {
      document.querySelectorAll('[data-pack-pill]').forEach((p) => p.classList.remove('active'));
      target.classList.add('active');
      const price = target.dataset.price;
      const stock = target.dataset.stock;
      const available = target.dataset.available === 'true';
      const variantId = target.dataset.variantId;
      const priceEl = document.querySelector('[data-product-price]');
      if (priceEl && price) priceEl.textContent = price;
      const stockEl = document.querySelector('[data-product-stock]');
      if (stockEl) {
        stockEl.textContent = stock;
        stockEl.className = `availability ${available ? 'in_stock' : 'out_of_stock'}`;
      }
      const addBtn = document.querySelector('[data-add-to-cart]');
      if (addBtn) {
        addBtn.dataset.addToCart = variantId;
        addBtn.disabled = !available;
      }
      const buyBtn = document.querySelector('[data-buy-now]');
      if (buyBtn) {
        buyBtn.dataset.buyNow = variantId;
        buyBtn.disabled = !available;
      }
    } else if (target.matches('[data-restock]')) {
      await api('/api/restock-subscriptions', { method: 'POST', body: JSON.stringify({ variantId: target.dataset.restock }) });
      toast('You will be notified when this option is available again.');
      target.disabled = true;
      target.textContent = 'Notification requested';
      if (previousButtonState) previousButtonState.preserve = true;
    } else if (target.matches('[data-delete-address]')) {
      const confirmed = await confirmAction({
        title: 'Delete Delivery Address',
        message: 'Are you sure you want to remove this delivery address from your account?',
        confirmText: 'Delete Address',
        cancelText: 'Cancel',
        isDanger: true,
      });
      if (!confirmed) return;
      await api(`/api/addresses/${encodeURIComponent(target.dataset.deleteAddress)}`, { method: 'DELETE' });
      toast('Address deleted.');
      await (location.pathname === '/account' ? renderAccount() : renderAddresses());
    } else if (target.matches('[data-remove-restock]')) {
      await api(`/api/restock-subscriptions/${encodeURIComponent(target.dataset.removeRestock)}`, { method: 'DELETE' });
      toast('Restock alert removed.');
      await (location.pathname === '/account' ? renderAccount() : renderNotifications());
    } else if (target.matches('[data-inventory-history]')) {
      const variantId = target.dataset.inventoryHistory;
      const data = await api(`/api/admin/inventory/${encodeURIComponent(variantId)}/movements`);
      const list = document.querySelector(`[data-movement-list="${CSS.escape(variantId)}"]`);
      if (list) {
        list.innerHTML = data.movements.length
          ? data.movements.map((item) => `<div>${new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · ${item.quantityChange > 0 ? '+' : ''}${item.quantityChange} · ${escapeHtml(item.reason)}</div>`).join('')
          : '<div>No movement records.</div>';
      }
      toast('Inventory history loaded.');
    } else if (target.matches('[data-remove-cart]') || target.closest('[data-remove-cart]')) {
      const removeBtn = target.matches('[data-remove-cart]') ? target : target.closest('[data-remove-cart]');
      const variantId = removeBtn.dataset.removeCart;
      const confirmed = await confirmAction({
        title: 'Remove Item',
        message: 'Are you sure you want to remove this item from your cart?',
        confirmText: 'Remove',
        cancelText: 'Cancel',
        isDanger: true,
      });
      if (!confirmed) return;
      const row = document.querySelector(`[data-cart-row="${CSS.escape(variantId)}"]`);
      if (row) {
        row.style.opacity = '0.3';
        row.style.pointerEvents = 'none';
      }
      try {
        await api(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
        toast('Item removed from your cart.');
        await renderCart();
        void refreshCartBadge();
      } catch (err) {
        toast(err.message || 'Could not remove item', true);
        if (row) {
          row.style.opacity = '1';
          row.style.pointerEvents = 'auto';
        }
      }
    } else if (target.matches('[data-logout]')) {
      await api('/api/auth/logout', { method: 'POST' });
      csrfToken = '';
      location.assign('/');
    } else if (target.matches('[data-read-notification]')) {
      await api(`/api/notifications/${encodeURIComponent(target.dataset.readNotification)}/read`, { method: 'PATCH' });
      await (location.pathname === '/account' ? renderAccount() : renderNotifications());
      toast('Notification marked as read.');
    } else if (target.matches('[data-read-all]')) {
      await api('/api/notifications/read-all', { method: 'PATCH' });
      await (location.pathname === '/account' ? renderAccount() : renderNotifications());
      toast('All notifications marked as read.');
    } else if (target.matches('[data-cancel-order]')) {
      const confirmed = await confirmAction({
        title: 'Cancel Order Request',
        message: 'Are you sure you want to cancel this order request? Stock will be restored to inventory.',
        confirmText: 'Cancel Order',
        cancelText: 'Keep Order',
        isDanger: true,
      });
      if (!confirmed) return;
      await api(`/api/orders/${encodeURIComponent(target.dataset.cancelOrder)}/cancel`, { method: 'POST', body: '{}' });
      toast('Order request cancelled.');
      if (location.pathname === '/account') await renderAccount();
      else await renderOrders(target.dataset.cancelOrder);
    } else if (target.matches('[data-delete-enquiry]')) {
      const confirmed = await confirmAction({
        title: 'Delete Customer Enquiry',
        message: 'Are you sure you want to permanently delete this customer enquiry message?',
        confirmText: 'Delete Enquiry',
        cancelText: 'Cancel',
        isDanger: true,
      });
      if (!confirmed) return;
      await api(`/api/admin/enquiries/${encodeURIComponent(target.dataset.deleteEnquiry)}`, { method: 'DELETE' });
      toast('Enquiry deleted.');
      await renderAdminContent();
    } else if (target.matches('[data-delete-product]')) {
      const prodName = target.dataset.productName || 'this product';
      const confirmed = await confirmAction({
        title: 'Delete Product',
        message: `Are you sure you want to permanently delete "${prodName}" and all its pack options?`,
        confirmText: 'Delete Product',
        cancelText: 'Cancel',
        isDanger: true,
      });
      if (!confirmed) return;
      await api(`/api/admin/products/${encodeURIComponent(target.dataset.deleteProduct)}`, { method: 'DELETE' });
      toast(`Product "${prodName}" deleted.`);
      await renderAdminContent();
    } else if (target.matches('[data-delete-variant]')) {
      const variantName = target.dataset.variantName || 'this option';
      const confirmed = await confirmAction({
        title: 'Delete Pack Option',
        message: `Are you sure you want to delete pack option "${variantName}"?`,
        confirmText: 'Delete Option',
        cancelText: 'Cancel',
        isDanger: true,
      });
      if (!confirmed) return;
      await api(`/api/admin/variants/${encodeURIComponent(target.dataset.deleteVariant)}`, { method: 'DELETE' });
      toast(`Pack option "${variantName}" deleted.`);
      await renderAdminContent();
    } else if (target.matches('[data-copy-text]')) {
      const text = target.dataset.copyText;
      if (text) {
        await navigator.clipboard.writeText(text);
        toast(`Copied: ${text}`);
      }
    } else if (target.matches('[data-quick-mark-paid]')) {
      const orderId = target.dataset.quickMarkPaid;
      const ref = target.dataset.ref || '';
      await api(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'paid', providerReference: ref }),
      });
      toast('Payment marked as verified paid.');
      await loadAdminOrders({ reset: true });
    } else if (target.matches('[data-admin-review-toggle]')) {
      const reviewId = target.dataset.adminReviewToggle;
      const isApproved = target.dataset.approved === 'true';
      await api(`/api/admin/reviews/${encodeURIComponent(reviewId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isApproved }),
      });
      toast(isApproved ? 'Review approved and published.' : 'Review hidden from public.');
      await renderAdminContent();
    } else if (target.matches('[data-admin-review-delete]')) {
      if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
      const reviewId = target.dataset.adminReviewDelete;
      await api(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' });
      toast('Review deleted.');
      await renderAdminContent();
    } else if (target.matches('[data-test-email]')) {
      const res = await api('/api/admin/test-email', { method: 'POST' });
      toast(res.message);
      await renderAdminContent();
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    restoreButtonProgress(target, previousButtonState);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('[data-nav-toggle][aria-expanded="true"]')) {
    setMobileNavigationOpen(false, true);
  }
});

document.addEventListener('change', async (event) => {
  const input = event.target.closest('[data-cart-quantity]');
  if (!input) return;
  try {
    await api(`/api/cart/items/${encodeURIComponent(input.dataset.cartQuantity)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: Number(input.value) }),
    });
    void refreshCartBadge();
    await renderCart();
  } catch (error) {
    toast(error.message, true);
    await renderCart();
  }
});

document.addEventListener('input', (event) => {
  const input = event.target;
  if (input.matches('[data-product-slug]')) {
    input.dataset.edited = 'true';
    return;
  }
  const productForm = input.closest('form[data-form="admin-product"]');
  if (!productForm || input.name !== 'name') return;
  const slugInput = productForm.querySelector('[data-product-slug]');
  if (!slugInput || slugInput.dataset.edited === 'true') return;
  slugInput.value = productSlug(input.value);
});

document.addEventListener('change', (event) => {
  const payRadio = event.target.closest('input[name="paymentMethod"]');
  if (payRadio) {
    const upiBox = document.querySelector('[data-upi-box]');
    if (upiBox) {
      upiBox.style.display = payRadio.value === 'manual_transfer' ? 'block' : 'none';
    }
  }
  const input = event.target.closest('[data-product-image]');
  if (!input) return;
  const preview = input.closest('form').querySelector('[data-image-preview]');
  if (!preview) return;
  if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
  const file = input.files?.[0];
  if (!file) {
    if (!preview.getAttribute('src')) preview.hidden = true;
    return;
  }
  preview.dataset.objectUrl = URL.createObjectURL(file);
  preview.src = preview.dataset.objectUrl;
  preview.hidden = false;
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  let validationError = '';
  if (form.dataset.form === 'admin-product') {
    const slugInput = form.querySelector('[data-product-slug]');
    const nameInput = form.elements.namedItem('name');
    if (slugInput && !slugInput.value.trim()) slugInput.value = productSlug(nameInput?.value ?? '');
    if (slugInput && !slugInput.value) validationError = 'Enter a valid product name or URL slug before creating the product.';
  }
  const formData = new FormData(form);
  const value = (name) => String(formData.get(name) ?? '').trim();
  const submitButton = form.querySelector('button[type="submit"],button:not([type])');
  const previousButtonState = showButtonProgress(submitButton);
  try {
    if (validationError) throw new Error(validationError);
    if (form.dataset.form === 'shop-search') {
      window.history.pushState({}, '', `/shop?q=${encodeURIComponent(value('q'))}`);
      startTopLoader();
      try {
        await renderPage();
        window.scrollTo({ top: 0, behavior: 'instant' });
      } finally {
        stopTopLoader();
      }
    } else if (form.dataset.form === 'register') {
      const result = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: value('fullName'), email: value('email'), password: value('password'),
          confirmPassword: value('confirmPassword'), acceptTerms: formData.has('acceptTerms'),
        }),
      });
      appRoot.innerHTML = `${pageHeader('Almost there', 'Check your email')}<section class="container content-shell"><div class="notice">${escapeHtml(result.message)}</div><p class="mt-3">${result.emailConfigured ? 'Use the link in your inbox to verify your account.' : 'The owner must configure SMTP before this account can be verified.'}</p><a href="/login">Go to sign in</a></section>`;
    } else if (form.dataset.form === 'login') {
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: value('email'), password: value('password') }) });
      csrfToken = result.csrfToken;
      location.assign(result.user.role === 'admin' ? '/admin' : '/account');
    } else if (form.dataset.form === 'forgot') {
      const email = value('email');
      const confirmed = await confirmAction({
        title: 'Reset Password',
        message: `Send password reset instructions to ${email}?`,
        confirmText: 'Send Reset Link',
        cancelText: 'Cancel',
      });
      if (!confirmed) return;
      const result = await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      toast(result.message);
    } else if (form.dataset.form === 'reset') {
      const result = await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: value('token'), password: value('password'), confirmPassword: value('confirmPassword') }) });
      appRoot.innerHTML = `${pageHeader('Account security', 'Password updated')}<section class="container content-shell"><div class="notice">${escapeHtml(result.message)}</div><div class="mt-3">${buttonLink('/login', 'Sign in')}</div></section>`;
    } else if (form.dataset.form === 'resend-verification') {
      const result = await api('/api/auth/verification/resend', { method: 'POST', body: JSON.stringify({ email: value('email') }) });
      toast(result.message);
    } else if (form.dataset.form === 'profile') {
      await api('/api/profile', { method: 'PATCH', body: JSON.stringify({ fullName: value('fullName') }) });
      toast('Profile updated.');
      if (location.pathname === '/account') await renderAccount();
      else await renderProfile();
      await updateAccountMenu(await getSignedInUser());
    } else if (form.dataset.form === 'admin-business-details') {
      const result = await api('/api/admin/business-details', {
        method: 'PUT',
        body: JSON.stringify({
          address: value('address'),
          phone: value('phone'),
          email: value('email'),
          whatsapp: value('whatsapp'),
          hours: value('hours'),
          latitude: value('latitude') === '' ? null : Number(value('latitude')),
          longitude: value('longitude') === '' ? null : Number(value('longitude')),
        }),
      });
      state.adminBusinessDetails = result.details;
      state.config = {
        ...state.config,
        supportAddress: result.details.address || null,
        supportPhone: result.details.phone || null,
        supportEmail: result.details.email || null,
        whatsapp: result.details.whatsapp || null,
        businessHours: result.details.hours || null,
        businessLatitude: result.details.latitude,
        businessLongitude: result.details.longitude,
      };
      updateSupportDetails();
      toast('Public business details saved.');
    } else if (form.dataset.form === 'email-preferences') {
      await api('/api/profile/email-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          orderUpdates: formData.has('orderUpdates'),
          enquiryAcknowledgements: formData.has('enquiryAcknowledgements'),
          backInStock: formData.has('backInStock'),
          promotions: formData.has('promotions'),
        }),
      });
      toast('Email preferences saved.');
    } else if (form.dataset.form === 'delete-account') {
      const confirmed = await confirmAction({
        title: 'Delete Account',
        message: 'Are you sure you want to permanently delete your account and all associated personal data? Completed orders will be anonymized. This action is irreversible.',
        confirmText: 'Permanently Delete',
        cancelText: 'Keep Account',
        isDanger: true,
      });
      if (!confirmed) return;
      const result = await api('/api/account', {
        method: 'DELETE',
        body: JSON.stringify({
          ...(formData.has('currentPassword') ? { currentPassword: value('currentPassword') } : {}),
          confirm: value('confirm'),
        }),
      });
      csrfToken = '';
      appRoot.innerHTML = `${pageHeader('Account removed', 'Your account has been deleted')}<section class="container content-shell"><div class="notice">${escapeHtml(result.message)}</div>${buttonLink('/', 'Return home')}</section>`;
      await updateAccountMenu(null);
    } else if (form.dataset.form === 'address') {
      await api('/api/addresses', { method: 'POST', body: JSON.stringify({
        label: value('label') || 'Home', recipientName: value('recipientName'), phone: value('phone'),
        line1: value('line1'), line2: value('line2'), city: value('city'), state: value('state'),
        postalCode: value('postalCode'), isDefault: formData.has('isDefault'),
      }) });
      toast('Address saved.');
      if (location.pathname === '/account') await renderAccount();
      else await renderAddresses();
    } else if (form.dataset.form === 'address-edit') {
      await api(`/api/addresses/${encodeURIComponent(form.dataset.addressId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: value('label'), recipientName: value('recipientName'), phone: value('phone'),
          line1: value('line1'), line2: value('line2'), city: value('city'), state: value('state'),
          postalCode: value('postalCode'), isDefault: formData.has('isDefault'),
        }),
      });
      toast('Address updated.');
      if (location.pathname === '/account') await renderAccount();
      else await renderAddresses();
    } else if (form.dataset.form === 'contact') {
      const result = await api('/api/contact', { method: 'POST', body: JSON.stringify({
        name: value('name'), email: value('email'), subject: value('subject'), message: value('message'),
      }) });
      form.reset();
      toast(result.message);
    } else if (form.dataset.form === 'checkout') {
      if (state.analyticsStarted) window.gtag('event', 'begin_checkout', { currency: 'INR' });
      const customerNote = value('customerNote') || '';

      const result = await api('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ addressId: value('addressId'), paymentMethod: 'cash_on_handover', customerNote }),
      });
      if (state.analyticsStarted && !sessionStorage.getItem(`brmc-order-request-${result.order.id}`)) {
        window.gtag('event', 'order_request_created', {
          value: Number(result.order.totalPaise) / 100,
          currency: 'INR',
        });
        sessionStorage.setItem(`brmc-order-request-${result.order.id}`, 'sent');
      }
      // Instant live update: clear cart badge count
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = '0';
      });
      void refreshCartBadge();

      appRoot.innerHTML = `${pageHeader('Order Confirmed', 'Thank you for your order!')}
        <section class="container content-shell">
          <div class="notice mb-4">
            Your Cash on Delivery order <strong>${escapeHtml(result.order.orderNumber)}</strong> has been booked successfully! Our Hyderabad milling team is packing your fresh unpolished millets. Pay with Cash or UPI scan when delivered to your doorstep.
          </div>
          <div class="p-3 bg-light rounded-3 border mb-4">
            <div class="d-flex justify-content-between mb-2"><span>Order Number:</span><strong>${escapeHtml(result.order.orderNumber)}</strong></div>
            <div class="d-flex justify-content-between mb-2"><span>Order Status:</span><span class="badge bg-success">Confirmed &amp; Stock Reserved</span></div>
            <div class="d-flex justify-content-between mb-2"><span>Payment:</span><strong>💵 Cash on Delivery</strong></div>
            <div class="d-flex justify-content-between"><span>Total:</span><strong>${money(result.order.totalPaise)}</strong></div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            ${buttonLink(`/orders/${encodeURIComponent(result.order.id)}`, 'View order details')}
            ${buttonLink('/shop', 'Continue shopping', 'btn-outline-brand')}
          </div>
        </section>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (form.dataset.form === 'admin-product') {
      const active = formData.has('active');
      const imageUrl = await uploadAdminImage(form);
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: value('name'), slug: value('slug'), description: value('description'), category: value('category'),
          active,
          ingredients: value('ingredients'),
          storageInstructions: value('storageInstructions'),
          images: imageUrl ? [{ url: imageUrl, altText: value('name') }] : [],
          variants: [{
            sku: value('sku') || `${productSlug(value('name'))}-${(value('packSize') || 'pack').toLowerCase().replace(/[^a-z0-9]/g, '') || Date.now().toString(36)}`, packSize: value('packSize'),
            priceRupees: Number(value('priceRupees') || value('price') || 0),
            stockQuantity: Number(value('stockQuantity') || value('stock') || 0),
            lowStockThreshold: 5, active,
          }],
        }),
      });
      toast('Product created.');
      await renderAdminContent();
    } else if (form.dataset.form === 'admin-order-status') {
      if (!value('status')) throw new Error('Choose a status first.');
      await api(`/api/admin/orders/${encodeURIComponent(form.dataset.orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value('status') }),
      });
      toast('Order status updated.');
      await loadAdminOrders({ reset: true });
    } else if (form.dataset.form === 'admin-product-edit') {
      const imageUrl = await uploadAdminImage(form);
      await api(`/api/admin/products/${encodeURIComponent(form.dataset.productId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: value('name'), category: value('category'), description: value('description'),
          ingredients: value('ingredients'), storageInstructions: value('storageInstructions'),
          active: formData.has('active'),
          ...(imageUrl ? { images: [{ url: imageUrl, altText: value('name') }] } : {}),
        }),
      });
      toast('Product details updated.');
      await renderAdminContent();
    } else if (form.dataset.form === 'admin-variant') {
      await api(`/api/admin/variants/${encodeURIComponent(form.dataset.variantId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sku: value('sku'), packSize: value('packSize'), priceRupees: Number(value('priceRupees')),
          stockQuantity: Number(value('stockQuantity')), lowStockThreshold: Number(value('lowStockThreshold')),
          active: formData.has('active'),
        }),
      });
      toast('Product option updated.');
      await renderAdminContent();
    } else if (form.dataset.form === 'admin-add-variant') {
      await api(`/api/admin/products/${encodeURIComponent(form.dataset.productId)}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          sku: value('sku'), packSize: value('packSize'), priceRupees: Number(value('priceRupees')),
          stockQuantity: Number(value('stockQuantity')), lowStockThreshold: Number(value('lowStockThreshold')),
          active: formData.has('active'),
        }),
      });
      toast('Product option added.');
      await renderAdminContent();
    } else if (form.dataset.form === 'admin-payment') {
      if (!value('status')) throw new Error('Choose a payment status first.');
      await api(`/api/admin/orders/${encodeURIComponent(form.dataset.orderId)}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value('status'), providerReference: value('providerReference') }),
      });
      toast('Payment status recorded.');
      await loadAdminOrders({ reset: true });
    } else if (form.dataset.form === 'admin-enquiry') {
      await api(`/api/admin/enquiries/${encodeURIComponent(form.dataset.enquiryId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value('status') }),
      });
      toast('Enquiry updated.');
      await renderAdminContent();
    } else if (form.dataset.form === 'submit-review') {
      const slug = form.dataset.productSlug || form.dataset.slug;
      if (!slug) throw new Error('Product identifier missing.');
      const rating = Number(value('rating'));
      const title = value('title');
      const comment = value('comment');
      await api(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, title, comment }),
      });
      toast('Thank you! Your feedback has been published.');
      form.reset();
      await renderProduct(slug);
    } else if (form.dataset.form === 'submit-payment-reference') {
      const orderId = form.dataset.orderId;
      const reference = value('reference');
      await api(`/api/orders/${encodeURIComponent(orderId)}/payment-reference`, {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      toast('Payment reference submitted! Our team will verify and confirm.');
      await renderOrders(orderId);
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    restoreButtonProgress(submitButton, previousButtonState);
  }
});

async function boot() {
  const sidebar = document.querySelector('.site-layout');
  const siteSidebar = document.querySelector('.site-sidebar');
  const siteHeader = document.querySelector('.site-header');
  const syncMobileNavigation = () => {
    const mobile = window.matchMedia('(max-width: 991.98px)').matches;
    if (!mobile) {
      setMobileNavigationOpen(false);
      return;
    }
    const open = mobile && siteSidebar?.classList.contains('is-open');
    siteSidebar?.setAttribute('aria-hidden', String(mobile && !open));
    const backdrop = document.querySelector('.site-nav-backdrop');
    if (backdrop) backdrop.hidden = !open;
    const toggle = document.querySelector('[data-nav-toggle]');
    toggle?.setAttribute('aria-expanded', String(Boolean(open)));
    toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const syncSidebarOffset = () => {
    if (!siteSidebar || !siteHeader) return;
    if (window.matchMedia('(min-width: 992px)').matches) {
      siteSidebar.style.setProperty('--site-sidebar-top', `${Math.max(0, siteHeader.getBoundingClientRect().bottom)}px`);
    } else {
      siteSidebar.style.removeProperty('--site-sidebar-top');
    }
  };
  syncMobileNavigation();
  syncSidebarOffset();
  window.addEventListener('scroll', syncSidebarOffset, { passive: true });
  window.addEventListener('resize', () => {
    syncSidebarOffset();
    syncMobileNavigation();
  });
  window.addEventListener('scroll', syncPageScrollControl, { passive: true });
  window.addEventListener('resize', syncPageScrollControl);
  const pageContent = document.querySelector('.site-content');
  if (pageContent) {
    new MutationObserver(syncPageScrollControl).observe(pageContent, { childList: true, subtree: true });
  }
  syncPageScrollControl();
  try {
    if (localStorage.getItem('brmc-sidebar-collapsed') === 'true') {
      sidebar?.classList.add('sidebar-collapsed');
      const collapseButton = document.querySelector('[data-sidebar-collapse]');
      collapseButton?.setAttribute('aria-expanded', 'false');
      collapseButton?.setAttribute('aria-label', 'Expand sidebar');
      collapseButton?.setAttribute('title', 'Expand sidebar');
    }
  } catch (error) {
    console.warn('Sidebar preference could not be loaded.', error);
  }
  try {
    await updateAccountMenu();
  } catch (error) {
    console.error('Signed-in account state could not be loaded.', error);
    appRoot.innerHTML = `${pageHeader('Account unavailable', 'Could not load your sign-in state')}<section class="container content-shell"><div class="notice">${escapeHtml(error.message)}</div><button class="btn btn-outline-brand mt-3" data-reload>Try again</button></section>`;
    return;
  }
  await renderPage();
  initNetworkWatcher();
  initScrollAnimations();
  startAdminOrderStream();
  const route = location.pathname;
  if (/^\/(shop|product|cart|checkout)(\/|$)/.test(route)) {
    const inventoryStream = new EventSource('/api/inventory/events');
    inventoryStream.addEventListener('inventory', (event) => {
      const result = JSON.parse(event.data);
      if (result.changed) {
        inventoryStream.close();
        void renderPage();
        window.setTimeout(startInventoryStream, 0);
      }
    });
    inventoryStream.addEventListener('error', () => inventoryStream.close(), { once: true });
    state.inventoryStream = inventoryStream;
  }
  if (localStorage.getItem('brmc-analytics-consent') === 'yes') startAnalytics();
  else showAnalyticsPrompt();
}

function startAdminOrderStream() {
  if (state.user?.role !== 'admin' || !location.pathname.startsWith('/admin') || state.adminEventSource) return;
  try {
    const stream = new EventSource('/api/admin/events');
    stream.addEventListener('admin_order', (event) => {
      try {
        const notification = JSON.parse(event.data);
        toast(`${notification.title}: ${notification.body}`, false, '/admin/orders');
        void renderPage();
      } catch {}
    });
    stream.addEventListener('error', () => {
      stream.close();
      state.adminEventSource = null;
      if (location.pathname.startsWith('/admin')) {
        window.setTimeout(startAdminOrderStream, 15000);
      }
    }, { once: true });
    state.adminEventSource = stream;
  } catch {}
}

function startInventoryStream() {
  const route = location.pathname;
  if (!/^\/(shop|product|cart|checkout)(\/|$)/.test(route)) return;
  const inventoryStream = new EventSource('/api/inventory/events');
  inventoryStream.addEventListener('inventory', (event) => {
    if (JSON.parse(event.data).changed) {
      inventoryStream.close();
      void renderPage();
      window.setTimeout(startInventoryStream, 0);
    }
  });
  inventoryStream.addEventListener('error', () => inventoryStream.close(), { once: true });
  state.inventoryStream = inventoryStream;
}

function initNetworkWatcher() {
  window.addEventListener('offline', () => {
    toast('⚠️ No internet connection. You are currently offline.', true);
  });
  window.addEventListener('online', () => {
    toast('🟢 Internet connection restored.', false);
  });
}

function initScrollAnimations() {
  if (typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
      } else {
        if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('is-revealed');
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.12,
  });

  function observeElements() {
    document.querySelectorAll('.scroll-reveal-item:not([data-observed])').forEach((el) => {
      el.dataset.observed = 'true';
      observer.observe(el);
    });
  }

  observeElements();
  new MutationObserver(observeElements).observe(document.body, { childList: true, subtree: true });
}

boot();
