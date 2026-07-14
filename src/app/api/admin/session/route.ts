import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/session — lightweight auth check for the client. */
export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: getAdmin(req) !== null });
}
