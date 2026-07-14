"use client";

import { useEffect, useState } from "react";
import type { Martyr } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
import { fetchJson } from "./api";

/** Search-and-select a martyr to write to (PRD §5.1). */
export function MartyrPicker({
  onSelect,
}: {
  onSelect: (m: Martyr) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [results, setResults] = useState<Martyr[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
    p.set("limit", "30");
    fetchJson<{ items: Martyr[] }>(`/api/martyrs?${p.toString()}`)
      .then((d) => setResults(d.items))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  return (
    <div className="stack">
      <label htmlFor="martyr-search">{t("write.chooseMartyr")}</label>
      <input
        id="martyr-search"
        type="search"
        placeholder={t("write.searchMartyr")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {loading && <span className="spinner" aria-label={t("common.loading")} />}
      <div>
        {results.map((m) => (
          <button
            key={m.id}
            type="button"
            className="picker-result"
            onClick={() => onSelect(m)}
          >
            <strong>{m.name}</strong>
            {m.gallantry_award && (
              <span className="badge badge-award" style={{ marginLeft: 8 }}>
                {m.gallantry_award}
              </span>
            )}
            <div className="muted" style={{ fontSize: "0.88rem" }}>
              {[m.rank, m.regiment, m.native_state].filter(Boolean).join(" · ")}
            </div>
          </button>
        ))}
        {!loading && results.length === 0 && (
          <p className="muted">{t("directory.noResults")}</p>
        )}
      </div>
    </div>
  );
}
