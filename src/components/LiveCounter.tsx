"use client";

import { useEffect, useState } from "react";
import { useI18n } from "./LanguageProvider";
import { fetchJson } from "./api";

/** Running count of approved letters, polled periodically (PRD §5.8). */
export function LiveCounter({ initial = 0 }: { initial?: number }) {
  const { t } = useI18n();
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchJson<{ count: number }>("/api/letters/count")
        .then((d) => alive && setCount(d.count))
        .catch(() => {});
    load();
    const id = setInterval(load, 15_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="counter">
      <div className="n">{count.toLocaleString()}</div>
      <div className="label">{t("home.counterLabel")}</div>
    </div>
  );
}
