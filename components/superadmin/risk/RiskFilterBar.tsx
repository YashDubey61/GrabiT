"use client";

interface RiskFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  riskLevelFilter: string;
  onRiskLevelChange: (value: string) => void;
  caseStatusFilter: string;
  onCaseStatusChange: (value: string) => void;
  entityTypeFilter: string;
  onEntityTypeChange: (value: string) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  isExporting?: boolean;
}

export function RiskFilterBar({
  search,
  onSearchChange,
  riskLevelFilter,
  onRiskLevelChange,
  caseStatusFilter,
  onCaseStatusChange,
  entityTypeFilter,
  onEntityTypeChange,
  onResetFilters,
  onExportCsv,
  isExporting = false,
}: RiskFilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    riskLevelFilter !== "all" ||
    caseStatusFilter !== "all" ||
    entityTypeFilter !== "all";

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
          placeholder="Search by Case ID, Order ID, User ID, or Vendor..."
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

      {/* Filter Dropdowns & Export Button */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Risk Level Filter */}
        <select
          value={riskLevelFilter}
          onChange={(e) => onRiskLevelChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Risk Level: All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Case Status Filter */}
        <select
          value={caseStatusFilter}
          onChange={(e) => onCaseStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Status: All</option>
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

        {/* Entity Type Filter */}
        <select
          value={entityTypeFilter}
          onChange={(e) => onEntityTypeChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Entity: All</option>
          <option value="order">Order</option>
          <option value="vendor">Vendor</option>
          <option value="student">Student</option>
          <option value="payment">Payment</option>
          <option value="coupon">Coupon</option>
        </select>

        {/* Reset Filters */}
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

        {/* Export Report CSV */}
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isExporting}
          className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 font-display text-caption font-bold text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>{isExporting ? "Exporting..." : "Export Report"}</span>
        </button>
      </div>
    </div>
  );
}
