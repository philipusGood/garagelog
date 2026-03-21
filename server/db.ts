import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "garagelog.db");
export const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS cars (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    year       INTEGER,
    model      TEXT,
    vin        TEXT,
    color      TEXT,
    notes      TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id       INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    date         TEXT    NOT NULL,
    mileage      INTEGER NOT NULL,
    shop         TEXT,
    description  TEXT    NOT NULL,
    cost         REAL,
    notes        TEXT,
    attachment   TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS record_tags (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    tag       TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_records_car ON service_records(car_id);
  CREATE INDEX IF NOT EXISTS idx_tags_record ON record_tags(record_id);
  CREATE INDEX IF NOT EXISTS idx_tags_tag    ON record_tags(tag);
`);
