import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { bulkModerate } from "@/lib/letters";
import { bulkModerationSchema } from "@/lib/validation";
import { getAdmin, unauthorized } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/letters/bulk — bulk approve/reject (PRD §5.3). */
export async function POST(req: NextRequest) {
  const admin = getAdmin(req);
  if (!admin) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bulkModerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const changed = bulkModerate(
    getDb(),
    parsed.data.ids,
    parsed.data.status,
    admin,
  );
  return NextResponse.json({ changed });
}
