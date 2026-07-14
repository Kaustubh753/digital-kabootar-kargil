"use client";

import Link from "next/link";
import { useI18n } from "./LanguageProvider";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container row-between">
        <span>
          🕊️ {t("app.name")} — {t("app.tagline")}
        </span>
        <Link href="/admin">{t("nav.admin")}</Link>
      </div>
    </footer>
  );
}
