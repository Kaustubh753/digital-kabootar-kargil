/**
 * Database layer built on Node's built-in `node:sqlite` (Node 22+). No native
 * compilation, no external service — the whole app runs from a single file DB,
 * which keeps the core submission flow free of third-party dependencies
 * (PRD §6 resilience).
 *
 * Server-only. Never import from a client component.
 *
 * The data-access helpers in `letters.ts` / `martyrs.ts` take a `db` handle as
 * their first argument so they can be unit-tested against an in-memory DB.
 */

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type * as NodeSqlite from "node:sqlite";
import { config } from "./config";

// `node:sqlite` is an experimental built-in. Loading it via createRequire (a
// runtime require rather than a static import) keeps bundlers — Vite/Vitest and
// Next.js — from trying to resolve it at build time, while still using the real
// Node module. Types come from the erased `import type` above.
const { DatabaseSync } = createRequire(import.meta.url)(
  "node:sqlite",
) as typeof NodeSqlite;

export type DB = NodeSqlite.DatabaseSync;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS martyrs (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  rank              TEXT,
  regiment          TEXT,
  native_state      TEXT,
  age_at_martyrdom  INTEGER,
  date_of_martyrdom TEXT,
  gallantry_award   TEXT,
  citation          TEXT,
  photo             TEXT,
  is_placeholder    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS letters (
  id                    TEXT PRIMARY KEY,
  writer_name           TEXT NOT NULL,
  organization_name     TEXT NOT NULL,
  age                   INTEGER,
  email                 TEXT,
  message               TEXT NOT NULL,
  martyr_id             TEXT NOT NULL REFERENCES martyrs(id),
  writer_state          TEXT,
  moderation_status     TEXT NOT NULL DEFAULT 'pending'
                          CHECK (moderation_status IN ('pending','approved','rejected')),
  moderation_categories TEXT,
  moderated_by          TEXT,
  moderated_at          TEXT,
  created_at            TEXT NOT NULL,
  ip_hash               TEXT,
  -- Veer Vandan consent (source doc §2.2 / §2.4). consent_given is mandatory to
  -- submit; guardian_consent is NULL unless the participant is under 18.
  consent_given         INTEGER NOT NULL DEFAULT 0,
  guardian_consent      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_letters_status_created
  ON letters (moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_letters_martyr_status
  ON letters (martyr_id, moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_letters_created
  ON letters (created_at);
`;

/** Open a database at `path` and ensure the schema exists. */
export function openDb(path: string): DB {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/**
 * Idempotent, additive migrations for databases created before a column
 * existed. `CREATE TABLE IF NOT EXISTS` won't add columns to an existing table,
 * so we add any missing ones here.
 */
function migrate(db: DB): void {
  const cols = new Set(
    (db.prepare("PRAGMA table_info(letters)").all() as { name: string }[]).map(
      (c) => c.name,
    ),
  );
  if (!cols.has("consent_given")) {
    db.exec(
      "ALTER TABLE letters ADD COLUMN consent_given INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!cols.has("guardian_consent")) {
    db.exec("ALTER TABLE letters ADD COLUMN guardian_consent INTEGER");
  }
}

/**
 * Run `fn` inside a transaction. `node:sqlite` has no `.transaction()` helper,
 * so we manage BEGIN/COMMIT/ROLLBACK explicitly.
 */
export function withTransaction<T>(db: DB, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

let singleton: DB | null = null;

/**
 * Process-wide database handle for route handlers. Lazily opens the file DB,
 * applies migrations, and seeds placeholder martyr data on first use.
 */
export function getDb(): DB {
  if (singleton) return singleton;
  singleton = openDb(config.databasePath);
  // Seed lazily and defensively; a seeding failure must not crash reads.
  try {
    // Local import avoids a module cycle (seed.ts → martyrs.ts → db.ts).
    const { seedIfEmpty } = require("./seed") as typeof import("./seed");
    seedIfEmpty(singleton);
  } catch (err) {
    console.error("[db] martyr seeding skipped:", err);
  }
  return singleton;
}

/** For tests: reset the memoised singleton. */
export function __resetDbSingletonForTests(): void {
  singleton = null;
}
