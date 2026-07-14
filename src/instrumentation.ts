/**
 * Next.js instrumentation — runs once when the server boots.
 *
 * We use it to fail closed: in production, refuse to start if the admin
 * password or session secret are still the insecure development defaults.
 * Without this, a deployment that forgot to set ADMIN_PASSWORD / SESSION_SECRET
 * would have a guessable password AND a forgeable session cookie (the HMAC key
 * would be public), effectively leaving the admin dashboard open.
 */
export async function register() {
  // Only enforce at server runtime (nodejs), never during `next build`.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { assertSecureConfig } = await import("./lib/config");
    assertSecureConfig();
  }
}
