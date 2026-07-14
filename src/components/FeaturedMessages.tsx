"use client";

import { FEATURED_MESSAGES } from "@/lib/campaign";
import { useI18n } from "./LanguageProvider";

/**
 * The five official "To our heroes" tribute messages from the Veer Vandan
 * campaign, shown as a curated featured set (distinct from citizen-submitted,
 * martyr-addressed letters).
 */
export function FeaturedMessages() {
  const { t } = useI18n();
  return (
    <section className="section">
      <h2>{t("home.featuredTitle")}</h2>
      <div className="grid">
        {FEATURED_MESSAGES.map((msg, i) => (
          <blockquote key={i} className="postcard" style={{ cursor: "default" }}>
            <span className="to">{t("featured.eyebrow")}</span>
            <span className="message" style={{ fontStyle: "italic" }}>
              {msg}
            </span>
            <span className="from">— {t("app.name")}</span>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
