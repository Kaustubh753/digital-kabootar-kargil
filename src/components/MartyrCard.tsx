"use client";

import Link from "next/link";
import type { Martyr } from "@/lib/types";
import { useI18n } from "./LanguageProvider";

export function MartyrCard({ martyr }: { martyr: Martyr }) {
  const { t } = useI18n();
  return (
    <div className="card stack">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>{martyr.name}</h3>
        {martyr.gallantry_award && (
          <span className="badge badge-award">{martyr.gallantry_award}</span>
        )}
      </div>
      <div className="muted" style={{ fontSize: "0.9rem" }}>
        {[martyr.rank, martyr.regiment, martyr.native_state]
          .filter(Boolean)
          .join(" · ")}
      </div>
      {martyr.is_placeholder && (
        <span className="badge badge-placeholder">
          {t("martyr.placeholderWarning")}
        </span>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <Link href={`/martyrs/${martyr.id}`} className="btn btn-ghost btn-sm">
          {t("directory.viewProfile")}
        </Link>
        <Link
          href={`/write?martyr=${encodeURIComponent(martyr.id)}`}
          className="btn btn-primary btn-sm"
        >
          {t("directory.writeToThem")}
        </Link>
      </div>
    </div>
  );
}
