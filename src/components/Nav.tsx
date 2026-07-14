"use client";

import Link from "next/link";
import { useI18n } from "./LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";

export function Nav() {
  const { t } = useI18n();
  return (
    <header className="site-header">
      <div className="container row">
        <Link href="/" className="brand">
          {t("app.name")}
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/">{t("nav.home")}</Link>
          <Link href="/write">{t("nav.write")}</Link>
          <Link href="/martyrs">{t("nav.directory")}</Link>
          <Link href="/gallery">{t("nav.gallery")}</Link>
        </nav>
        <span className="nav-spacer" />
        <LanguageToggle />
      </div>
    </header>
  );
}
