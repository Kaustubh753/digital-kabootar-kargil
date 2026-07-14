"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Martyr } from "@/lib/types";
import { checkContent } from "@/lib/moderation";
import {
  letterSubmissionSchema,
  fieldErrors,
  HONEYPOT_FIELD,
  MESSAGE_MAX,
} from "@/lib/validation";
import { useI18n } from "./LanguageProvider";
import { fetchJson } from "./api";
import { SendAnimation } from "./SendAnimation";

interface SubmitResult {
  id: string | null;
  status: "approved" | "pending";
  autoApproved: boolean;
  reasons: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function LetterForm({ martyr }: { martyr: Martyr }) {
  const { t } = useI18n();
  const [fields, setFields] = useState({
    writer_name: "",
    organization_name: "",
    age: "",
    email: "",
    writer_state: "",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const set = (k: keyof typeof fields, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  const remaining = MESSAGE_MAX - fields.message.length;

  // Client-side advisory check — instant warning, server stays authoritative.
  const advisory = useMemo(() => {
    const msg = fields.message.trim();
    if (!msg) return null;
    const d = checkContent(msg);
    return d.clean ? null : d;
  }, [fields.message]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setErrors({});

    const payload = {
      ...fields,
      martyr_id: martyr.id,
    };
    const parsed = letterSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setPhase("sending");
    const postP = fetchJson<SubmitResult>("/api/letters", {
      method: "POST",
      body: JSON.stringify({ ...payload, [HONEYPOT_FIELD]: honeypot }),
    })
      .then((data) => ({ ok: true as const, data }))
      .catch((err) => ({ ok: false as const, err }));

    // Let the send animation play for its full duration regardless of latency.
    const [outcome] = await Promise.all([postP, sleep(1700)]);

    if (outcome.ok) {
      setResult(outcome.data);
      setPhase("done");
      return;
    }

    const err = outcome.err as { status?: number; body?: { fields?: Record<string, string> } };
    setPhase("form");
    if (err.status === 429) {
      setSubmitError(
        "You're sending letters too quickly. Please wait a moment and try again.",
      );
    } else if (err.status === 400 && err.body?.fields) {
      setErrors(err.body.fields);
    } else {
      setSubmitError(t("common.error"));
    }
  }

  function reset() {
    setFields({
      writer_name: "",
      organization_name: "",
      age: "",
      email: "",
      writer_state: "",
      message: "",
    });
    setHoneypot("");
    setResult(null);
    setErrors({});
    setSubmitError(null);
    setPhase("form");
  }

  if (phase === "done" && result) {
    const approved = result.autoApproved;
    return (
      <div
        className={`notice ${approved ? "notice-success" : "notice-warn"}`}
        role="status"
      >
        <p style={{ marginTop: 0 }}>
          {approved ? t("write.successApproved") : t("write.successPending")}
        </p>
        {!approved && result.reasons.length > 0 && (
          <ul>
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {approved && (
            <Link href={`/martyrs/${martyr.id}`} className="btn btn-primary btn-sm">
              {t("martyr.lettersTab")}
            </Link>
          )}
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            {t("home.writeCta")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {phase === "sending" && <SendAnimation />}

      <div className="field">
        <label htmlFor="message">
          {t("write.message")}{" "}
          <span className="muted">({martyr.name})</span>
        </label>
        <textarea
          id="message"
          value={fields.message}
          maxLength={MESSAGE_MAX}
          onChange={(e) => set("message", e.target.value)}
          placeholder={t("write.messagePlaceholder")}
          aria-describedby="char-counter"
          required
        />
        <div
          id="char-counter"
          className={`char-counter ${remaining < 40 ? "warn" : ""}`}
          aria-live="polite"
        >
          {remaining} {t("write.charsLeft")}
        </div>
        {errors.message && <div className="field-error">{errors.message}</div>}
        {advisory && (
          <div className="notice notice-warn" style={{ marginTop: 8 }} role="alert">
            {advisory.reasons.join(" · ")}
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <div className="field">
          <label htmlFor="writer_name">{t("write.writerName")}</label>
          <input
            id="writer_name"
            value={fields.writer_name}
            onChange={(e) => set("writer_name", e.target.value)}
            required
          />
          {errors.writer_name && (
            <div className="field-error">{errors.writer_name}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="organization_name">{t("write.organization")}</label>
          <input
            id="organization_name"
            value={fields.organization_name}
            onChange={(e) => set("organization_name", e.target.value)}
            required
          />
          {errors.organization_name && (
            <div className="field-error">{errors.organization_name}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="age">
            {t("write.age")} <span className="optional">({t("write.optional")})</span>
          </label>
          <input
            id="age"
            type="number"
            min={1}
            max={120}
            value={fields.age}
            onChange={(e) => set("age", e.target.value)}
          />
          {errors.age && <div className="field-error">{errors.age}</div>}
        </div>
        <div className="field">
          <label htmlFor="email">
            {t("write.email")}{" "}
            <span className="optional">({t("write.optional")})</span>
          </label>
          <input
            id="email"
            type="email"
            value={fields.email}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        <div className="field">
          <label htmlFor="writer_state">
            {t("write.writerState")}{" "}
            <span className="optional">({t("write.optional")})</span>
          </label>
          <input
            id="writer_state"
            value={fields.writer_state}
            onChange={(e) => set("writer_state", e.target.value)}
          />
        </div>
      </div>

      {/* Honeypot: hidden from users & assistive tech; bots that fill it are dropped. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "auto" }}
      >
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input
          id={HONEYPOT_FIELD}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {submitError && (
        <div className="notice notice-error" role="alert" style={{ marginBottom: 12 }}>
          {submitError}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={phase === "sending"}
      >
        {phase === "sending" ? t("write.sending") : `🕊️ ${t("write.submit")}`}
      </button>
    </form>
  );
}
