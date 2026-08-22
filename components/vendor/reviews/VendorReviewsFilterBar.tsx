"use client";

export interface VendorReviewsFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRating: string;
  onRatingChange: (r: string) => void;
  selectedResponseStatus: string;
  onResponseStatusChange: (s: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export function VendorReviewsFilterBar({
  searchQuery,
  onSearchChange,
  selectedRating,
  onRatingChange,
  selectedResponseStatus,
  onResponseStatusChange,
  onResetFilters,
  filteredCount,
  totalCount,
}: VendorReviewsFilterBarProps) {
  const isFiltered =
    searchQuery.trim() !== "" || selectedRating !== "all" || selectedResponseStatus !== "all";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[18px] text-faint pointer-events-none">
            search
          </span>
          <input
            type="text"
            aria-label="Search reviews"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search review text, dish name or order..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-8 py-2.5 min-h-[44px] text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 p-1 text-muted hover:text-foreground"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <div>
          <select
            aria-label="Filter by star rating"
            value={selectedRating}
            onChange={(e) => onRatingChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2.5 min-h-[44px] text-body-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars (★ ★ ★ ★ ★)</option>
            <option value="4">4 Stars (★ ★ ★ ★ ☆)</option>
            <option value="3">3 Stars (★ ★ ★ ☆ ☆)</option>
            <option value="2">2 Stars (★ ★ ☆ ☆ ☆)</option>
            <option value="1">1 Star (★ ☆ ☆ ☆ ☆)</option>
          </select>
        </div>

        {/* Response Status Filter */}
        <div>
          <select
            aria-label="Filter by response status"
            value={selectedResponseStatus}
            onChange={(e) => onResponseStatusChange(e.target.value)}
            className="w-full rounded-xl border border-border bg-background p-2.5 min-h-[44px] text-body-sm text-foreground focus:border-primary focus:outline-none transition-colors"
          >
            <option value="all">All Response Statuses</option>
            <option value="responded">Responded</option>
            <option value="not_responded">Needs Response</option>
          </select>
        </div>
      </div>

      {isFiltered && (
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-caption font-bold text-muted">
            Showing <span className="text-primary font-extrabold">{filteredCount}</span> of {totalCount} reviews
          </span>
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline min-h-[36px]"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
