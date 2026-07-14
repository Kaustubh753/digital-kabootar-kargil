"use client";

import { useI18n } from "./LanguageProvider";
import { COPYRIGHT_NOTICE } from "@/lib/campaign";

export function SiteFooter() {
  const { t } = useI18n();
  // The admin entry point is intentionally not linked in the public UI —
  // moderators navigate to /admin directly (it is auth-gated).
  return (
    <footer className="site-footer">
      <div className="container stack" style={{ gap: 8 }}>
        <span>
          {t("app.name")} — {t("app.tagline")}
        </span>
        {/* 2.1 Footer Notice — site-wide (Veer Vandan campaign). */}
        <small style={{ opacity: 0.85 }}>{COPYRIGHT_NOTICE}</small>
      </div>
    </footer>
  );
}
