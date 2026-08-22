"use client";

interface ConfigFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  isHighImpactOnly: boolean;
  setIsHighImpactOnly: (val: boolean) => void;
  onReset: () => void;
}

export function ConfigFilterBar({
  search,
  setSearch,
  isHighImpactOnly,
  setIsHighImpactOnly,
  onReset,
}: ConfigFilterBarProps) {
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
            placeholder="Search configuration by Key, Description, or Name..."
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

        {/* Filter Controls & Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={isHighImpactOnly}
              onChange={(e) => setIsHighImpactOnly(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-orange-500 h-4 w-4"
            />
            <span className="flex items-center gap-1">
              <span className="material-icons text-xs text-rose-400">warning</span>
              High Impact Only
            </span>
          </label>

          <button
            onClick={onReset}
            className="px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            title="Reset filters"
          >
            <span className="material-icons text-xs">restart_alt</span>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
