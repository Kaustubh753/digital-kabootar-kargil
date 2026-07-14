"use client";

import { useEffect } from "react";
import { useI18n } from "./LanguageProvider";

/**
 * Short (<2s) send animation (PRD §5.7). Pure CSS "carrier pigeon takes flight",
 * no third-party embed. If a sound is desired, drop a short clip at
 * /public/send.mp3 and uncomment the audio block — the flow never depends on it.
 */
export function SendAnimation({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    if (!onDone) return;
    const id = setTimeout(onDone, 1700);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="send-anim" role="status" aria-live="polite">
      <div className="kabootar" aria-hidden>
        🕊️
      </div>
      <span className="sr-only">{t("write.sending")}</span>
    </div>
  );
}
