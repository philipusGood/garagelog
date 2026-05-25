#!/usr/bin/env node
/**
 * reset-auth.mjs — set or reset GarageLog login credentials
 *
 * Run inside the container:
 *   docker exec -it garagelog node /app/reset-auth.mjs <username> <password>
 *
 * Or directly on the host (if you have Node + the data dir):
 *   DATA_DIR=/mnt/user/appdata/garagelog node reset-auth.mjs <username> <password>
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("Usage: node reset-auth.mjs <username> <password>");
  process.exit(1);
}

const DATA_DIR = process.env.DATA_DIR ?? "/data";
const DB_PATH = path.join(DATA_DIR, "garagelog.db");

let db;
try {
  db = new Database(DB_PATH);
} catch (err) {
  console.error(`Could not open database at ${DB_PATH}:`, err.message);
  console.error("Make sure the container is running or DATA_DIR points to the right place.");
  process.exit(1);
}

// Ensure the users table exists (safe on an already-initialised DB)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const hash = await bcrypt.hash(password, 12);

db.prepare(`
  INSERT INTO users (username, password_hash)
  VALUES (?, ?)
  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash
`).run(username, hash);

console.log(`✓ Credentials updated for user "${username}".`);
db.close();
