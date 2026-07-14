"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import { fetchJson } from "@/components/api";
import { Gallery } from "@/components/Gallery";
import type { Martyr } from "@/lib/types";

export default function MartyrProfilePage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [martyr, setMartyr] = useState<Martyr | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"about" | "letters">("about");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchJson<{ martyr: Martyr }>(`/api/martyrs/${id}`)
      .then((d) => setMartyr(d.martyr))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="section">
        <span className="spinner" aria-label={t("common.loading")} />
      </div>
    );
  }
  if (notFound || !martyr) {
    return (
      <div className="section">
        <p className="muted">{t("directory.noResults")}</p>
        <Link href="/martyrs">← {t("directory.title")}</Link>
      </div>
    );
  }

  const details: [string, string | number | null][] = [
    [t("martyr.rank"), martyr.rank],
    [t("martyr.regiment"), martyr.regiment],
    [t("martyr.state"), martyr.native_state],
    [t("martyr.age"), martyr.age_at_martyrdom],
    [t("martyr.date"), martyr.date_of_martyrdom],
    [t("martyr.award"), martyr.gallantry_award],
  ];

  return (
    <section className="section">
      <div className="card stack" style={{ marginBottom: 20 }}>
        <div className="row-between">
          <h1 style={{ margin: 0 }}>{martyr.name}</h1>
          {martyr.gallantry_award && (
            <span className="badge badge-award">{martyr.gallantry_award}</span>
          )}
        </div>
        {martyr.is_placeholder && (
          <div className="notice notice-warn">
            ⚠️ {t("martyr.placeholderWarning")}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {details
            .filter(([, v]) => v != null && v !== "")
            .map(([label, value]) => (
              <div key={label}>
                <div className="muted" style={{ fontSize: "0.8rem" }}>
                  {label}
                </div>
                <div>{value}</div>
              </div>
            ))}
        </div>
        <div>
          <Link
            href={`/write?martyr=${encodeURIComponent(martyr.id)}`}
            className="btn btn-primary"
          >
            🕊️ {t("directory.writeToThem")}
          </Link>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "about"}
          className={`tab ${tab === "about" ? "active" : ""}`}
          onClick={() => setTab("about")}
        >
          {t("martyr.about")}
        </button>
        <button
          role="tab"
          aria-selected={tab === "letters"}
          className={`tab ${tab === "letters" ? "active" : ""}`}
          onClick={() => setTab("letters")}
        >
          {t("martyr.lettersTab")}
        </button>
      </div>

      {tab === "about" ? (
        <div className="card">
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {martyr.citation || <span className="muted">—</span>}
          </p>
        </div>
      ) : (
        <Gallery martyrId={martyr.id} pageSize={12} />
      )}
    </section>
  );
}
