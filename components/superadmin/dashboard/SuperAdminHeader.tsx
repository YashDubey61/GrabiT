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
          <h2 className="font-display text-title font-extrabold text-white sm:text-[28px]">
            System Overview
          </h2>
          <p className="text-body-sm text-zinc-400">
            Real-time performance metrics across the campus network.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-2.5 font-display text-caption font-extrabold text-white backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white/[0.08] active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
              calendar_today
            </span>
            LAST 24 HOURS
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-black shadow-[0_4px_20px_-2px_rgba(255,122,0,0.45)] hover:bg-primary-soft transition-all duration-150 active:scale-95 cursor-pointer"
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
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-zinc-400" aria-hidden="true">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campus, transaction, or system log..."
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.04] py-3.5 pl-12 pr-4 font-body text-body-sm text-white placeholder:text-zinc-500 backdrop-blur-xl focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/30 outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
        />
      </div>
    </section>
  );
}
