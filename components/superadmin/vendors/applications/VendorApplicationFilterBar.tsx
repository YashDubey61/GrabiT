"use client";

interface VendorApplicationFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  appStatusFilter: string;
  onAppStatusChange: (value: string) => void;
  kycStatusFilter: string;
  onKycStatusChange: (value: string) => void;
  vendorStatusFilter: string;
  onVendorStatusChange: (value: string) => void;
  onResetFilters: () => void;
}

export function VendorApplicationFilterBar({
  search,
  onSearchChange,
  appStatusFilter,
  onAppStatusChange,
  kycStatusFilter,
  onKycStatusChange,
  vendorStatusFilter,
  onVendorStatusChange,
  onResetFilters,
}: VendorApplicationFilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    appStatusFilter !== "all" ||
    kycStatusFilter !== "all" ||
    vendorStatusFilter !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by vendor name, owner, phone, or email..."
          className="w-full rounded-xl border border-border bg-background py-2 pl-10 pr-4 font-display text-caption text-foreground placeholder:text-muted focus:border-primary focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Application Status Filter */}
        <select
          value={appStatusFilter}
          onChange={(e) => onAppStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">App Status: All</option>
          <option value="pending">Pending Review</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* KYC Status Filter */}
        <select
          value={kycStatusFilter}
          onChange={(e) => onKycStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">KYC: All</option>
          <option value="pending">KYC Pending</option>
          <option value="submitted">KYC Submitted</option>
          <option value="verified">KYC Verified</option>
          <option value="rejected">KYC Rejected</option>
        </select>

        {/* Vendor Status Filter */}
        <select
          value={vendorStatusFilter}
          onChange={(e) => onVendorStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Vendor Status: All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
