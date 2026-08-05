import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';

const { Pool } = pkg;

let supabaseClient = null;
let pgPool = null;

/**
 * Initialize Supabase client (recommended)
 */
export const initSupabase = () => {
  const projectUrl = process.env.SUPABASE_PROJECT_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!projectUrl || !anonKey) {
    console.warn('⚠️  Supabase credentials not configured. Using PostgreSQL fallback.');
    return null;
  }

  supabaseClient = createClient(projectUrl, anonKey);
  console.log('✅ Supabase initialized');
  return supabaseClient;
};

/**
 * Initialize PostgreSQL connection pool (fallback)
 */
export const initPostgres = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL not configured');
    return null;
  }

  pgPool = new Pool({
    connectionString: databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pgPool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
  });

  console.log('✅ PostgreSQL pool initialized');
  return pgPool;
};

/**
 * Get Supabase client
 */
export const getSupabase = () => {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
};

/**
 * Get PostgreSQL pool
 */
export const getPool = () => {
  if (!pgPool) {
    return initPostgres();
  }
  return pgPool;
};

/**
 * Execute query using PostgreSQL
 */
export const query = async (text, params = []) => {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database not initialized');
  }

  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Close database connections
 */
export const closeConnections = async () => {
  if (pgPool) {
    await pgPool.end();
    console.log('✅ PostgreSQL pool closed');
  }
};

// Export utilities
export default {
  initSupabase,
  initPostgres,
  getSupabase,
  getPool,
  query,
  closeConnections,
};
