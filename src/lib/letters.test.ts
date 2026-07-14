import { describe, it, expect, beforeEach } from "vitest";
import { openDb, type DB } from "./db";
import { upsertMartyr } from "./martyrs";
import {
  createLetter,
  moderateLetter,
  bulkModerate,
  countApproved,
  listApprovedLetters,
  adminListLetters,
  statsSummary,
  getLetter,
  type CreateLetterInput,
} from "./letters";

function baseInput(over: Partial<CreateLetterInput> = {}): CreateLetterInput {
  return {
    writer_name: "Asha",
    organization_name: "Community",
    message: "Thank you for your sacrifice.",
    martyr_id: "m1",
    email: "asha@example.com",
    ...over,
  };
}

let db: DB;
beforeEach(() => {
  db = openDb(":memory:");
  upsertMartyr(db, { id: "m1", name: "Martyr One" });
  upsertMartyr(db, { id: "m2", name: "Martyr Two" });
});

describe("createLetter + status", () => {
  it("approved letters are public and counted; pending are not", () => {
    createLetter(db, baseInput(), "approved", [], null);
    createLetter(db, baseInput({ message: "held" }), "pending", ["spam"], null);

    expect(countApproved(db)).toBe(1);
    const gallery = listApprovedLetters(db);
    expect(gallery.total).toBe(1);
    expect(gallery.items).toHaveLength(1);
    expect(gallery.items[0].message).toBe("Thank you for your sacrifice.");
  });

  it("auto-approved letters get a system audit stamp", () => {
    const l = createLetter(db, baseInput(), "approved", [], null);
    expect(l.moderated_by).toBe("system:auto");
    expect(l.moderated_at).not.toBeNull();
  });

  it("pending letters have no moderation stamp yet", () => {
    const l = createLetter(db, baseInput(), "pending", ["profanity"], null);
    expect(l.moderated_by).toBeNull();
    expect(l.moderated_at).toBeNull();
    expect(l.moderation_categories).toEqual(["profanity"]);
  });

  it("public letter shape never exposes email", () => {
    createLetter(db, baseInput(), "approved", [], null);
    const item = listApprovedLetters(db).items[0];
    expect(item).not.toHaveProperty("email");
    expect(JSON.stringify(item)).not.toContain("asha@example.com");
  });
});

describe("moderation transitions", () => {
  it("pending → approved makes a letter public", () => {
    const l = createLetter(db, baseInput(), "pending", ["spam"], null);
    expect(countApproved(db)).toBe(0);

    const updated = moderateLetter(db, l.id, "approved", "admin");
    expect(updated?.moderation_status).toBe("approved");
    expect(updated?.moderated_by).toBe("admin");
    expect(updated?.moderated_at).not.toBeNull();
    expect(countApproved(db)).toBe(1);
  });

  it("approved → rejected removes a letter from public view", () => {
    const l = createLetter(db, baseInput(), "approved", [], null);
    expect(countApproved(db)).toBe(1);

    moderateLetter(db, l.id, "rejected", "admin");
    expect(countApproved(db)).toBe(0);
    expect(listApprovedLetters(db).total).toBe(0);
  });

  it("moderating an unknown id returns null", () => {
    expect(moderateLetter(db, "nope", "approved", "admin")).toBeNull();
  });

  it("bulk approve updates many and reports the count", () => {
    const ids = [0, 1, 2].map(
      (i) => createLetter(db, baseInput({ message: `m${i}` }), "pending", [], null).id,
    );
    const changed = bulkModerate(db, ids, "approved", "admin");
    expect(changed).toBe(3);
    expect(countApproved(db)).toBe(3);
  });
});

describe("keyset pagination & filters", () => {
  beforeEach(() => {
    // 25 approved across two martyrs, deterministic timestamps.
    for (let i = 0; i < 25; i++) {
      const ts = new Date(Date.UTC(2025, 0, 1, 0, 0, i)).toISOString();
      createLetter(
        db,
        baseInput({
          writer_name: `Writer ${i}`,
          martyr_id: i % 2 === 0 ? "m1" : "m2",
          message: `letter ${i}`,
        }),
        "approved",
        [],
        null,
        ts,
      );
    }
  });

  it("paginates without overlap and reports total", () => {
    const p1 = listApprovedLetters(db, { limit: 10 });
    expect(p1.items).toHaveLength(10);
    expect(p1.total).toBe(25);
    expect(p1.nextCursor).not.toBeNull();

    const p2 = listApprovedLetters(db, { limit: 10, cursor: p1.nextCursor });
    const p3 = listApprovedLetters(db, { limit: 10, cursor: p2.nextCursor });
    expect(p3.items).toHaveLength(5);
    expect(p3.nextCursor).toBeNull();

    const seen = new Set(
      [...p1.items, ...p2.items, ...p3.items].map((l) => l.id),
    );
    expect(seen.size).toBe(25); // no duplicates across pages
  });

  it("orders newest first", () => {
    const p = listApprovedLetters(db, { limit: 25 });
    for (let i = 1; i < p.items.length; i++) {
      expect(
        p.items[i - 1].created_at >= p.items[i].created_at,
      ).toBe(true);
    }
  });

  it("filters by martyr", () => {
    const p = listApprovedLetters(db, { martyrId: "m1", limit: 100 });
    expect(p.total).toBe(13); // indexes 0,2,...,24
    expect(p.items.every((l) => l.martyr_id === "m1")).toBe(true);
  });

  it("searches by writer name", () => {
    const p = listApprovedLetters(db, { q: "Writer 7" });
    expect(p.items.some((l) => l.writer_name === "Writer 7")).toBe(true);
    expect(p.items.every((l) => l.writer_name.includes("Writer 7"))).toBe(true);
  });
});

describe("admin queue", () => {
  it("lists oldest-first by default and filters by status", () => {
    const a = createLetter(db, baseInput(), "pending", [], null, "2025-01-01T00:00:00.000Z");
    const b = createLetter(db, baseInput(), "pending", [], null, "2025-01-02T00:00:00.000Z");
    createLetter(db, baseInput(), "approved", [], null, "2025-01-03T00:00:00.000Z");

    const pending = adminListLetters(db, { status: "pending" });
    expect(pending.total).toBe(2);
    expect(pending.items[0].id).toBe(a.id); // oldest first
    expect(pending.items[1].id).toBe(b.id);
  });
});

describe("stats", () => {
  it("computes totals and approval rate", () => {
    createLetter(db, baseInput(), "approved", [], null);
    createLetter(db, baseInput(), "approved", [], null);
    createLetter(db, baseInput(), "rejected", [], null);
    createLetter(db, baseInput(), "pending", [], null);

    const s = statsSummary(db);
    expect(s.totals.all).toBe(4);
    expect(s.totals.approved).toBe(2);
    expect(s.totals.rejected).toBe(1);
    expect(s.totals.pending).toBe(1);
    // approval rate = approved / (approved + rejected) = 2/3
    expect(s.approvalRate).toBeCloseTo(2 / 3, 5);
  });
});

describe("getLetter", () => {
  it("joins the martyr name", () => {
    const l = createLetter(db, baseInput(), "approved", [], null);
    expect(getLetter(db, l.id)?.martyr_name).toBe("Martyr One");
  });
});
