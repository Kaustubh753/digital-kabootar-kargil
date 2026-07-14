import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { moderateLetter } from "@/lib/letters";
import { moderationActionSchema } from "@/lib/validation";
import { getAdmin, unauthorized } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/admin/letters/[id] — approve or reject a single letter. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = getAdmin(req);
  if (!admin) return unauthorized();

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = moderationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const updated = moderateLetter(getDb(), id, parsed.data.status, admin);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ letter: updated });
}
