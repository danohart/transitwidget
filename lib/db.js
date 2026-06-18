import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
export default sql;

/**
 * Create all tables if they don't exist.
 * Run this in the seed script before loading data.
 * Vercel functions assume the schema already exists.
 */
export async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS venues (
      site_key   TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      address    TEXT NOT NULL,
      lat        REAL,
      lon        REAL,
      created_at BIGINT NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS stop_cache (
      site_key  TEXT PRIMARY KEY,
      data      TEXT NOT NULL,
      cached_at BIGINT NOT NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS bus_stops (
      stop_id TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      lat     REAL NOT NULL,
      lon     REAL NOT NULL,
      routes  TEXT NOT NULL DEFAULT '[]'
    )`;
}
