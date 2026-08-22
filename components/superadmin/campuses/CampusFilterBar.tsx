"use client";

interface CampusFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onReset: () => void;
  onCompare: () => void;
  onExport: () => void;
  onAddNewCampus: () => void;
  exporting?: boolean;
}

export function CampusFilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onReset,
  onCompare,
  onExport,
  onAddNewCampus,
  exporting,
}: CampusFilterBarProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campuses by Name, ID, or Location..."
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

        {/* Status Filter & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Maintenance</option>
          </select>

          <button
            onClick={onReset}
            className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset filters"
          >
            <span className="material-icons text-xs">restart_alt</span>
            Reset
          </button>

          <button
            onClick={onCompare}
            className="px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="material-icons text-xs">compare_arrows</span>
            Compare
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
            onClick={onAddNewCampus}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-icons text-xs">add_business</span>
            Add Campus
          </button>
        </div>
      </div>
    </div>
  );
}
