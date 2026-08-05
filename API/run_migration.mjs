import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../Configs/.env') });

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run_migration.mjs <path-to-sql-file>');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const sql = fs.readFileSync(migrationFile, 'utf8');

try {
  await client.connect();
  console.log('Connected. Running migration:', migrationFile);
  await client.query(sql);
  console.log('Migration applied successfully.');
} catch (err) {
  console.error('MIGRATION ERROR:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
