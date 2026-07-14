"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  LetterWithMartyr,
  ModerationStatus,
  Paginated,
} from "@/lib/types";
import type { StatsSummary } from "@/lib/letters";
import { useI18n } from "./LanguageProvider";
import { fetchJson } from "./api";

const PAGE = 25;

interface Filters {
  status: ModerationStatus | "";
  q: string;
  from: string;
  to: string;
  order: "oldest" | "newest";
}

export function AdminDashboard() {
  const { t } = useI18n();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>({
    status: "pending",
    q: "",
    from: "",
    to: "",
    order: "oldest",
  });
  const [debouncedQ, setDebouncedQ] = useState("");
  const [letters, setLetters] = useState<LetterWithMartyr[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(id);
  }, [filters.q]);

  const queryString = useCallback(
    (off: number) => {
      const p = new URLSearchParams();
      if (filters.status) p.set("status", filters.status);
      if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
      if (filters.from) p.set("from", `${filters.from}T00:00:00.000Z`);
      if (filters.to) p.set("to", `${filters.to}T23:59:59.999Z`);
      p.set("order", filters.order);
      p.set("limit", String(PAGE));
      p.set("offset", String(off));
      return p.toString();
    },
    [filters.status, filters.from, filters.to, filters.order, debouncedQ],
  );

  const load = useCallback(
    async (off: number, replace: boolean) => {
      setLoading(true);
      setError(false);
      try {
        const page = await fetchJson<Paginated<LetterWithMartyr>>(
          `/api/admin/letters?${queryString(off)}`,
        );
        setTotal(page.total);
        setOffset(off);
        setLetters((prev) => (replace ? page.items : [...prev, ...page.items]));
      } catch (err) {
        if ((err as { status?: number }).status === 401) {
          router.push("/admin/login");
          return;
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [queryString, router],
  );

  const loadStats = useCallback(() => {
    fetchJson<StatsSummary>("/api/admin/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  // Reload on filter change.
  useEffect(() => {
    setSelected(new Set());
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.from, filters.to, filters.order, debouncedQ]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const patch = (k: keyof Filters, v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) =>
      s.size === letters.length ? new Set() : new Set(letters.map((l) => l.id)),
    );
  }

  async function moderateOne(id: string, status: ModerationStatus) {
    setBusy(true);
    try {
      await fetchJson(`/api/admin/letters/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      // Remove from view if it no longer matches the status filter.
      setLetters((prev) =>
        filters.status && filters.status !== status
          ? prev.filter((l) => l.id !== id)
          : prev.map((l) =>
              l.id === id ? { ...l, moderation_status: status } : l,
            ),
      );
      setTotal((tot) =>
        filters.status && filters.status !== status ? tot - 1 : tot,
      );
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      loadStats();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function moderateBulk(status: ModerationStatus) {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      await fetchJson("/api/admin/letters/bulk", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected], status }),
      });
      setSelected(new Set());
      await load(0, true);
      loadStats();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetchJson("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  }

  const hasMore = offset + letters.length < total;

  return (
    <section className="section">
      <div className="row-between">
        <h2 style={{ border: "none", margin: 0 }}>{t("admin.title")}</h2>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          {t("admin.signOut")}
        </button>
      </div>

      {stats && (
        <div className="grid" style={{ margin: "16px 0" }}>
          <StatTile label={t("common.pending")} value={stats.totals.pending} />
          <StatTile label={t("common.approved")} value={stats.totals.approved} />
          <StatTile label={t("common.rejected")} value={stats.totals.rejected} />
          <StatTile
            label={t("admin.approvalRate")}
            value={`${Math.round(stats.approvalRate * 100)}%`}
          />
        </div>
      )}

      <div className="toolbar">
        <select
          value={filters.status}
          onChange={(e) => patch("status", e.target.value)}
          aria-label={t("admin.status")}
        >
          <option value="">{t("admin.allStatuses")}</option>
          <option value="pending">{t("common.pending")}</option>
          <option value="approved">{t("common.approved")}</option>
          <option value="rejected">{t("common.rejected")}</option>
        </select>
        <input
          className="grow"
          type="search"
          placeholder={t("gallery.search")}
          value={filters.q}
          onChange={(e) => patch("q", e.target.value)}
          aria-label={t("gallery.search")}
        />
        <input
          type="date"
          value={filters.from}
          onChange={(e) => patch("from", e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => patch("to", e.target.value)}
          aria-label="To date"
        />
        <select
          value={filters.order}
          onChange={(e) => patch("order", e.target.value)}
          aria-label="Order"
        >
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
        <a
          className="btn btn-ghost btn-sm"
          href={`/api/admin/export?${queryString(0)}`}
        >
          {t("admin.exportCsv")}
        </a>
      </div>

      <div className="toolbar">
        <button className="btn btn-sm" onClick={toggleAll}>
          {t("admin.selectAll")} ({selected.size})
        </button>
        <button
          className="btn btn-approve btn-sm"
          disabled={selected.size === 0 || busy}
          onClick={() => moderateBulk("approved")}
        >
          {t("admin.bulkApprove")}
        </button>
        <button
          className="btn btn-reject btn-sm"
          disabled={selected.size === 0 || busy}
          onClick={() => moderateBulk("rejected")}
        >
          {t("admin.bulkReject")}
        </button>
        <span className="muted">{total} total</span>
      </div>

      {error && <div className="notice notice-error">{t("common.error")}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={letters.length > 0 && selected.size === letters.length}
                  onChange={toggleAll}
                  aria-label={t("admin.selectAll")}
                />
              </th>
              <th>{t("write.selected")}</th>
              <th>{t("common.by")}</th>
              <th>{t("write.message")}</th>
              <th>{t("admin.status")}</th>
              <th>{t("admin.flaggedFor")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {letters.map((l) => (
              <tr key={l.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => toggle(l.id)}
                    aria-label={`Select letter from ${l.writer_name}`}
                  />
                </td>
                <td>
                  <Link href={`/martyrs/${l.martyr_id}`}>{l.martyr_name}</Link>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {l.created_at.slice(0, 10)}
                  </div>
                </td>
                <td>
                  {l.writer_name}
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {l.organization_name}
                  </div>
                </td>
                <td style={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                  {l.message}
                </td>
                <td>
                  <StatusBadge status={l.moderation_status} t={t} />
                </td>
                <td>
                  {l.moderation_categories.length > 0 ? (
                    <span className="muted" style={{ fontSize: "0.82rem" }}>
                      {l.moderation_categories.join(", ")}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {l.moderation_status !== "approved" && (
                      <button
                        className="btn btn-approve btn-sm"
                        disabled={busy}
                        onClick={() => moderateOne(l.id, "approved")}
                      >
                        {t("admin.approve")}
                      </button>
                    )}
                    {l.moderation_status !== "rejected" && (
                      <button
                        className="btn btn-reject btn-sm"
                        disabled={busy}
                        onClick={() => moderateOne(l.id, "rejected")}
                      >
                        {t("admin.reject")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {letters.length === 0 && !loading && (
        <p className="muted">{t("gallery.noLetters")}</p>
      )}

      <div style={{ textAlign: "center", marginTop: 16 }}>
        {loading && <span className="spinner" aria-label={t("common.loading")} />}
        {!loading && hasMore && (
          <button className="btn btn-ghost" onClick={() => load(offset + PAGE, false)}>
            {t("gallery.loadMore")}
          </button>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card" style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>
        {value}
      </div>
      <div className="muted" style={{ textTransform: "uppercase", fontSize: "0.8rem" }}>
        {label}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: ModerationStatus;
  t: (k: string) => string;
}) {
  return (
    <span className={`badge badge-${status}`}>{t(`common.${status}`)}</span>
  );
}
