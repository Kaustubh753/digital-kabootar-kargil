/**
 * Blocklist for the content-moderation pipeline.
 *
 * IMPORTANT (production): this is a representative, deliberately-small starter
 * list. Before launch it must be replaced/expanded with a comprehensive,
 * actively-maintained, and LOCALISED list covering both English and Hindi
 * (Devanagari + common romanised spellings), since the platform is bilingual
 * (PRD §5.10). Treat this file as the extension point — the matching logic in
 * `moderation.ts` does not need to change when the list grows.
 *
 * `match` semantics:
 *   - "word":      flags only when the term appears as a standalone token.
 *                  Use for short/ambiguous stems that are substrings of
 *                  innocent words (the "Scunthorpe problem": ass→class,
 *                  rape→therapist, retard→retardant).
 *   - "substring": flags when the term appears anywhere inside a token.
 *                  Use ONLY for long, unambiguous terms that do not embed in
 *                  ordinary words.
 *
 * NOTE ON WAR VOCABULARY: this is a war-memorial tribute site. Words like
 * "kill", "die", "death", "blood", "bomb", "war", "attack", "enemy",
 * "sacrifice", "fight" are EXPECTED in heartfelt letters and are intentionally
 * NOT blocked. The violence category targets interpersonal harassment and
 * self-harm phrasing only (handled as phrases in moderation.ts).
 */

export type ModerationCategory =
  | "profanity"
  | "hate"
  | "violence"
  | "spam"
  | "contact";

export interface BlockEntry {
  term: string;
  category: ModerationCategory;
  match: "word" | "substring";
}

export const BLOCKLIST: BlockEntry[] = [
  // --- profanity (unambiguous → substring) ---
  { term: "fuck", category: "profanity", match: "substring" },
  { term: "motherfucker", category: "profanity", match: "substring" },
  { term: "shit", category: "profanity", match: "substring" },
  { term: "bitch", category: "profanity", match: "substring" },
  { term: "asshole", category: "profanity", match: "substring" },
  { term: "cunt", category: "profanity", match: "substring" },
  { term: "bastard", category: "profanity", match: "substring" },
  { term: "bollocks", category: "profanity", match: "substring" },
  { term: "wanker", category: "profanity", match: "substring" },
  { term: "dickhead", category: "profanity", match: "substring" },
  { term: "slut", category: "profanity", match: "substring" },
  { term: "whore", category: "profanity", match: "substring" },

  // --- profanity (ambiguous stems → word-only, Scunthorpe-safe) ---
  { term: "ass", category: "profanity", match: "word" },
  { term: "dick", category: "profanity", match: "word" },
  { term: "piss", category: "profanity", match: "word" },
  { term: "crap", category: "profanity", match: "word" },

  // --- hate / slurs ---
  // Kept minimal here; production must use a comprehensive maintained list.
  { term: "nigger", category: "hate", match: "substring" },
  { term: "faggot", category: "hate", match: "substring" },
  { term: "retard", category: "hate", match: "word" }, // avoid "retardant"
  { term: "spastic", category: "hate", match: "word" },

  // --- spam / promotional ---
  { term: "viagra", category: "spam", match: "substring" },
  { term: "casino", category: "spam", match: "substring" },
  { term: "crypto", category: "spam", match: "substring" },
  { term: "bitcoin", category: "spam", match: "substring" },
  { term: "loan", category: "spam", match: "word" },
];

/**
 * Multi-word phrases checked against the normalised, space-joined message.
 * Targets harassment / self-harm directed language — NOT war narrative.
 */
export const BLOCKED_PHRASES: { phrase: string; category: ModerationCategory }[] =
  [
    { phrase: "kill yourself", category: "violence" },
    { phrase: "kill your self", category: "violence" },
    { phrase: "go and die", category: "violence" },
    { phrase: "you should die", category: "violence" },
    { phrase: "buy now", category: "spam" },
    { phrase: "click here", category: "spam" },
    { phrase: "free money", category: "spam" },
    { phrase: "work from home", category: "spam" },
    { phrase: "make money fast", category: "spam" },
  ];
