import { type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { exportLetters } from "@/lib/letters";
import { toCsv } from "@/lib/csv";
import { getAdmin, unauthorized } from "@/lib/admin-guard";
import type { ModerationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ModerationStatus[] = ["pending", "approved", "rejected"];
const HEADERS = [
  "id",
  "created_at",
  "status",
  "martyr_id",
  "martyr_name",
  "writer_name",
  "organization_name",
  "age",
  "email",
  "writer_state",
  "flagged_categories",
  "moderated_by",
  "moderated_at",
  "message",
];

/** GET /api/admin/export — CSV of letters matching the current filters. */
export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const statusParam = sp.get("status");
  const status =
    statusParam && STATUSES.includes(statusParam as ModerationStatus)
      ? (statusParam as ModerationStatus)
      : undefined;

  const rows = exportLetters(getDb(), {
    status,
    martyrId: sp.get("martyrId") ?? undefined,
    q: sp.get("q") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });

  const csv = toCsv(
    HEADERS,
    rows.map((l) => [
      l.id,
      l.created_at,
      l.moderation_status,
      l.martyr_id,
      l.martyr_name,
      l.writer_name,
      l.organization_name,
      l.age,
      l.email,
      l.writer_state,
      l.moderation_categories.join("; "),
      l.moderated_by,
      l.moderated_at,
      l.message,
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="letters-${stamp}.csv"`,
    },
  });
}
