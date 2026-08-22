"use client";

import type { DisputeItem } from "@/lib/supabase/superadmin_disputes";

interface DisputeTableProps {
  disputes: DisputeItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectDispute: (dispute: DisputeItem) => void;
  isLoading?: boolean;
}

export function DisputeTable({
  disputes,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectDispute,
  isLoading = false,
}: DisputeTableProps) {
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

  if (disputes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">
          support_agent
        </span>
        <h3 className="font-display text-body font-bold text-foreground mb-1">
          No Disputes Found
        </h3>
        <p className="font-display text-caption text-muted max-w-sm">
          No customer complaints or refund requests matched your search or filter criteria.
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
              <th className="px-4 py-3">Dispute ID</th>
              <th className="px-4 py-3">Order / Customer</th>
              <th className="px-4 py-3">Vendor / Campus</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {disputes.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-background/40">
                {/* Dispute ID */}
                <td className="px-4 py-3.5 font-display font-extrabold text-foreground whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectDispute(d)}
                    className="hover:text-primary transition-colors"
                  >
                    {d.disputeNumber}
                  </button>
                </td>

                {/* Order / Customer */}
                <td className="px-4 py-3.5">
                  <div className="min-w-0">
                    <div className="font-display text-body-sm font-bold text-foreground truncate">
                      {d.orderNumber || d.orderId}
                    </div>
                    <div className="font-display text-[11px] text-muted truncate">
                      {d.userName || "Customer"}
                    </div>
                  </div>
                </td>

                {/* Vendor / Campus */}
                <td className="px-4 py-3.5">
                  <div className="min-w-0 font-display">
                    <div className="text-foreground text-caption truncate">{d.canteenName}</div>
                    <div className="text-[11px] text-muted truncate">{d.campusName}</div>
                  </div>
                </td>

                {/* Dispute Type */}
                <td className="px-4 py-3.5 font-display text-muted text-caption">
                  <span className="truncate block font-bold text-foreground">
                    {d.disputeType.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Dispute Amount */}
                <td className="px-4 py-3.5 font-display font-extrabold text-foreground whitespace-nowrap">
                  ₹{d.disputeAmount}
                </td>

                {/* Priority Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold ${
                      d.priority === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : d.priority === "HIGH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : d.priority === "MEDIUM"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {d.priority}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold capitalize ${
                      d.status === "RESOLVED"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : d.status === "REFUND_APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : d.status === "UNDER_REVIEW"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {d.status.replace(/_/g, " ")}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectDispute(d)}
                    className="inline-flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>Investigate</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Dispute Cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {disputes.map((d) => (
          <div
            key={d.id}
            className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-display text-[11px] font-extrabold text-muted uppercase">
                  {d.disputeNumber} • {d.orderNumber || d.orderId}
                </span>
                <h4 className="font-display text-body-sm font-bold text-foreground">
                  {d.userName || "Customer"} — ₹{d.disputeAmount}
                </h4>
                <p className="font-display text-caption text-muted">
                  {d.canteenName} • {d.campusName}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold ${
                  d.priority === "CRITICAL"
                    ? "bg-rose-500/10 text-rose-400"
                    : d.priority === "HIGH"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {d.priority}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-display text-muted border-t border-border/60 pt-2">
              <span>Type: <strong className="text-foreground">{d.disputeType.replace(/_/g, " ")}</strong></span>
              <span>Status: <strong className="text-foreground">{d.status.replace(/_/g, " ")}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => onSelectDispute(d)}
              className="w-full rounded-xl bg-primary py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
            >
              Investigate Dispute & Refund
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4 px-1">
        <span className="font-display text-caption text-muted">
          Showing {disputes.length} of {totalCount} disputes (Page {currentPage} of {totalPages})
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
