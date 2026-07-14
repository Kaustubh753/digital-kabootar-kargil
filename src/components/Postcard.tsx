"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicLetter } from "@/lib/types";
import { useI18n } from "./LanguageProvider";

function formatDate(iso: string): string {
  // Deterministic, locale-light formatting to avoid hydration mismatch.
  return iso.slice(0, 10);
}

export function Postcard({ letter }: { letter: PublicLetter }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="postcard"
        onClick={() => setOpen(true)}
        aria-label={`Letter from ${letter.writer_name} to ${letter.martyr_name}`}
      >
        <span className="to">
          {t("write.selected")}: {letter.martyr_name}
        </span>
        <span className="message clamp-4">{letter.message}</span>
        <span className="from">
          — {letter.writer_name}
          {letter.organization_name ? `, ${letter.organization_name}` : ""}
        </span>
      </button>

      {open && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row-between" style={{ marginBottom: 12 }}>
              <span className="to">
                {t("write.selected")}:{" "}
                <Link href={`/martyrs/${letter.martyr_id}`}>
                  {letter.martyr_name}
                </Link>
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="message" style={{ whiteSpace: "pre-wrap" }}>
              {letter.message}
            </p>
            <p className="from" style={{ marginTop: 16 }}>
              — {letter.writer_name}
              {letter.organization_name ? `, ${letter.organization_name}` : ""}
              <br />
              <span className="muted">{formatDate(letter.created_at)}</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
