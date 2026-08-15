"use client";

interface SuperAdminHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
}

export function SuperAdminHeader({
  searchQuery,
  onSearchChange,
  onRefresh,
}: SuperAdminHeaderProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* Title & Actions Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-title font-bold text-foreground sm:text-[28px]">
            System Overview
          </h2>
          <p className="text-body-sm text-faint">
            Real-time performance metrics across the campus network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-[#1e1f26] px-3.5 py-2 font-display text-caption font-bold text-foreground transition-colors hover:border-primary/40 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-muted" aria-hidden="true">
              calendar_today
            </span>
            LAST 24 HOURS
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              refresh
            </span>
            Force Refresh
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-faint" aria-hidden="true">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campus, transaction, or system log..."
          className="w-full rounded-xl border border-border bg-[#1e1f26] py-3 pl-12 pr-4 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
        />
      </div>
    </section>
  );
}
