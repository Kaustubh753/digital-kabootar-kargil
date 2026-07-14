"use client";

import { useI18n } from "@/components/LanguageProvider";
import { Gallery } from "@/components/Gallery";

export default function GalleryPage() {
  const { t } = useI18n();
  return (
    <section className="section">
      <h2>{t("gallery.title")}</h2>
      <Gallery showSearch showMartyrFilter pageSize={12} />
    </section>
  );
}
