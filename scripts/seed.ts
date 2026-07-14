/**
 * CLI seeder: `npm run seed [path/to/martyrs.json]`
 *
 * With no argument it loads data/martyrs.json (the Kargil Roll of Honour). Point
 * it at another file (same JSON shape) to load an updated dataset:
 *   npm run seed data/martyrs.updated.json
 *
 * Idempotent — records are upserted by id, so re-running updates in place.
 */

import { readFileSync } from "node:fs";
import { openDb, withTransaction } from "../src/lib/db";
import { upsertMartyr, countMartyrs, type MartyrInput } from "../src/lib/martyrs";
import { loadSeedMartyrs } from "../src/lib/seed";
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
    martyrs = loadSeedMartyrs();
    console.log(
      `No file given — loading ${martyrs.length} martyrs from the Kargil Roll of Honour (data/martyrs.json).`,
    );
  }

  const db = openDb(config.databasePath);
  withTransaction(db, () => {
    for (const m of martyrs) upsertMartyr(db, m);
  });
  console.log(`Done. martyrs table now has ${countMartyrs(db)} records.`);
}

main();
