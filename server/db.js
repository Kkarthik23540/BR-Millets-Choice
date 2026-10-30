import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

const needsSsl = config.isProduction
  || Boolean(config.databaseUrl?.includes('sslmode=')
  || config.databaseUrl?.includes('neon.tech')
  || config.databaseUrl?.includes('supabase')
  || config.databaseUrl?.includes('render.com')
  || process.env.VERCEL);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

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
