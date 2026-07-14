import { NextResponse, type NextRequest } from "next/server";
import { adminLoginSchema } from "@/lib/validation";
import {
  SESSION_COOKIE,
  issueSession,
  verifyPassword,
  sessionCookieOptions,
} from "@/lib/auth";
import { consume } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/login — exchange the admin password for a session cookie. */
export async function POST(req: NextRequest) {
  // Throttle password guessing per IP.
  const ip = getClientIp(req.headers);
  const rl = consume(`login:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success || !verifyPassword(parsed.data.password)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, issueSession(), sessionCookieOptions());
  return res;
}
