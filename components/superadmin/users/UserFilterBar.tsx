"use client";

interface UserFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onResetFilters: () => void;
}

export function UserFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
}: UserFilterBarProps) {
  const hasActiveFilters = search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

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
          placeholder="Search by name, phone, GrabIt ID, or user UUID..."
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

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="vendor">Vendor Managers</option>
          <option value="admin">Super Admins</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 font-display text-caption text-foreground focus:border-primary focus:outline-none transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
