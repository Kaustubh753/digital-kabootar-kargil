import { describe, it, expect } from "vitest";
import { issueSession, verifySession, verifyPassword } from "./auth";

describe("admin session tokens", () => {
  it("verifies a freshly issued session", () => {
    const now = 1_000_000;
    const token = issueSession(now);
    expect(verifySession(token, now + 1000)).toBe("admin");
  });

  it("rejects an expired session", () => {
    const now = 1_000_000;
    const token = issueSession(now);
    // 8h + 1ms later
    expect(verifySession(token, now + 8 * 60 * 60 * 1000 + 1)).toBeNull();
  });

  it("rejects a tampered token", () => {
    const token = issueSession(1000);
    const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
    expect(verifySession(tampered, 2000)).toBeNull();
  });

  it("rejects garbage and empty tokens", () => {
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession("")).toBeNull();
    expect(verifySession("not-a-token")).toBeNull();
    expect(verifySession("a.b.c")).toBeNull();
  });
});

describe("verifyPassword", () => {
  it("accepts the configured dev password and rejects others", () => {
    // Default dev password from config when ADMIN_PASSWORD is unset.
    expect(verifyPassword("kargil-admin-dev")).toBe(true);
    expect(verifyPassword("wrong")).toBe(false);
    expect(verifyPassword("")).toBe(false);
  });
});
