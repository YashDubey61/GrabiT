"use client";

import type { VendorApplicationItem } from "@/lib/supabase/superadmin_vendor_applications";

interface VendorApplicationTableProps {
  applications: VendorApplicationItem[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectApplication: (app: VendorApplicationItem) => void;
  isLoading?: boolean;
}

export function VendorApplicationTable({
  applications,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSelectApplication,
  isLoading = false,
}: VendorApplicationTableProps) {
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

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-elevated p-12 text-center">
        <span className="material-symbols-outlined text-[48px] text-muted mb-3">
          assignment_late
        </span>
        <h3 className="font-display text-body font-bold text-foreground mb-1">
          No Applications Found
        </h3>
        <p className="font-display text-caption text-muted max-w-sm">
          No vendor onboarding applications matched your search or filter criteria.
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
              <th className="px-4 py-3">Vendor / Manager</th>
              <th className="px-4 py-3">Campus</th>
              <th className="px-4 py-3">App Status</th>
              <th className="px-4 py-3">KYC Status</th>
              <th className="px-4 py-3">Vendor Status</th>
              <th className="px-4 py-3">Applied</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {applications.map((app) => (
              <tr key={app.id} className="transition-colors hover:bg-background/40">
                {/* Vendor / Manager */}
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app)}
                    className="flex items-center gap-3 text-left group"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border bg-background flex items-center justify-center font-bold text-primary">
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-body-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {app.vendorName}
                      </div>
                      <div className="font-display text-[11px] text-muted truncate">
                        {app.ownerName} • {app.phone}
                      </div>
                    </div>
                  </button>
                </td>

                {/* Campus */}
                <td className="px-4 py-3.5 font-display text-muted">
                  <span className="truncate block">{app.campusName || "Main Campus"}</span>
                </td>

                {/* Application Status Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold capitalize ${
                      app.applicationStatus === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : app.applicationStatus === "rejected"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : app.applicationStatus === "under_review"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {app.applicationStatus.replace("_", " ")}
                  </span>
                </td>

                {/* KYC Status Badge */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold capitalize ${
                      app.kycStatus === "verified"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : app.kycStatus === "rejected"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {app.kycStatus === "verified" ? "verified" : "badge"}
                    </span>
                    {app.kycStatus}
                  </span>
                </td>

                {/* Vendor Status */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-display text-[11px] font-extrabold capitalize ${
                      app.vendorStatus === "suspended"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {app.vendorStatus}
                  </span>
                </td>

                {/* Applied Date */}
                <td className="px-4 py-3.5 font-display text-muted text-[11px] whitespace-nowrap">
                  {new Date(app.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>

                {/* Action Button */}
                <td className="px-4 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app)}
                    className="inline-flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>Review Application</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Vendor Application Cards */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {applications.map((app) => (
          <div
            key={app.id}
            className="rounded-2xl border border-border bg-surface-elevated p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-display text-body-sm font-bold text-foreground">
                  {app.vendorName}
                </h4>
                <p className="font-display text-caption text-muted">
                  {app.ownerName} • {app.campusName}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display text-[10px] font-extrabold capitalize ${
                  app.applicationStatus === "approved"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : app.applicationStatus === "rejected"
                      ? "bg-rose-500/10 text-rose-400"
                      : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {app.applicationStatus.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-display text-muted border-t border-border/60 pt-2">
              <span>KYC: <strong className="text-foreground capitalize">{app.kycStatus}</strong></span>
              <span>Status: <strong className="text-foreground capitalize">{app.vendorStatus}</strong></span>
            </div>

            <button
              type="button"
              onClick={() => onSelectApplication(app)}
              className="w-full rounded-xl bg-primary py-2 font-display text-caption font-bold text-on-primary hover:bg-primary-hover transition-colors"
            >
              Review Application & KYC
            </button>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4 px-1">
        <span className="font-display text-caption text-muted">
          Showing {applications.length} of {totalCount} applications (Page {currentPage} of {totalPages})
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
