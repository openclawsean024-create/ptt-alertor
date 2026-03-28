/**
 * PTT Alertor — Database Setup Script
 * 
 * Usage:
 *   npx tsx scripts/setup-db.ts
 * 
 * Requires DATABASE_URL or POSTGRES_URL in .env.local
 */

import { readFileSync } from 'fs';
import { Client } from 'pg';
import { config } from 'dotenv';

config(); // load .env.local

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!url) {
    console.error('❌  Missing DATABASE_URL or POSTGRES_URL in .env.local');
    console.error('    Set one of these to your Postgres connection string.');
    process.exit(1);
  }

  console.log('🔌  Connecting to database...');
  const client = new Client({ connectionString: url });

  try {
    await client.connect();
    console.log('📦  Applying schema (this may take a moment)...');
    const schema = readFileSync('./prisma/schema.sql', 'utf-8');
    await client.query(schema);
    console.log('✅  Done! Schema applied successfully.');
  } catch (err) {
    console.error('❌  Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
