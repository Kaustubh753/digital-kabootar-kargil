"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";
import { fetchJson } from "@/components/api";
import { MartyrPicker } from "@/components/MartyrPicker";
import { LetterForm } from "@/components/LetterForm";
import type { Martyr } from "@/lib/types";

function WriteInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const preId = searchParams.get("martyr");
  const [martyr, setMartyr] = useState<Martyr | null>(null);
  const [loadingPre, setLoadingPre] = useState(!!preId);

  useEffect(() => {
    if (!preId) return;
    setLoadingPre(true);
    fetchJson<{ martyr: Martyr }>(`/api/martyrs/${preId}`)
      .then((d) => setMartyr(d.martyr))
      .catch(() => setMartyr(null))
      .finally(() => setLoadingPre(false));
  }, [preId]);

  return (
    <section className="section">
      <h2>{t("write.title")}</h2>

      {loadingPre ? (
        <span className="spinner" aria-label={t("common.loading")} />
      ) : martyr ? (
        <>
          <div className="card row-between" style={{ marginBottom: 16 }}>
            <div>
              <div className="muted" style={{ fontSize: "0.8rem" }}>
                {t("write.selected")}
              </div>
              <strong>{martyr.name}</strong>{" "}
              {martyr.gallantry_award && (
                <span className="badge badge-award">{martyr.gallantry_award}</span>
              )}
              <div className="muted" style={{ fontSize: "0.88rem" }}>
                {[martyr.rank, martyr.regiment, martyr.native_state]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setMartyr(null)}
            >
              {t("write.change")}
            </button>
          </div>
          {martyr.is_placeholder && (
            <div className="notice notice-warn" style={{ marginBottom: 16 }}>
              ⚠️ {t("martyr.placeholderWarning")}
            </div>
          )}
          <LetterForm martyr={martyr} />
        </>
      ) : (
        <MartyrPicker onSelect={setMartyr} />
      )}
    </section>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="section" />}>
      <WriteInner />
    </Suspense>
  );
}
