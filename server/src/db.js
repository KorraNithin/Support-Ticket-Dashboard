import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/** Opens (and migrates) a SQLite database. Pass ':memory:' for tests. */
export function openDb(file = process.env.DATABASE_PATH || './data/tickets.db') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL CHECK (length(title) <= 120),
      description    TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      priority       TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
      status         TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved')),
      created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_tickets_created ON tickets(created_at);
  `);
  return db;
}
