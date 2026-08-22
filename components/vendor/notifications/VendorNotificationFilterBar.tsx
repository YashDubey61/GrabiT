"use client";

import type { NotificationCategory } from "@/lib/supabase/vendor_notifications_center";

export interface VendorNotificationFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: NotificationCategory;
  onCategoryChange: (c: NotificationCategory) => void;
  selectedStatus: "ALL" | "UNREAD" | "READ";
  onStatusChange: (s: "ALL" | "UNREAD" | "READ") => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function VendorNotificationFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  filteredCount,
  totalCount,
}: VendorNotificationFilterBarProps) {
  const categories: Array<{ label: string; value: NotificationCategory }> = [
    { label: "All Categories", value: "ALL" },
    { label: "Orders", value: "ORDERS" },
    { label: "Inventory", value: "INVENTORY" },
    { label: "Payments", value: "PAYMENTS" },
    { label: "Payouts", value: "PAYOUTS" },
    { label: "Reviews", value: "REVIEWS" },
    { label: "Offers", value: "OFFERS" },
    { label: "System", value: "SYSTEM" },
  ];

  const isFiltered =
    searchQuery.trim() !== "" || selectedCategory !== "ALL" || selectedStatus !== "ALL";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5 mb-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notifications..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex rounded-xl bg-background p-1 border border-border">
          {[
            { label: "All", value: "ALL" },
            { label: "Unread Only", value: "UNREAD" },
            { label: "Read", value: "READ" },
          ].map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => onStatusChange(st.value as "ALL" | "UNREAD" | "READ")}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
                selectedStatus === st.value
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
        {categories.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onCategoryChange(c.value)}
            className={`rounded-xl px-3 py-1.5 font-display text-caption font-bold transition-all border ${
              selectedCategory === c.value
                ? "bg-primary/20 text-primary border-primary/40"
                : "border-border/60 bg-background/50 text-muted hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="ml-auto font-display text-caption font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters ({filteredCount}/{totalCount})
          </button>
        )}
      </div>
    </div>
  );
}
