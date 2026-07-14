"use client";

import Link from "next/link";
import { useI18n } from "./LanguageProvider";
import { COPYRIGHT_NOTICE } from "@/lib/campaign";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container stack" style={{ gap: 8 }}>
        <div className="row-between">
          <span>
            {t("app.name")} — {t("app.tagline")}
          </span>
          <Link href="/admin">{t("nav.admin")}</Link>
        </div>
        {/* 2.1 Footer Notice — site-wide (Veer Vandan campaign). */}
        <small style={{ opacity: 0.85 }}>{COPYRIGHT_NOTICE}</small>
      </div>
    </footer>
  );
}
