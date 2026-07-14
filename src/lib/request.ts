/**
 * Request helpers: extract the client IP and hash it. Server-only.
 *
 * We store only a KEYED HASH of the IP (HMAC with SESSION_SECRET), never the raw
 * address — enough to power rate-limiting and abuse audit without retaining PII.
 */

import { createHmac } from "node:crypto";
import { config } from "./config";

/**
 * Best-effort client IP from proxy headers. Behind a trusted proxy this is
 * x-forwarded-for's first hop. Falls back to "unknown" so callers always get a
 * usable rate-limit key.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export function hashIp(ip: string): string {
  return createHmac("sha256", config.sessionSecret)
    .update(ip)
    .digest("hex")
    .slice(0, 32);
}
