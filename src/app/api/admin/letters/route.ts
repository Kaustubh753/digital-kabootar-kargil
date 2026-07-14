import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { adminListLetters } from "@/lib/letters";
import { getAdmin, unauthorized } from "@/lib/admin-guard";
import type { ModerationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ModerationStatus[] = ["pending", "approved", "rejected"];

/** GET /api/admin/letters — the moderation queue with filters (PRD §5.3). */
export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return unauthorized();
  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status");
  const status =
    statusParam && STATUSES.includes(statusParam as ModerationStatus)
      ? (statusParam as ModerationStatus)
      : undefined;

  const page = adminListLetters(getDb(), {
    status,
    martyrId: sp.get("martyrId") ?? undefined,
    q: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
    order: sp.get("order") === "newest" ? "newest" : "oldest",
  });
  return NextResponse.json(page);
}
