/**
 * Admin request guard for API route handlers. Imports next/server, so it must
 * only be used from route handlers (never from the isomorphic lib or tests).
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth";

/** Returns the admin subject if the request carries a valid session, else null. */
export function getAdmin(req: NextRequest): string | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
