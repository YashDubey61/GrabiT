"use client";

export interface VendorOrdersFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedPayment: string;
  onPaymentChange: (p: string) => void;
  selectedDate: string;
  onDateChange: (d: string) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
}

export function VendorOrdersFilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPayment,
  onPaymentChange,
  selectedDate,
  onDateChange,
  onResetFilters,
  totalFilteredCount,
}: VendorOrdersFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedPayment !== "all" ||
    selectedDate !== "today";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search order #, dish, student..."
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
            <option value="all">All Order Statuses</option>
            <option value="placed">New Orders (Placed)</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready for Pickup</option>
            <option value="completed">Completed / Picked Up</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Filter */}
        <div>
          <select
            value={selectedPayment}
            onChange={(e) => onPaymentChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">All Payment Types</option>
            <option value="PREPAID">Prepaid Online</option>
            <option value="CASH">Cash at Counter</option>
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Filter summary & Reset */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-caption font-bold text-muted">
          Showing <span className="text-primary">{totalFilteredCount}</span> orders
        </span>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline underline-offset-4"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
