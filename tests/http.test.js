import test, { after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@127.0.0.1:65432/brmc_test';
process.env.BASE_URL = 'http://localhost:3000';

const { default: app } = await import('../server/app.js');
const { emailIsAllowed } = await import('../server/email.js');
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

test('email preferences suppress optional notifications but keep security email enabled', async () => {
  const preferences = {
    orderUpdates: false,
    enquiryAcknowledgements: true,
    backInStock: false,
    promotions: false,
  };
  const client = {
    async query() {
      return { rows: [{ email_preferences: preferences }] };
    },
  };
  assert.equal(await emailIsAllowed(client, 'customer-id', 'order_update'), false);
  assert.equal(await emailIsAllowed(client, 'customer-id', 'enquiry_received'), true);
  assert.equal(await emailIsAllowed(client, 'customer-id', 'back_in_stock'), false);
  assert.equal(await emailIsAllowed(client, 'customer-id', 'verify'), true);
  assert.equal(await emailIsAllowed(client, null, 'order_received'), true);
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test('public pages receive distinct SEO metadata and structured data', async () => {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.match(homeHtml, /<title>BR Millet Choice \| Millet powder<\/title>/);
  assert.match(homeHtml, /application\/ld\+json/);

  const shop = await fetch(`${baseUrl}/shop`);
  const shopHtml = await shop.text();
  assert.match(shopHtml, /<title>Shop \| BR Millet Choice<\/title>/);
  assert.match(shopHtml, /name="robots" content="index,follow"/);
});

test('private account, order, and admin pages are marked noindex', async () => {
  for (const route of ['/account', '/checkout', '/orders/123', '/admin/products', '/admin/manage-products', '/admin/orders', '/admin/enquiries', '/admin/customers']) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /name="robots" content="noindex,nofollow"/);
  }
});

test('customer and admin APIs reject unauthenticated access', async () => {
  for (const route of ['/api/addresses', '/api/orders', '/api/notifications', '/api/admin/orders', '/api/admin/customers', '/api/admin/events', '/api/admin/business-details']) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 401, route);
  }
});

test('mutating API calls require a CSRF token', async () => {
  for (const route of ['/api/auth/logout', '/api/admin/product-images']) {
    const response = await fetch(`${baseUrl}${route}`, { method: 'POST' });
    assert.equal(response.status, 403, route);
  }
  const enquiryDelete = await fetch(`${baseUrl}/api/admin/enquiries/00000000-0000-4000-8000-000000000001`, { method: 'DELETE' });
  assert.equal(enquiryDelete.status, 403);
  const businessDetails = await fetch(`${baseUrl}/api/admin/business-details`, { method: 'PUT' });
  assert.equal(businessDetails.status, 403);
});

test('robots rules exclude account data and identify the sitemap', async () => {
  const response = await fetch(`${baseUrl}/robots.txt`);
  const text = await response.text();
  assert.match(text, /Disallow: \/checkout/);
  assert.match(text, /Disallow: \/admin/);
  assert.match(text, /Sitemap: http:\/\/localhost:3000\/sitemap\.xml/);
});

test('unknown browser routes render the custom not-found page', async () => {
  const response = await fetch(`${baseUrl}/this-page-does-not-exist`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /That page isn’t here/);
});
