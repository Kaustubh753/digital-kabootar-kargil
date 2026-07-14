/**
 * CLI seeder: `npm run seed [path/to/martyrs.json]`
 *
 * With no argument it loads data/martyrs.sample.json (PLACEHOLDER data). Point
 * it at the verified MoD dataset (same JSON shape) to load real records:
 *   npm run seed data/martyrs.verified.json
 *
 * Idempotent — records are upserted by id, so re-running updates in place.
 */

import { readFileSync } from "node:fs";
import { openDb, withTransaction } from "../src/lib/db";
import { upsertMartyr, countMartyrs, type MartyrInput } from "../src/lib/martyrs";
import { loadSampleMartyrs } from "../src/lib/seed";
import { config } from "../src/lib/config";

function main() {
  const arg = process.argv[2];
  let martyrs: MartyrInput[];
  if (arg) {
    const parsed = JSON.parse(readFileSync(arg, "utf8")) as {
      martyrs: MartyrInput[];
    };
    martyrs = parsed.martyrs ?? [];
    console.log(`Loading ${martyrs.length} martyrs from ${arg}`);
  } else {
    martyrs = loadSampleMartyrs();
    console.log(
      `No file given — loading ${martyrs.length} PLACEHOLDER martyrs from the sample file.`,
    );
  }

  const db = openDb(config.databasePath);
  withTransaction(db, () => {
    for (const m of martyrs) upsertMartyr(db, m);
  });
  console.log(`Done. martyrs table now has ${countMartyrs(db)} records.`);
}

main();
