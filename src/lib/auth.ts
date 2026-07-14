/**
 * Admin authentication (PRD §5.3 — auth-gated /admin).
 *
 * There is no writer login (the site is intentionally no-login, PRD §7). Only
 * the admin dashboard is gated. We use a stateless, HMAC-signed session cookie
 * — no session store needed, and it can't be forged without SESSION_SECRET.
 *
 * Server-only.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

export const SESSION_COOKIE = "kabootar_admin";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface SessionPayload {
  sub: string; // who ("admin")
  iat: number; // issued-at (ms)
  exp: number; // expiry (ms)
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", config.sessionSecret).update(body).digest("base64url");
}

/** Constant-time compare of two strings (avoids leaking via timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Verify a plaintext admin password against the configured one. */
export function verifyPassword(input: string): boolean {
  return safeEqual(input, config.adminPassword);
}

/** Issue a signed session token for the admin. */
export function issueSession(now: number = Date.now()): string {
  const payload: SessionPayload = {
    sub: "admin",
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/**
 * Verify a session token: signature valid AND not expired. Returns the subject
 * ("admin") or null. Used by middleware and admin API routes.
 */
export function verifySession(
  token: string | undefined | null,
  now: number = Date.now(),
): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(body))) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload.sub || null;
  } catch {
    return null;
  }
}

/** Cookie options for setting the session (HttpOnly, SameSite=Lax). */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.isProd,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
