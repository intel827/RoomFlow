import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'roomflow.db');

const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Run migrations for existing databases
function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[])
      .map(r => r.name)
  );

  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_add_hiworks_columns',
      sql: `
        ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local' CHECK(auth_provider IN ('local', 'hiworks'));
        ALTER TABLE users ADD COLUMN hiworks_user_no TEXT UNIQUE;
        ALTER TABLE users ADD COLUMN email TEXT;
      `
    }
  ];

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      try {
        db.exec(m.sql);
      } catch (err: any) {
        // Skip if columns already exist (e.g., fresh DB created with updated schema)
        if (!err.message?.includes('duplicate column name')) {
          throw err;
        }
      }
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(m.name);
    }
  }
}

runMigrations();

export default db;
