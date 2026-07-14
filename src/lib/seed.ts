/**
 * Seeds the martyrs table from data/martyrs.sample.json when it is empty.
 * Server-only.
 *
 * The sample file is PLACEHOLDER data (see its _README and PRD §4.2). In
 * production this seeding is a convenience for local/dev; the real, verified
 * dataset should be loaded via the same `upsertMartyr` path (e.g. `npm run
 * seed` pointed at the verified file).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { withTransaction, type DB } from "./db";
import { countMartyrs, upsertMartyr, type MartyrInput } from "./martyrs";

interface SampleFile {
  martyrs: MartyrInput[];
}

export function loadSampleMartyrs(): MartyrInput[] {
  const path = join(process.cwd(), "data", "martyrs.sample.json");
  const parsed = JSON.parse(readFileSync(path, "utf8")) as SampleFile;
  return parsed.martyrs ?? [];
}

/** Insert placeholder martyrs only if none exist yet. Idempotent. */
export function seedIfEmpty(db: DB): void {
  if (countMartyrs(db) > 0) return;
  const martyrs = loadSampleMartyrs();
  withTransaction(db, () => {
    for (const m of martyrs) upsertMartyr(db, m);
  });
  console.warn(
    `[seed] Inserted ${martyrs.length} PLACEHOLDER martyrs. Replace with ` +
      `verified MoD data before launch (PRD §4.2).`,
  );
}
