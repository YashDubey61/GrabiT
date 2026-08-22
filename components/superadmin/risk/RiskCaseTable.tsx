"use client";

import type { RiskCaseItem } from "@/lib/supabase/superadmin_risk";

interface RiskCaseTableProps {
  cases: RiskCaseItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectCase: (caseItem: RiskCaseItem) => void;
  isLoading?: boolean;
}

export function RiskCaseTable({
  cases,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectCase,
  isLoading = false,
}: RiskCaseTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-border/40 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full bg-border/20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">
          security
        </span>
        <h3 className="font-display text-body font-bold text-foreground mb-1">
          No Risk Cases Triggered
        </h3>
        <p className="font-display text-caption text-muted max-w-sm">
          No risk investigation cases matched your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Dense Table */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm">
        <table className="w-full text-left text-caption">
          <thead className="border-b border-border bg-background/50 font-display text-[11px] font-bold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Target Entity</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Signals</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {cases.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-background/40">
                {/* Case ID */}
                <td className="px-4 py-3.5 font-display font-extrabold text-foreground whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="hover:text-primary transition-colors"
                  >
                    {c.caseNumber}
                  </button>
                </td>

                {/* Target Entity */}
                <td className="px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="font-display text-body-sm font-bold text-foreground truncate">
                      {c.entityName}
                    </div>
                    <div className="font-display text-[11px] text-muted uppercase tracking-wider">
                      {c.entityType} • {c.campusName || "All Campuses"}
                    </div>
                  </div>
                </td>

                {/* Risk Level Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold ${
                      c.riskLevel === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : c.riskLevel === "HIGH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : c.riskLevel === "MEDIUM"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {c.riskLevel === "CRITICAL" ? "warning" : "shield"}
                    </span>
                    {c.riskLevel}
                  </span>
                </td>

                {/* Risk Score */}
                <td className="px-4 py-3.5 font-display font-extrabold text-foreground">
                  <span className="text-body-sm">{c.riskScore}</span>
                  <span className="text-muted text-[11px]">/100</span>
                </td>

                {/* Signals Count */}
                <td className="px-4 py-3.5 font-display text-muted text-caption">
                  {c.signals.length} signal{c.signals.length !== 1 ? "s" : ""}
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold capitalize ${
                      c.status === "RESOLVED"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : c.status === "DISMISSED"
                          ? "bg-muted/10 text-muted border border-border"
                          : c.status === "INVESTIGATING"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>

                {/* Created Date */}
                <td className="px-4 py-3.5 font-display text-muted text-[11px] whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="inline-flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>Investigate</span>
                    <span className="material-symbols-outlined text-[16px]">travel_explore</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Risk Case Cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {cases.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-display text-[11px] font-extrabold text-muted uppercase">
                  {c.caseNumber} • {c.entityType}
                </span>
                <h4 className="font-display text-body-sm font-bold text-foreground">
                  {c.entityName}
                </h4>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold ${
                  c.riskLevel === "CRITICAL"
                    ? "bg-rose-500/10 text-rose-400"
                    : c.riskLevel === "HIGH"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {c.riskLevel} ({c.riskScore})
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-display text-muted border-t border-border/60 pt-2">
              <span>Signals: <strong className="text-foreground">{c.signals.length}</strong></span>
              <span>Status: <strong className="text-foreground">{c.status}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => onSelectCase(c)}
              className="w-full rounded-xl bg-primary py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
            >
              Investigate Risk Case
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4 px-1">
        <span className="font-display text-caption text-muted">
          Showing {cases.length} of {totalCount} cases (Page {currentPage} of {totalPages})
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground disabled:opacity-40 disabled:pointer-events-none hover:border-primary/40 transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground disabled:opacity-40 disabled:pointer-events-none hover:border-primary/40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
