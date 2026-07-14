/**
 * Server-side runtime configuration, read once from the environment.
 * Never import this from a client component — it reads process.env.
 */

const DEV_ADMIN_PASSWORD = "kargil-admin-dev";
const DEV_SESSION_SECRET = "insecure-dev-session-secret-change-me";

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const config = {
  databasePath: process.env.DATABASE_PATH || "./data/kabootar.db",

  adminPassword: process.env.ADMIN_PASSWORD || DEV_ADMIN_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET || DEV_SESSION_SECRET,

  /**
   * When true, every letter is held as `pending` regardless of the automated
   * check (PRD Open Q #2 — human-review-only mode). Default false = auto-approve
   * letters that pass the automated check cleanly (PRD §3).
   */
  requireHumanReview: bool(process.env.REQUIRE_HUMAN_REVIEW, false),

  rateLimit: {
    max: int(process.env.RATE_LIMIT_MAX, 5),
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  },

  isProd: process.env.NODE_ENV === "production",
};

/** Loudly warn if insecure development defaults are in use. */
export function assertSecureConfig(): void {
  const warnings: string[] = [];
  if (config.adminPassword === DEV_ADMIN_PASSWORD) {
    warnings.push("ADMIN_PASSWORD is using the insecure development default.");
  }
  if (config.sessionSecret === DEV_SESSION_SECRET) {
    warnings.push("SESSION_SECRET is using the insecure development default.");
  }
  if (warnings.length && config.isProd) {
    throw new Error(
      "Refusing to start in production with insecure defaults:\n  " +
        warnings.join("\n  "),
    );
  }
  if (warnings.length) {
    for (const w of warnings) console.warn(`[config] WARNING: ${w}`);
  }
}
