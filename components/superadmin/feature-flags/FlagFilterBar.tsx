"use client";

import type { FlagCategory, FlagStatus, FlagEnvironment } from "@/lib/supabase/superadmin_feature_flags";

interface FlagFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  envFilter: string;
  setEnvFilter: (val: string) => void;
  onReset: () => void;
  onCreateFlag: () => void;
  onExport: () => void;
  exporting?: boolean;
}

const CATEGORIES: { label: string; value: FlagCategory | "ALL" }[] = [
  { label: "All Categories", value: "ALL" },
  { label: "Student", value: "Student" },
  { label: "Vendor", value: "Vendor" },
  { label: "Super Admin", value: "Super Admin" },
  { label: "Payments", value: "Payments" },
  { label: "Orders", value: "Orders" },
  { label: "Offers", value: "Offers" },
  { label: "Analytics", value: "Analytics" },
  { label: "Experimental", value: "Experimental" },
  { label: "Disputes", value: "Disputes" },
  { label: "System", value: "System" },
];

const STATUSES: { label: string; value: FlagStatus | "ALL" }[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "ENABLED", value: "ENABLED" },
  { label: "DISABLED", value: "DISABLED" },
  { label: "SCHEDULED", value: "SCHEDULED" },
  { label: "ROLLOUT", value: "ROLLOUT" },
];

const ENVIRONMENTS: { label: string; value: FlagEnvironment | "ALL" }[] = [
  { label: "All Environments", value: "ALL" },
  { label: "Production", value: "production" },
  { label: "Staging", value: "staging" },
  { label: "Development", value: "development" },
];

export function FlagFilterBar({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  envFilter,
  setEnvFilter,
  onReset,
  onCreateFlag,
  onExport,
  exporting,
}: FlagFilterBarProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flags by Name, Key, or Description..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-wrap">
          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Environment Select */}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            {ENVIRONMENTS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset all filters"
          >
            <span className="material-icons text-xs">restart_alt</span>
            Reset
          </button>

          <button
            onClick={onExport}
            disabled={exporting}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            {exporting ? (
              <span className="material-icons animate-spin text-xs">sync</span>
            ) : (
              <span className="material-icons text-xs">download</span>
            )}
            CSV
          </button>

          <button
            onClick={onCreateFlag}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-icons text-xs">add</span>
            New Flag
          </button>
        </div>
      </div>
    </div>
  );
}
