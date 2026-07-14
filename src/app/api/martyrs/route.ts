import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { listMartyrs, listStates } from "@/lib/martyrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/martyrs — searchable/filterable directory (PRD §5.5). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const db = getDb();
  const items = listMartyrs(db, {
    q: sp.get("q") ?? undefined,
    state: sp.get("state") ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
  });
  return NextResponse.json({ items, states: listStates(db) });
}
