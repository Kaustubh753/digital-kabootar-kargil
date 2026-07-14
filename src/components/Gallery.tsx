"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Martyr, Paginated, PublicLetter } from "@/lib/types";
import { useI18n } from "./LanguageProvider";
import { fetchJson } from "./api";
import { Postcard } from "./Postcard";

interface GalleryProps {
  /** Fix the gallery to one martyr (used on the profile letters tab). */
  martyrId?: string;
  showSearch?: boolean;
  showMartyrFilter?: boolean;
  pageSize?: number;
}

export function Gallery({
  martyrId,
  showSearch = false,
  showMartyrFilter = false,
  pageSize = 12,
}: GalleryProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<PublicLetter[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [martyrFilter, setMartyrFilter] = useState("");
  const [martyrs, setMartyrs] = useState<Martyr[]>([]);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Load martyrs for the filter dropdown.
  useEffect(() => {
    if (!showMartyrFilter) return;
    fetchJson<{ items: Martyr[] }>("/api/martyrs?limit=200")
      .then((d) => setMartyrs(d.items))
      .catch(() => {});
  }, [showMartyrFilter]);

  const effectiveMartyr = martyrId ?? (martyrFilter || undefined);

  const buildUrl = useCallback(
    (cur: string | null) => {
      const p = new URLSearchParams();
      p.set("limit", String(pageSize));
      if (effectiveMartyr) p.set("martyrId", effectiveMartyr);
      if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
      if (cur) p.set("cursor", cur);
      return `/api/letters?${p.toString()}`;
    },
    [effectiveMartyr, debouncedQ, pageSize],
  );

  const loadPage = useCallback(
    async (cur: string | null, replace: boolean) => {
      setLoading(true);
      setError(false);
      try {
        const page = await fetchJson<Paginated<PublicLetter>>(buildUrl(cur));
        setTotal(page.total);
        setCursor(page.nextCursor);
        setDone(page.nextCursor === null);
        setItems((prev) => (replace ? page.items : [...prev, ...page.items]));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl],
  );

  // Reset & reload whenever filters change.
  useEffect(() => {
    setItems([]);
    setCursor(null);
    setDone(false);
    loadPage(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMartyr, debouncedQ]);

  // Infinite scroll via sentinel.
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !done && cursor) {
          loadPage(cursor, false);
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, loading, done, loadPage]);

  return (
    <div>
      {(showSearch || showMartyrFilter) && (
        <div className="toolbar">
          {showSearch && (
            <input
              className="grow"
              type="search"
              placeholder={t("gallery.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t("gallery.search")}
            />
          )}
          {showMartyrFilter && (
            <select
              value={martyrFilter}
              onChange={(e) => setMartyrFilter(e.target.value)}
              aria-label={t("gallery.filterMartyr")}
            >
              <option value="">{t("gallery.allMartyrs")}</option>
              {martyrs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && <div className="notice notice-error">{t("common.error")}</div>}

      {items.length === 0 && !loading && !error ? (
        <p className="muted">
          {martyrId ? t("martyr.noLetters") : t("gallery.noLetters")}
        </p>
      ) : (
        <div className="grid">
          {items.map((l) => (
            <Postcard key={l.id} letter={l} />
          ))}
        </div>
      )}

      <div
        ref={sentinel}
        style={{ height: 1 }}
        aria-hidden
      />

      <div style={{ textAlign: "center", marginTop: 20 }}>
        {loading && <span className="spinner" aria-label={t("common.loading")} />}
        {!loading && !done && cursor && (
          <button className="btn btn-ghost" onClick={() => loadPage(cursor, false)}>
            {t("gallery.loadMore")}
          </button>
        )}
      </div>
    </div>
  );
}
