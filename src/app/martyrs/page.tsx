"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";
import { fetchJson } from "@/components/api";
import { MartyrCard } from "@/components/MartyrCard";
import type { Martyr } from "@/lib/types";

export default function DirectoryPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Martyr[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const p = new URLSearchParams();
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
    if (state) p.set("state", state);
    p.set("limit", "200");
    fetchJson<{ items: Martyr[]; states: string[] }>(
      `/api/martyrs?${p.toString()}`,
    )
      .then((d) => {
        setItems(d.items);
        // Keep the full state list stable (don't shrink as filters narrow).
        setStates((prev) => (prev.length ? prev : d.states));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [debouncedQ, state]);

  return (
    <section className="section">
      <h2>{t("directory.title")}</h2>
      <div className="toolbar">
        <input
          className="grow"
          type="search"
          placeholder={t("write.searchMartyr")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("directory.search")}
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          aria-label={t("directory.filterState")}
        >
          <option value="">{t("directory.allStates")}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="notice notice-error">{t("common.error")}</div>}
      {loading ? (
        <span className="spinner" aria-label={t("common.loading")} />
      ) : items.length === 0 ? (
        <p className="muted">{t("directory.noResults")}</p>
      ) : (
        <div className="grid">
          {items.map((m) => (
            <MartyrCard key={m.id} martyr={m} />
          ))}
        </div>
      )}
    </section>
  );
}
