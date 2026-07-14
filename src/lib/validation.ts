/**
 * Input validation (zod). Isomorphic — the client form and the server route
 * share these schemas so the rules can't drift. The server is authoritative.
 */

import { z } from "zod";

/** Treat empty/whitespace-only optional strings as "not provided". */
const optionalTrimmed = (max: number) =>
  z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().max(max).optional(),
    )
    .optional();

export const MESSAGE_MAX = 500;

export const letterSubmissionSchema = z.object({
  writer_name: z.string().trim().min(1, "Your name is required").max(100),
  organization_name: z
    .string()
    .trim()
    .min(1, "Organisation is required")
    .max(120),
  age: z
    .preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number().int().min(1).max(120).optional(),
    )
    .optional(),
  email: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().email("Enter a valid email").max(200).optional(),
    )
    .optional(),
  message: z
    .string()
    .trim()
    .min(1, "Please write a message")
    .max(MESSAGE_MAX, `Message must be ${MESSAGE_MAX} characters or fewer`),
  martyr_id: z.string().trim().min(1, "Please choose a martyr to write to"),
  writer_state: optionalTrimmed(60),
});

export type LetterSubmission = z.infer<typeof letterSubmissionSchema>;

/**
 * Honeypot check (PRD §5.4). The form renders a hidden `website` field that real
 * users never see; bots that fill every field trip it. Handled in the route
 * (silent accept) rather than as a validation error, so the rare autofill case
 * doesn't show a real person a confusing "bot detected" message.
 */
export const HONEYPOT_FIELD = "website";
export function honeypotTriggered(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim().length > 0;
}

export const moderationActionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const bulkModerationSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(["approved", "rejected"]),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1),
});

/** Flatten a ZodError into `{ field: message }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
