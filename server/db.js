const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jobs.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied',
    applied_at TEXT,
    notes TEXT,
    link TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Migration: add user_id to applications if missing (old DBs)
try {
  db.prepare('SELECT user_id FROM applications LIMIT 1').get();
} catch {
  db.exec('ALTER TABLE applications ADD COLUMN user_id INTEGER');
  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('changeme', 10);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (1, ?, ?)').run('migrated@local', hash);
  }
  db.prepare('UPDATE applications SET user_id = 1 WHERE user_id IS NULL').run();
}

module.exports = db;
