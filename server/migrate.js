import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pool } from './db.js';

const migrationsDir = fileURLToPath(new URL('../database/migrations/', import.meta.url));

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
      console.log(`Applied migration ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} catch (error) {
  console.error('Database migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
