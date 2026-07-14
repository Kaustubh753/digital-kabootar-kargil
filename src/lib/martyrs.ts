/**
 * Data access for the Kargil martyrs reference dataset (PRD §4.2, §5.5).
 * Server-only. Functions take a `db` handle for testability.
 */

import type { DB } from "./db";
import type { Martyr } from "./types";

interface MartyrRow {
  id: string;
  name: string;
  rank: string | null;
  regiment: string | null;
  native_state: string | null;
  age_at_martyrdom: number | null;
  date_of_martyrdom: string | null;
  gallantry_award: string | null;
  citation: string | null;
  photo: string | null;
  is_placeholder: number;
}

function rowToMartyr(row: MartyrRow): Martyr {
  return { ...row, is_placeholder: row.is_placeholder === 1 };
}

export interface MartyrInput {
  id: string;
  name: string;
  rank?: string | null;
  regiment?: string | null;
  native_state?: string | null;
  age_at_martyrdom?: number | null;
  date_of_martyrdom?: string | null;
  gallantry_award?: string | null;
  citation?: string | null;
  photo?: string | null;
  is_placeholder?: boolean;
}

/** Insert or replace a martyr record (used by the seeder). */
export function upsertMartyr(db: DB, m: MartyrInput): void {
  db.prepare(
    `INSERT INTO martyrs
       (id, name, rank, regiment, native_state, age_at_martyrdom,
        date_of_martyrdom, gallantry_award, citation, photo, is_placeholder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       rank = excluded.rank,
       regiment = excluded.regiment,
       native_state = excluded.native_state,
       age_at_martyrdom = excluded.age_at_martyrdom,
       date_of_martyrdom = excluded.date_of_martyrdom,
       gallantry_award = excluded.gallantry_award,
       citation = excluded.citation,
       photo = excluded.photo,
       is_placeholder = excluded.is_placeholder`,
  ).run(
    m.id,
    m.name,
    m.rank ?? null,
    m.regiment ?? null,
    m.native_state ?? null,
    m.age_at_martyrdom ?? null,
    m.date_of_martyrdom ?? null,
    m.gallantry_award ?? null,
    m.citation ?? null,
    m.photo ?? null,
    m.is_placeholder ? 1 : 0,
  );
}

export function countMartyrs(db: DB): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM martyrs`).get() as {
    n: number;
  };
  return row.n;
}

export function getMartyr(db: DB, id: string): Martyr | null {
  const row = db
    .prepare(`SELECT * FROM martyrs WHERE id = ?`)
    .get(id) as unknown as MartyrRow | undefined;
  return row ? rowToMartyr(row) : null;
}

export interface MartyrQuery {
  /** Free-text search over name / regiment / native_state. */
  q?: string;
  /** Filter to an exact native_state. */
  state?: string;
  limit?: number;
  offset?: number;
}

export function listMartyrs(db: DB, query: MartyrQuery = {}): Martyr[] {
  const limit = clampLimit(query.limit, 100);
  const offset = Math.max(0, query.offset ?? 0);
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (query.q && query.q.trim()) {
    const like = `%${escapeLike(query.q.trim())}%`;
    where.push(
      `(name LIKE ? ESCAPE '\\' OR regiment LIKE ? ESCAPE '\\' OR native_state LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like);
  }
  if (query.state && query.state.trim()) {
    where.push(`native_state = ?`);
    params.push(query.state.trim());
  }

  const sql =
    `SELECT * FROM martyrs` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params) as unknown as MartyrRow[];
  return rows.map(rowToMartyr);
}

/** Distinct native states, for the directory's filter dropdown. */
export function listStates(db: DB): string[] {
  const rows = db
    .prepare(
      `SELECT DISTINCT native_state AS s FROM martyrs
       WHERE native_state IS NOT NULL AND native_state <> ''
       ORDER BY native_state ASC`,
    )
    .all() as { s: string }[];
  return rows.map((r) => r.s);
}

function clampLimit(limit: number | undefined, fallback: number): number {
  if (!Number.isFinite(limit) || (limit ?? 0) <= 0) return fallback;
  return Math.min(Math.floor(limit as number), 200);
}

/** Escape LIKE wildcards in user input so `%` / `_` are treated literally. */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
