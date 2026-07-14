import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMartyr } from "@/lib/martyrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/martyrs/[id] — a single martyr profile (PRD §5.5). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const martyr = getMartyr(getDb(), id);
  if (!martyr) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ martyr });
}
