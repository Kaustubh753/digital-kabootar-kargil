"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";
import { fetchJson } from "@/components/api";

export default function AdminLoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const status = (err as { status?: number }).status;
      setError(
        status === 429
          ? "Too many attempts. Please wait and try again."
          : "Incorrect password.",
      );
      setBusy(false);
    }
  }

  return (
    <section className="section" style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>{t("admin.login")}</h2>
      <form onSubmit={onSubmit} className="card stack">
        <div className="field">
          <label htmlFor="password">{t("admin.password")}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "…" : t("admin.signIn")}
        </button>
      </form>
    </section>
  );
}
