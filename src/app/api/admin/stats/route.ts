import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { statsSummary } from "@/lib/letters";
import { getAdmin, unauthorized } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/stats — submission counts, approval rate (PRD §5.3). */
export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return unauthorized();
  return NextResponse.json(statsSummary(getDb()));
}
