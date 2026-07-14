/**
 * Seeds the martyrs table from data/martyrs.json when it is empty. Server-only.
 *
 * The dataset is the Kargil (Operation Vijay, 1999) Roll of Honour sourced from
 * the official Roll of Honour spreadsheet. To load an updated/verified file, use
 * the same `upsertMartyr` path (e.g. `npm run seed path/to/file.json`).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { withTransaction, type DB } from "./db";
import { countMartyrs, upsertMartyr, type MartyrInput } from "./martyrs";

interface MartyrsFile {
  martyrs: MartyrInput[];
}

export function loadSeedMartyrs(): MartyrInput[] {
  const path = join(process.cwd(), "data", "martyrs.json");
  const parsed = JSON.parse(readFileSync(path, "utf8")) as MartyrsFile;
  return parsed.martyrs ?? [];
}

/** Insert the Roll of Honour martyrs only if none exist yet. Idempotent. */
export function seedIfEmpty(db: DB): void {
  if (countMartyrs(db) > 0) return;
  const martyrs = loadSeedMartyrs();
  withTransaction(db, () => {
    for (const m of martyrs) upsertMartyr(db, m);
  });
  console.warn(
    `[seed] Inserted ${martyrs.length} martyrs from the Kargil Roll of Honour.`,
  );
}
