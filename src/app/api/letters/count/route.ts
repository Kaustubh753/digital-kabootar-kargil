import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { countApproved } from "@/lib/letters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/letters/count — live count of approved letters (PRD §5.8). */
export async function GET() {
  return NextResponse.json({ count: countApproved(getDb()) });
}
