import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  letterSubmissionSchema,
  honeypotTriggered,
  fieldErrors,
} from "@/lib/validation";
import { checkContent, decideInitialStatus } from "@/lib/moderation";
import { config } from "@/lib/config";
import { createLetter, listApprovedLetters } from "@/lib/letters";
import { getMartyr } from "@/lib/martyrs";
import { consume } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/letters — paginated approved letters for gallery & letters tab. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const db = getDb();
  const page = listApprovedLetters(db, {
    martyrId: sp.get("martyrId") ?? undefined,
    q: sp.get("q") ?? undefined,
    cursor: sp.get("cursor"),
    limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
  });
  return NextResponse.json(page);
}

/** POST /api/letters — submit a letter through the moderation pipeline. */
export async function POST(req: NextRequest) {
  // 1. Rate limit per IP (server-side, cannot be bypassed by the client).
  const ip = getClientIp(req.headers);
  const rl = consume(`submit:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterMs: rl.retryAfterMs },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  // 2. Parse JSON.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // 3. Honeypot: silently accept-and-drop so bots get no signal (PRD §5.4).
  if (honeypotTriggered(body)) {
    return NextResponse.json(
      { id: null, status: "pending", autoApproved: false, reasons: [] },
      { status: 201 },
    );
  }

  // 4. Validate.
  const parsed = letterSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // 5. The martyr must exist.
  const db = getDb();
  const martyr = getMartyr(db, data.martyr_id);
  if (!martyr) {
    return NextResponse.json({ error: "unknown_martyr" }, { status: 404 });
  }

  // 6. Authoritative content check → status decision.
  const decision = checkContent(data.message);
  const status = decideInitialStatus(decision, config.requireHumanReview);

  const letter = createLetter(
    db,
    {
      writer_name: data.writer_name,
      organization_name: data.organization_name,
      age: data.age ?? null,
      email: data.email ?? null,
      message: data.message,
      martyr_id: data.martyr_id,
      writer_state: data.writer_state ?? null,
    },
    status,
    decision.categories,
    hashIp(ip),
  );

  return NextResponse.json(
    {
      id: letter.id,
      status: letter.moderation_status,
      autoApproved: status === "approved",
      // Generic, non-slur-echoing reasons — only when held for review.
      reasons: status === "pending" ? decision.reasons : [],
    },
    { status: 201 },
  );
}
