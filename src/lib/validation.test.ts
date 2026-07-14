import { describe, it, expect } from "vitest";
import {
  letterSubmissionSchema,
  honeypotTriggered,
  MESSAGE_MAX,
} from "./validation";

function valid(over: Record<string, unknown> = {}) {
  return {
    writer_name: "Asha",
    organization_name: "Community Group",
    message: "Thank you for your service.",
    martyr_id: "m1",
    ...over,
  };
}

describe("letterSubmissionSchema", () => {
  it("accepts a minimal valid submission", () => {
    const r = letterSubmissionSchema.safeParse(valid());
    expect(r.success).toBe(true);
  });

  it("requires writer name, organisation, message, martyr", () => {
    for (const field of [
      "writer_name",
      "organization_name",
      "message",
      "martyr_id",
    ]) {
      const r = letterSubmissionSchema.safeParse(valid({ [field]: "" }));
      expect(r.success, field).toBe(false);
    }
  });

  it("enforces the 500-character message cap", () => {
    const ok = letterSubmissionSchema.safeParse(
      valid({ message: "a".repeat(MESSAGE_MAX) }),
    );
    expect(ok.success).toBe(true);
    const tooLong = letterSubmissionSchema.safeParse(
      valid({ message: "a".repeat(MESSAGE_MAX + 1) }),
    );
    expect(tooLong.success).toBe(false);
  });

  it("treats empty optional fields as undefined", () => {
    const r = letterSubmissionSchema.safeParse(
      valid({ email: "", age: "", writer_state: "" }),
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBeUndefined();
      expect(r.data.age).toBeUndefined();
    }
  });

  it("validates email format when provided", () => {
    expect(
      letterSubmissionSchema.safeParse(valid({ email: "not-an-email" })).success,
    ).toBe(false);
    expect(
      letterSubmissionSchema.safeParse(valid({ email: "a@b.com" })).success,
    ).toBe(true);
  });

  it("coerces and bounds age", () => {
    const r = letterSubmissionSchema.safeParse(valid({ age: "34" }));
    expect(r.success && r.data.age).toBe(34);
    expect(letterSubmissionSchema.safeParse(valid({ age: "999" })).success).toBe(
      false,
    );
  });

  it("ignores unknown fields like the honeypot at the schema level", () => {
    // The honeypot is handled in the route, not as a schema failure.
    expect(
      letterSubmissionSchema.safeParse(valid({ website: "http://bot.example" }))
        .success,
    ).toBe(true);
  });
});

describe("honeypotTriggered", () => {
  it("trips when the hidden field is filled", () => {
    expect(honeypotTriggered({ website: "http://bot.example" })).toBe(true);
    expect(honeypotTriggered({ website: "anything" })).toBe(true);
  });

  it("does not trip when empty, whitespace, or absent", () => {
    expect(honeypotTriggered({ website: "" })).toBe(false);
    expect(honeypotTriggered({ website: "   " })).toBe(false);
    expect(honeypotTriggered({})).toBe(false);
    expect(honeypotTriggered(null)).toBe(false);
  });
});
