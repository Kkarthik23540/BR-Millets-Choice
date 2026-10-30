import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();

if (!email || !password || !fullName || password.length < 12 || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72) {
  console.error('Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, and a 12+ character BOOTSTRAP_ADMIN_PASSWORD of at most 72 UTF-8 bytes for this one-time command.');
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, email_verified_at)
       VALUES ($1, $2, $3, 'admin', NOW())
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name = EXCLUDED.full_name,
             role = 'admin',
             email_verified_at = COALESCE(users.email_verified_at, NOW()),
             updated_at = NOW()
       RETURNING id, email`,
      [email, passwordHash, fullName],
    );
    console.log(`Admin account ready for ${result.rows[0].email}. Remove the bootstrap environment variables now.`);
  } catch (error) {
    console.error('Admin bootstrap failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
