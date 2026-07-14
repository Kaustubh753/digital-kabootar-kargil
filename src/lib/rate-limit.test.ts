import { describe, it, expect } from "vitest";
import { decide, type RateLimitStore } from "./rate-limit";

describe("rate limiter (fixed window)", () => {
  it("allows up to max within the window, then blocks", () => {
    const store: RateLimitStore = new Map();
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(decide(store, "ip", now, 3, 60_000).allowed).toBe(true);
    }
    const blocked = decide(store, "ip", now, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const store: RateLimitStore = new Map();
    decide(store, "ip", 0, 1, 1000);
    expect(decide(store, "ip", 500, 1, 1000).allowed).toBe(false);
    expect(decide(store, "ip", 1001, 1, 1000).allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const store: RateLimitStore = new Map();
    expect(decide(store, "a", 0, 1, 1000).allowed).toBe(true);
    expect(decide(store, "b", 0, 1, 1000).allowed).toBe(true);
    expect(decide(store, "a", 0, 1, 1000).allowed).toBe(false);
  });

  it("reports decreasing remaining count", () => {
    const store: RateLimitStore = new Map();
    expect(decide(store, "ip", 0, 3, 1000).remaining).toBe(2);
    expect(decide(store, "ip", 0, 3, 1000).remaining).toBe(1);
    expect(decide(store, "ip", 0, 3, 1000).remaining).toBe(0);
  });
});
