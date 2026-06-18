import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../transitwidget.db');

let db;

export function getDb() {
  if (!db) db = new Database(DB_PATH);
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS venues (
      site_key TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      address  TEXT NOT NULL,
      lat      REAL,
      lon      REAL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stop_cache (
      site_key  TEXT PRIMARY KEY,
      data      TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bus_stops (
      stop_id TEXT PRIMARY KEY,
      name    TEXT NOT NULL,
      lat     REAL NOT NULL,
      lon     REAL NOT NULL,
      routes  TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS bus_cache_meta (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      loaded_at  INTEGER NOT NULL
    );
  `);

  console.log('Database initialized at', DB_PATH);
}
