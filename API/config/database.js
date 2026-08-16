import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../Configs/.env') });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Runs `fn` inside a single transaction, rolling back on any throw.
 *
 * Needed wherever a create writes a parent row and then its children in
 * separate statements (quotation + items, inspection + findings, monthly
 * invoice + job lines). Without this, a failing child insert leaves the
 * parent committed: a rejected double-billing attempt was observed leaving
 * an orphaned empty monthly invoice behind, because the UNIQUE violation on
 * monthly_invoice_jobs.job_id fired after the header row had already landed.
 *
 * `fn` receives the dedicated client — every query inside MUST use it
 * rather than the pool, or that query runs outside the transaction.
 */
const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

export default pool;
export { Pool, withTransaction };
