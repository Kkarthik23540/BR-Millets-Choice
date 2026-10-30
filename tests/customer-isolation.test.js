import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const databaseUrl = process.env.BRMC_TEST_DATABASE_URL;

if (!databaseUrl) {
  test('Customer A cannot access Customer B data (PostgreSQL integration)', { skip: 'Set BRMC_TEST_DATABASE_URL to a dedicated migrated test database.' }, () => {});
} else {
  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  if (!/test/i.test(databaseName)) {
    throw new Error('BRMC_TEST_DATABASE_URL must point to a database with "test" in its name.');
  }
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  const [{ default: app }, { pool }] = await Promise.all([
    import('../server/app.js'),
    import('../server/db.js'),
  ]);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let seeded;

  after(async () => {
    if (seeded) {
      await pool.query('DELETE FROM orders WHERE user_id = ANY($1::uuid[])', [[seeded.userA, seeded.userB]]);
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[seeded.userA, seeded.userB]]);
    }
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  });

  test('Customer A cannot read, cancel or delete Customer B private records', async () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const addressId = crypto.randomUUID();
    const notificationId = crypto.randomUUID();
    const emailA = `customer-a-${userA}@example.test`;
    const emailB = `customer-b-${userB}@example.test`;
    const password = `test-${crypto.randomBytes(24).toString('base64url')}`;
    const passwordHash = await bcrypt.hash(password, 4);
    seeded = { userA, userB };

    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, email_verified_at)
       VALUES ($1, $2, $3, 'Customer A', NOW()), ($4, $5, $3, 'Customer B', NOW())`,
      [userA, emailA, passwordHash, userB, emailB],
    );
    await pool.query(
      `INSERT INTO addresses (id, user_id, recipient_name, phone, line1, city, state, postal_code)
       VALUES ($1, $2, 'Customer B', '0000000000', 'Private address', 'Test city', 'Test state', '000000')`,
      [addressId, userB],
    );
    await pool.query(
      `INSERT INTO orders (id, order_number, user_id, address_snapshot, status, payment_method,
         subtotal_paise, total_paise, idempotency_key)
       VALUES ($1, $2, $3, '{"recipient_name":"Customer B"}', 'awaiting_confirmation',
         'cash_on_handover', 100, 100, $4)`,
      [orderId, `BR-TEST-${userB.slice(0, 8)}`, userB, crypto.randomUUID()],
    );
    await pool.query(
      `INSERT INTO notifications (id, user_id, kind, title, body)
       VALUES ($1, $2, 'order', 'Private', 'Customer B notification')`,
      [notificationId, userB],
    );

    const csrfResponse = await fetch(`${baseUrl}/api/csrf`);
    const initialCookie = csrfResponse.headers.get('set-cookie')?.split(';')[0];
    assert.ok(initialCookie);
    const csrf = (await csrfResponse.json()).csrfToken;
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { Cookie: initialCookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ email: emailA, password }),
    });
    assert.equal(login.status, 200);
    const sessionCookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(sessionCookie);
    const loginData = await login.json();
    const headers = { Cookie: sessionCookie, 'X-CSRF-Token': loginData.csrfToken };

    const orderRead = await fetch(`${baseUrl}/api/orders/${orderId}`, { headers });
    assert.equal(orderRead.status, 404);
    const cancelOrder = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(cancelOrder.status, 404);
    const deleteAddress = await fetch(`${baseUrl}/api/addresses/${addressId}`, { method: 'DELETE', headers });
    assert.equal(deleteAddress.status, 404);
    const readNotification = await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
      method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(readNotification.status, 404);

    const privateLists = await Promise.all([
      fetch(`${baseUrl}/api/orders`, { headers }).then((response) => response.json()),
      fetch(`${baseUrl}/api/addresses`, { headers }).then((response) => response.json()),
      fetch(`${baseUrl}/api/notifications`, { headers }).then((response) => response.json()),
    ]);
    assert.equal(privateLists[0].orders.length, 0);
    assert.equal(privateLists[1].addresses.length, 0);
    assert.equal(privateLists[2].notifications.length, 0);
  });
}
