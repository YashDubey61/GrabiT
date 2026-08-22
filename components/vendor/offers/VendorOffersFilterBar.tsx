"use client";

export interface VendorOffersFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function VendorOffersFilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  onResetFilters,
  filteredCount,
  totalCount,
}: VendorOffersFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== "" || selectedStatus !== "all" || selectedType !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 mb-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All Offer Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PAUSED">Paused</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        {/* Discount Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All Discount Types</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT">Flat Amount (₹)</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-caption font-bold text-muted">
            Showing <span className="text-primary">{filteredCount}</span> of {totalCount} offers
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
