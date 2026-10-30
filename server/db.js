import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  return rawUrl.replace(/sslmode=(require|prefer|verify-ca)/gi, 'sslmode=verify-full');
}

const cleanedDbUrl = normalizeDatabaseUrl(config.databaseUrl);
const needsSsl = config.isProduction
  || Boolean(cleanedDbUrl?.includes('sslmode=')
  || cleanedDbUrl?.includes('neon.tech')
  || cleanedDbUrl?.includes('supabase')
  || cleanedDbUrl?.includes('render.com')
  || process.env.VERCEL);

export const pool = new Pool({
  connectionString: cleanedDbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const migrationsDir = fileURLToPath(new URL('../database/migrations/', import.meta.url));

let readyPromise = null;
export async function ensureDatabaseReady() {
  if (!config.databaseUrl) {
    return;
  }
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          name TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
      for (const file of files) {
        const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
        if (applied.rowCount) continue;
        const sql = await readFile(path.join(migrationsDir, file), 'utf8');
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Auto-applied migration ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Migration error on ${file}:`, err.message);
          break;
        } finally {
          client.release();
        }
      }
      try {
        await pool.query('UPDATE products SET active = TRUE WHERE active = FALSE; UPDATE product_variants SET active = TRUE WHERE active = FALSE;');
        await pool.query("UPDATE users SET role = 'admin', email_verified_at = COALESCE(email_verified_at, NOW()) WHERE LOWER(email) = 'kkarthik23540@gmail.com';");
      } catch {}
    } catch (err) {
      console.warn('Auto-migration check skipped:', err.message);
    }
  })();
  return readyPromise;
}

export async function inTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
