import React, { useState, useMemo } from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status) {
  switch (status) {
    case "Submitted":
      return {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-200 dark:border-emerald-500/30",
        text: "text-emerald-700 dark:text-emerald-400",
        dot: "bg-emerald-500",
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case "Late Submission":
      return {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-200 dark:border-amber-500/30",
        text: "text-amber-700 dark:text-amber-400",
        dot: "bg-amber-500",
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    default:
      return {
        bg: "bg-red-50 dark:bg-red-500/10",
        border: "border-red-200 dark:border-red-500/30",
        text: "text-red-600 dark:text-red-400",
        dot: "bg-red-500",
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}

function formatDateTime(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "Asia/Manila",
    }).format(date);
  } catch {
    return null;
  }
}

function LguAvatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const hue = (name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow"
      style={{ background: `hsl(${hue}, 65%, 48%)` }}
    >
      {initials || "?"}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QrrpaList({ records = [], loading }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");

  const filtered = useMemo(() => {
    let list = [...records];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.lguId?.name || "").toLowerCase().includes(q) ||
          (r.period || "").toLowerCase().includes(q) ||
          (r.lguId?.province || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      list = list.filter((r) => (r.status || "Not Submitted") === statusFilter);
    }

    switch (sortBy) {
      case "date_desc":
        list.sort((a, b) => new Date(b.dateSubmitted || 0) - new Date(a.dateSubmitted || 0));
        break;
      case "date_asc":
        list.sort((a, b) => new Date(a.dateSubmitted || 0) - new Date(b.dateSubmitted || 0));
        break;
      case "name_asc":
        list.sort((a, b) => (a.lguId?.name || "").localeCompare(b.lguId?.name || ""));
        break;
      case "name_desc":
        list.sort((a, b) => (b.lguId?.name || "").localeCompare(a.lguId?.name || ""));
        break;
      default:
        break;
    }

    return list;
  }, [records, search, statusFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search LGU, province, period…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-9 bg-base-100 text-sm"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered bg-base-100 text-sm w-full sm:w-44"
        >
          <option value="All">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Not Submitted">Not Submitted</option>
          <option value="Late Submission">Late Submission</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="select select-bordered bg-base-100 text-sm w-full sm:w-44"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="name_asc">Name A→Z</option>
          <option value="name_desc">Name Z→A</option>
        </select>
      </div>

      {/* ── Count ── */}
      <div className="text-xs text-base-content/50 font-medium">
        Showing <span className="text-base-content font-semibold">{filtered.length}</span> of{" "}
        <span className="text-base-content font-semibold">{records.length}</span> records
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm text-base-content/50 font-medium">Loading records…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-content/40">
          <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="font-semibold text-sm">No records found</p>
          <p className="text-xs">Try changing your search or filter settings</p>
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-base-300">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/60 text-base-content/70 text-xs uppercase tracking-wide">
                  <th className="font-bold py-3">LGU</th>
                  <th className="font-bold py-3 text-center">Period</th>
                  <th className="font-bold py-3 text-center">Status</th>
                  <th className="font-bold py-3 text-center">Date Submitted</th>
                  <th className="font-bold py-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const style = getStatusStyle(record.status);
                  const dateStr = formatDateTime(record.dateSubmitted);
                  const lguName = record.lguId?.name || (typeof record.lguId === "string" ? record.lguId : "—");

                  return (
                    <tr
                      key={record._id || Math.random()}
                      className="border-b border-base-200/50 hover:bg-base-200/30 transition-colors"
                    >
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <LguAvatar name={lguName} />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-base-content truncate">{lguName}</p>
                            {record.lguId?.province && (
                              <p className="text-xs text-base-content/50 truncate">{record.lguId.province}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="badge badge-outline badge-primary font-mono text-xs px-3">
                          {record.period || "—"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.border} ${style.text}`}
                        >
                          {style.icon}
                          {record.status || "Not Submitted"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {dateStr ? (
                          <span className="text-xs text-base-content/80 font-medium">{dateStr}</span>
                        ) : (
                          <span className="text-xs text-base-content/30 italic">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 max-w-[200px]">
                        {record.description ? (
                          <span className="text-xs text-base-content/70 line-clamp-2">{record.description}</span>
                        ) : (
                          <span className="text-xs text-base-content/30 italic">No description</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((record) => {
              const style = getStatusStyle(record.status);
              const dateStr = formatDateTime(record.dateSubmitted);
              const lguName = record.lguId?.name || (typeof record.lguId === "string" ? record.lguId : "—");

              return (
                <div
                  key={record._id || Math.random()}
                  className="rounded-xl border border-base-300 bg-base-100 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <LguAvatar name={lguName} />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-base-content truncate">{lguName}</p>
                        {record.lguId?.province && (
                          <p className="text-xs text-base-content/50">{record.lguId.province}</p>
                        )}
                      </div>
                    </div>
                    <span className="badge badge-outline badge-primary font-mono text-xs shrink-0">
                      {record.period || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.border} ${style.text}`}
                    >
                      {style.icon}
                      {record.status || "Not Submitted"}
                    </span>
                    {dateStr ? (
                      <span className="text-base-content/60">{dateStr}</span>
                    ) : (
                      <span className="text-base-content/30 italic">No date</span>
                    )}
                  </div>

                  {record.description && (
                    <p className="text-xs text-base-content/60 border-t border-base-200 pt-2">{record.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
