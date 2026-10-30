import { z } from 'zod';
import { pool } from './db.js';

const emailResult = z.string().trim().email().max(254).safeParse(process.env.ADMIN_PROMOTE_EMAIL ?? '');

if (!emailResult.success) {
  console.error('Set ADMIN_PROMOTE_EMAIL to the existing owner account email for this one-time command.');
  process.exitCode = 1;
} else {
  try {
    const result = await pool.query(
      `UPDATE users SET role = 'admin', updated_at = NOW()
       WHERE email = $1
       RETURNING email`,
      [emailResult.data.toLowerCase()],
    );
    if (!result.rowCount) {
      console.error('No existing account matches ADMIN_PROMOTE_EMAIL. Sign up and verify that account first.');
      process.exitCode = 1;
    } else {
      console.log(`Admin access enabled for ${result.rows[0].email}. The existing password was not changed.`);
    }
  } catch (error) {
    console.error('Admin promotion failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
