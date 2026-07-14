/**
 * Content-moderation engine (PRD §5.2).
 *
 * This module is PURE and ISOMORPHIC — it imports nothing Node-specific and is
 * used in two places:
 *   1. Client-side, for an instant warning to the writer (advisory only).
 *   2. Server-side, in the letter-submission route, as the AUTHORITATIVE check
 *      that decides `approved` vs `pending`. Because the server re-runs this
 *      regardless of what the client did, the gate cannot be bypassed by
 *      disabling JavaScript.
 *
 * Design goals:
 *   - Resist common evasion: leetspeak (sh1t, @ss, fu(k), character repetition
 *     (fuuuuck), and letter spacing (f u c k / s.h.i.t).
 *   - Avoid the "Scunthorpe problem": short ambiguous stems only match as whole
 *     tokens, so innocent words (class, therapist, retardant) are not flagged.
 *   - Never flag ordinary war vocabulary — this is a war-memorial site.
 *
 * A "flagged" result never auto-rejects; it routes the letter to `pending` for
 * human review. Rejection is a human (or policy) decision made in the admin UI.
 */

import {
  BLOCKLIST,
  BLOCKED_PHRASES,
  type BlockEntry,
  type ModerationCategory,
} from "./moderation-wordlist";

export type { ModerationCategory } from "./moderation-wordlist";

export interface ModerationDecision {
  /** true when the message passed cleanly and may be auto-approved. */
  clean: boolean;
  /** Distinct categories that triggered, for admin display. */
  categories: ModerationCategory[];
  /** Generic, non-slur-echoing reasons, safe to show a writer. */
  reasons: string[];
}

/** Map of common leetspeak / obfuscation characters to their letter. */
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
  "(": "c",
  "<": "c",
};

/** Strip accents/diacritics: café → cafe. */
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Collapse any run of 3+ identical characters down to a single one. */
function collapseRepeats(s: string): string {
  return s.replace(/(.)\1{2,}/g, "$1");
}

/** Apply leetspeak substitution character-by-character. */
function deLeet(s: string): string {
  let out = "";
  for (const ch of s) out += LEET_MAP[ch] ?? ch;
  return out;
}

/**
 * Canonical token stream used for word/substring matching. Lowercased,
 * accent-stripped, leet-substituted, repeat-collapsed, split on non-letters.
 */
function tokenize(message: string): string[] {
  const base = deLeet(stripDiacritics(message.toLowerCase()));
  return base
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map(collapseRepeats);
}

function matchesEntry(entry: BlockEntry, tokens: string[]): boolean {
  if (entry.match === "word") {
    return tokens.some((t) => t === entry.term);
  }
  return tokens.some((t) => t.includes(entry.term));
}

/**
 * Reconstruct words that were split up with spaces/punctuation to evade the
 * filter, e.g. "f u c k" or "s.h.i.t". We only join RUNS of consecutive
 * single-letter tokens, so ordinary prose ("I am a hero") is unaffected.
 */
function spacedEvasionStrings(tokens: string[]): string[] {
  const runs: string[] = [];
  let current: string[] = [];
  for (const t of tokens) {
    if (t.length === 1) {
      current.push(t);
    } else {
      if (current.length >= 3) runs.push(current.join(""));
      current = [];
    }
  }
  if (current.length >= 3) runs.push(current.join(""));
  return runs;
}

/** Normalised, space-joined form for phrase and shouting checks. */
function normalizedText(message: string): string {
  return collapseRepeats(stripDiacritics(message.toLowerCase()))
    .replace(/\s+/g, " ")
    .trim();
}

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|org|io|xyz|ru|info|biz|link|shop|store)\b(?:\/\S*)?/i;
const EMAIL_PATTERN = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
/** 7+ digits, allowing spaces/dashes/parens between them (phone numbers). */
const PHONE_PATTERN = /(?:\d[\s().-]?){7,}/;

/**
 * Run the full content check. `message` should already be length-validated
 * (1–500 chars) by the caller, but this function is safe on any string.
 */
export function checkContent(message: string): ModerationDecision {
  const categories = new Set<ModerationCategory>();
  const reasons: string[] = [];

  const tokens = tokenize(message);
  const evasionStrings = spacedEvasionStrings(tokens);
  const text = normalizedText(message);

  // 1. Blocklist terms (normal + leet + repeat + spacing evasion).
  for (const entry of BLOCKLIST) {
    const hit =
      matchesEntry(entry, tokens) ||
      evasionStrings.some((run) => run.includes(entry.term));
    if (hit) categories.add(entry.category);
  }

  // 2. Blocked multi-word phrases.
  for (const { phrase, category } of BLOCKED_PHRASES) {
    if (text.includes(phrase)) categories.add(category);
  }

  // 3. Contact / spam signals that are structural rather than lexical.
  if (URL_PATTERN.test(message)) {
    categories.add("spam");
    reasons.push("Contains a link");
  }
  if (EMAIL_PATTERN.test(message)) {
    categories.add("contact");
    reasons.push("Contains an email address");
  }
  if (PHONE_PATTERN.test(message)) {
    categories.add("contact");
    reasons.push("Contains what looks like a phone number");
  }

  // 4. Excessive shouting (long + mostly capitals).
  const letters = message.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 20) {
    const caps = message.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > 0.7) {
      categories.add("spam");
      reasons.push("Excessive capitalisation");
    }
  }

  // Category-level reasons (kept generic; never echoes the matched slur).
  const categoryReason: Record<ModerationCategory, string> = {
    profanity: "May contain profanity",
    hate: "May contain hateful or discriminatory language",
    violence: "May contain harassing or self-harm language",
    spam: "May contain spam or promotional content",
    contact: "May contain personal contact details",
  };
  for (const category of categories) {
    const r = categoryReason[category];
    if (!reasons.includes(r)) reasons.unshift(r);
  }

  return {
    clean: categories.size === 0,
    categories: [...categories],
    reasons,
  };
}

/**
 * Translate a moderation decision + policy into the letter's initial status.
 * `pending` is the safe default: a letter is only ever `approved` at
 * submission time when the content is clean AND human review isn't forced.
 */
export function decideInitialStatus(
  decision: ModerationDecision,
  requireHumanReview: boolean,
): "approved" | "pending" {
  if (requireHumanReview) return "pending";
  return decision.clean ? "approved" : "pending";
}
