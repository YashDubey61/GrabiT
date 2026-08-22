"use client";

interface DisputeFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  disputeTypeFilter: string;
  onDisputeTypeChange: (value: string) => void;
  refundStatusFilter: string;
  onRefundStatusChange: (value: string) => void;
  onResetFilters: () => void;
  onExportCsv: () => void;
  isExporting?: boolean;
}

export function DisputeFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  disputeTypeFilter,
  onDisputeTypeChange,
  refundStatusFilter,
  onRefundStatusChange,
  onResetFilters,
  onExportCsv,
  isExporting = false,
}: DisputeFilterBarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    disputeTypeFilter !== "all" ||
    refundStatusFilter !== "all";

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
          placeholder="Search by Dispute ID, Order ID, Student, or Vendor..."
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
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Status: All</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="WAITING_FOR_VENDOR">Waiting Vendor</option>
          <option value="REFUND_APPROVED">Refund Approved</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Priority: All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Dispute Type Filter */}
        <select
          value={disputeTypeFilter}
          onChange={(e) => onDisputeTypeChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Type: All</option>
          <option value="ORDER_NOT_RECEIVED">Order Not Received</option>
          <option value="WRONG_ITEM">Wrong Item</option>
          <option value="MISSING_ITEM">Missing Item</option>
          <option value="QUALITY_ISSUE">Quality Issue</option>
          <option value="PAYMENT_ISSUE">Payment Issue</option>
          <option value="REFUND_ISSUE">Refund Issue</option>
        </select>

        {/* Refund Status Filter */}
        <select
          value={refundStatusFilter}
          onChange={(e) => onRefundStatusChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">Refund: All</option>
          <option value="REQUESTED">Requested</option>
          <option value="APPROVED">Approved</option>
          <option value="COMPLETED">Completed</option>
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

        {/* Export CSV Button */}
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
