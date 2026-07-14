/**
 * Shared domain types. Types are erased at compile time, so this module is safe
 * to import from both server and client code.
 */

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface Martyr {
  id: string;
  name: string;
  rank: string | null;
  regiment: string | null;
  native_state: string | null;
  age_at_martyrdom: number | null;
  date_of_martyrdom: string | null;
  gallantry_award: string | null;
  citation: string | null;
  photo: string | null;
  is_placeholder: boolean;
}

export interface Letter {
  id: string;
  writer_name: string;
  organization_name: string;
  age: number | null;
  email: string | null;
  message: string;
  martyr_id: string;
  writer_state: string | null;
  moderation_status: ModerationStatus;
  moderation_categories: string[];
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
}

/** A letter joined with its martyr's display fields, for gallery/admin views. */
export interface LetterWithMartyr extends Letter {
  martyr_name: string;
}

/** Public-facing shape of a letter (never leaks email or IP). */
export interface PublicLetter {
  id: string;
  writer_name: string;
  organization_name: string;
  message: string;
  martyr_id: string;
  martyr_name: string;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  total: number;
}
