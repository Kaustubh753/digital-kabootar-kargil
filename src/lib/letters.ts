/**
 * Data access for letters (PRD §4.1). Server-only; every function takes a `db`
 * handle so the moderation/status-transition logic can be unit-tested against
 * an in-memory database (PRD §6 — this pipeline must not silently fail).
 */

import { randomUUID } from "node:crypto";
import type { DB } from "./db";
import type {
  Letter,
  LetterWithMartyr,
  ModerationStatus,
  Paginated,
  PublicLetter,
} from "./types";

interface LetterRow {
  id: string;
  writer_name: string;
  organization_name: string;
  age: number | null;
  email: string | null;
  message: string;
  martyr_id: string;
  writer_state: string | null;
  moderation_status: ModerationStatus;
  moderation_categories: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  martyr_name?: string;
}

function parseCategories(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function rowToLetter(row: LetterRow): LetterWithMartyr {
  return {
    id: row.id,
    writer_name: row.writer_name,
    organization_name: row.organization_name,
    age: row.age,
    email: row.email,
    message: row.message,
    martyr_id: row.martyr_id,
    writer_state: row.writer_state,
    moderation_status: row.moderation_status,
    moderation_categories: parseCategories(row.moderation_categories),
    moderated_by: row.moderated_by,
    moderated_at: row.moderated_at,
    created_at: row.created_at,
    martyr_name: row.martyr_name ?? "",
  };
}

function rowToPublic(row: LetterRow): PublicLetter {
  return {
    id: row.id,
    writer_name: row.writer_name,
    organization_name: row.organization_name,
    message: row.message,
    martyr_id: row.martyr_id,
    martyr_name: row.martyr_name ?? "",
    created_at: row.created_at,
  };
}

export interface CreateLetterInput {
  writer_name: string;
  organization_name: string;
  age?: number | null;
  email?: string | null;
  message: string;
  martyr_id: string;
  writer_state?: string | null;
  /** Veer Vandan submission consent (required to submit). */
  consent?: boolean;
  /** Guardian consent — null when not applicable (participant is 18+). */
  guardian_consent?: boolean | null;
}

/**
 * Persist a new letter with an already-decided moderation status. The caller
 * (the submission route) runs the authoritative content check first and passes
 * the resulting status + categories in. Auto-approvals get a `system:auto`
 * audit stamp; pending letters are stamped by a human later.
 */
export function createLetter(
  db: DB,
  input: CreateLetterInput,
  status: ModerationStatus,
  categories: string[],
  ipHash: string | null,
  now: string = new Date().toISOString(),
): LetterWithMartyr {
  const id = randomUUID();
  const autoApproved = status === "approved";
  db.prepare(
    `INSERT INTO letters
       (id, writer_name, organization_name, age, email, message, martyr_id,
        writer_state, moderation_status, moderation_categories,
        moderated_by, moderated_at, created_at, ip_hash,
        consent_given, guardian_consent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.writer_name,
    input.organization_name,
    input.age ?? null,
    input.email ?? null,
    input.message,
    input.martyr_id,
    input.writer_state ?? null,
    status,
    JSON.stringify(categories),
    autoApproved ? "system:auto" : null,
    autoApproved ? now : null,
    now,
    ipHash,
    input.consent ? 1 : 0,
    input.guardian_consent == null ? null : input.guardian_consent ? 1 : 0,
  );
  return getLetter(db, id)!;
}

export function getLetter(db: DB, id: string): LetterWithMartyr | null {
  const row = db
    .prepare(
      `SELECT l.*, m.name AS martyr_name
         FROM letters l JOIN martyrs m ON m.id = l.martyr_id
        WHERE l.id = ?`,
    )
    .get(id) as unknown as LetterRow | undefined;
  return row ? rowToLetter(row) : null;
}

/** Live count of approved letters for the home-page counter (PRD §5.8). */
export function countApproved(db: DB): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS n FROM letters WHERE moderation_status = 'approved'`)
    .get() as { n: number };
  return row.n;
}

// --- Public gallery / martyr letters tab -----------------------------------

export interface PublicQuery {
  martyrId?: string;
  /** Search over writer name / organisation / martyr name (PRD §5.9). */
  q?: string;
  cursor?: string | null;
  limit?: number;
}

/**
 * Keyset-paginated list of APPROVED letters, newest first. Uses a
 * (created_at, id) cursor so performance stays flat at several thousand rows
 * (PRD §6) — no OFFSET scan.
 */
export function listApprovedLetters(
  db: DB,
  query: PublicQuery = {},
): Paginated<PublicLetter> {
  const limit = clampLimit(query.limit, 20);
  const where: string[] = [`l.moderation_status = 'approved'`];
  const params: (string | number)[] = [];

  if (query.martyrId) {
    where.push(`l.martyr_id = ?`);
    params.push(query.martyrId);
  }
  if (query.q && query.q.trim()) {
    const like = `%${escapeLike(query.q.trim())}%`;
    where.push(
      `(l.writer_name LIKE ? ESCAPE '\\' OR l.organization_name LIKE ? ESCAPE '\\' OR m.name LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like);
  }

  const cursor = decodeCursor(query.cursor);
  if (cursor) {
    // (created_at, id) strictly less than the cursor, for DESC ordering.
    where.push(`(l.created_at < ? OR (l.created_at = ? AND l.id < ?))`);
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }

  const whereSql = where.join(" AND ");
  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM letters l JOIN martyrs m ON m.id = l.martyr_id WHERE ${whereSql}`,
      )
      .get(...params) as { n: number }
  ).n;

  const rows = db
    .prepare(
      `SELECT l.*, m.name AS martyr_name
         FROM letters l JOIN martyrs m ON m.id = l.martyr_id
        WHERE ${whereSql}
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT ?`,
    )
    .all(...params, limit + 1) as unknown as LetterRow[];

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    items: page.map(rowToPublic),
    nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
    total,
  };
}

// --- Admin queue -----------------------------------------------------------

export interface AdminQuery {
  status?: ModerationStatus;
  martyrId?: string;
  q?: string;
  from?: string; // ISO date (inclusive)
  to?: string; // ISO date (inclusive)
  limit?: number;
  offset?: number;
  /** Default "oldest" — the moderation queue works oldest-first (PRD §5.3). */
  order?: "oldest" | "newest";
}

export function adminListLetters(
  db: DB,
  query: AdminQuery = {},
): Paginated<LetterWithMartyr> {
  const limit = clampLimit(query.limit, 25);
  const offset = Math.max(0, query.offset ?? 0);
  const { whereSql, params } = adminWhere(query);

  const total = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM letters l JOIN martyrs m ON m.id = l.martyr_id WHERE ${whereSql}`,
      )
      .get(...params) as { n: number }
  ).n;

  const dir = query.order === "newest" ? "DESC" : "ASC";
  const rows = db
    .prepare(
      `SELECT l.*, m.name AS martyr_name
         FROM letters l JOIN martyrs m ON m.id = l.martyr_id
        WHERE ${whereSql}
        ORDER BY l.created_at ${dir}, l.id ${dir}
        LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as unknown as LetterRow[];

  return {
    items: rows.map(rowToLetter),
    nextCursor: offset + rows.length < total ? String(offset + limit) : null,
    total,
  };
}

function adminWhere(query: AdminQuery): {
  whereSql: string;
  params: (string | number)[];
} {
  const where: string[] = ["1=1"];
  const params: (string | number)[] = [];
  if (query.status) {
    where.push(`l.moderation_status = ?`);
    params.push(query.status);
  }
  if (query.martyrId) {
    where.push(`l.martyr_id = ?`);
    params.push(query.martyrId);
  }
  if (query.q && query.q.trim()) {
    const like = `%${escapeLike(query.q.trim())}%`;
    where.push(
      `(l.writer_name LIKE ? ESCAPE '\\' OR l.organization_name LIKE ? ESCAPE '\\' OR l.message LIKE ? ESCAPE '\\' OR m.name LIKE ? ESCAPE '\\')`,
    );
    params.push(like, like, like, like);
  }
  if (query.from) {
    where.push(`l.created_at >= ?`);
    params.push(query.from);
  }
  if (query.to) {
    where.push(`l.created_at <= ?`);
    params.push(query.to);
  }
  return { whereSql: where.join(" AND "), params };
}

// --- Moderation actions ----------------------------------------------------

/**
 * Transition a letter's moderation status and stamp the audit trail. Returns
 * the updated letter, or null if the id doesn't exist.
 */
export function moderateLetter(
  db: DB,
  id: string,
  status: ModerationStatus,
  moderatedBy: string,
  now: string = new Date().toISOString(),
): LetterWithMartyr | null {
  const existing = getLetter(db, id);
  if (!existing) return null;
  db.prepare(
    `UPDATE letters
        SET moderation_status = ?, moderated_by = ?, moderated_at = ?
      WHERE id = ?`,
  ).run(status, moderatedBy, now, id);
  return getLetter(db, id);
}

/** Bulk approve/reject. Returns the number of rows updated. */
export function bulkModerate(
  db: DB,
  ids: string[],
  status: ModerationStatus,
  moderatedBy: string,
  now: string = new Date().toISOString(),
): number {
  if (ids.length === 0) return 0;
  const placeholders = ids.map(() => "?").join(",");
  const info = db
    .prepare(
      `UPDATE letters
          SET moderation_status = ?, moderated_by = ?, moderated_at = ?
        WHERE id IN (${placeholders})`,
    )
    .run(status, moderatedBy, now, ...ids);
  return Number(info.changes);
}

// --- Stats & export --------------------------------------------------------

export interface StatsSummary {
  totals: Record<ModerationStatus | "all", number>;
  approvalRate: number; // approved / (approved + rejected), 0..1
  perDay: { day: string; count: number }[];
  perMartyr: { martyr_id: string; martyr_name: string; count: number }[];
}

export function statsSummary(db: DB): StatsSummary {
  const totalsRows = db
    .prepare(
      `SELECT moderation_status AS s, COUNT(*) AS n FROM letters GROUP BY moderation_status`,
    )
    .all() as { s: ModerationStatus; n: number }[];
  const totals = { all: 0, pending: 0, approved: 0, rejected: 0 } as Record<
    ModerationStatus | "all",
    number
  >;
  for (const r of totalsRows) {
    totals[r.s] = r.n;
    totals.all += r.n;
  }
  const decided = totals.approved + totals.rejected;
  const approvalRate = decided === 0 ? 0 : totals.approved / decided;

  const perDay = db
    .prepare(
      `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
         FROM letters GROUP BY day ORDER BY day DESC LIMIT 30`,
    )
    .all() as { day: string; count: number }[];

  const perMartyr = db
    .prepare(
      `SELECT l.martyr_id, m.name AS martyr_name, COUNT(*) AS count
         FROM letters l JOIN martyrs m ON m.id = l.martyr_id
        GROUP BY l.martyr_id ORDER BY count DESC LIMIT 50`,
    )
    .all() as { martyr_id: string; martyr_name: string; count: number }[];

  return { totals, approvalRate, perDay, perMartyr };
}

/** Rows for CSV export (PRD §5.3). Respects the same admin filters. */
export function exportLetters(db: DB, query: AdminQuery = {}): LetterWithMartyr[] {
  const { whereSql, params } = adminWhere(query);
  const rows = db
    .prepare(
      `SELECT l.*, m.name AS martyr_name
         FROM letters l JOIN martyrs m ON m.id = l.martyr_id
        WHERE ${whereSql}
        ORDER BY l.created_at DESC`,
    )
    .all(...params) as unknown as LetterRow[];
  return rows.map(rowToLetter);
}

// --- helpers ---------------------------------------------------------------

interface Cursor {
  createdAt: string;
  id: string;
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const idx = decoded.indexOf("|");
    if (idx < 0) return null;
    return { createdAt: decoded.slice(0, idx), id: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

function clampLimit(limit: number | undefined, fallback: number): number {
  if (!Number.isFinite(limit) || (limit ?? 0) <= 0) return fallback;
  return Math.min(Math.floor(limit as number), 100);
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}
