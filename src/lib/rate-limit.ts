/**
 * Per-IP rate limiting for letter submissions (PRD §5.4). Fixed-window counter.
 *
 * SCOPE: this is an in-process store. It is correct for a single Node instance
 * (the default deployment here). A horizontally-scaled deployment must swap the
 * store for a shared one (e.g. Redis) — the pure `decide()` function below is
 * written so only the store needs to change.
 *
 * Server-only.
 */

import { config } from "./config";

interface Window {
  count: number;
  resetAt: number; // epoch ms when the window resets
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export type RateLimitStore = Map<string, Window>;

/**
 * Pure decision function — deterministic given (store, key, now, opts). Mutates
 * `store`. Exposed for unit testing with an injected clock.
 */
export function decide(
  store: RateLimitStore,
  key: string,
  now: number,
  max: number,
  windowMs: number,
): RateLimitResult {
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt, retryAfterMs: 0 };
  }
  if (existing.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterMs: existing.resetAt - now,
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
    retryAfterMs: 0,
  };
}

const defaultStore: RateLimitStore = new Map();

/** Occasionally evict expired windows so the map doesn't grow unbounded. */
function sweep(store: RateLimitStore, now: number): void {
  if (store.size < 1000) return;
  for (const [k, w] of store) if (w.resetAt <= now) store.delete(k);
}

/** Production entry point: consume one unit for `key` using configured limits. */
export function consume(
  key: string,
  now: number = Date.now(),
): RateLimitResult {
  sweep(defaultStore, now);
  return decide(
    defaultStore,
    key,
    now,
    config.rateLimit.max,
    config.rateLimit.windowMs,
  );
}

/** For tests: clear the default store. */
export function __resetRateLimitForTests(): void {
  defaultStore.clear();
}
