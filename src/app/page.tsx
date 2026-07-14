"use client";

import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import { LiveCounter } from "@/components/LiveCounter";
import { Gallery } from "@/components/Gallery";
import { FeaturedMessages } from "@/components/FeaturedMessages";

export default function HomePage() {
  const { t } = useI18n();
  return (
    <>
      <section className="hero">
        <h1>{t("app.name")}</h1>
        <p>{t("app.tagline")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/write" className="btn btn-primary">
            🕊️ {t("home.writeCta")}
          </Link>
          <Link href="/martyrs" className="btn btn-ghost">
            {t("home.browse")}
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="card">
          <LiveCounter />
        </div>
      </section>

      <FeaturedMessages />

      <section className="section">
        <div className="row-between">
          <h2 style={{ border: "none", margin: 0 }}>{t("home.recent")}</h2>
          <Link href="/gallery">{t("nav.gallery")} →</Link>
        </div>
        <Gallery pageSize={6} />
      </section>
    </>
  );
}
