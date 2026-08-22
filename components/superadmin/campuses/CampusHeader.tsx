"use client";

interface CampusHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onAddNewCampus: () => void;
}

export function CampusHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddNewCampus,
}: CampusHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4">
      {/* Title & Add Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]" aria-hidden="true">
              location_on
            </span>
            <h2 className="font-display text-title font-bold text-foreground sm:text-[28px]">
              Campus Management
            </h2>
          </div>
          <p className="max-w-2xl text-body-sm text-faint">
            Monitor logistics, vendor density, and daily performance metrics across all active GrabIt zones.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewCampus}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90 shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add_circle
          </span>
          Add New Campus
        </button>
      </div>

      {/* Search & Filter Control Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Field */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search campus location or city..."
            className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-10 pr-4 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {(["ALL", "ACTIVE", "MAINTENANCE", "PRE_ONBOARDING"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`rounded-xl px-3.5 py-2 font-display text-caption font-bold transition-all ${
                statusFilter === st
                  ? "bg-primary text-on-primary shadow-sm"
                  : "border border-border bg-surface-elevated text-muted hover:text-foreground"
              }`}
            >
              {st === "ALL" ? "All Status" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
