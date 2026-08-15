"use client";

interface VendorMenuHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddNewItem: () => void;
}

export function VendorMenuHeader({
  searchQuery,
  onSearchChange,
  onAddNewItem,
}: VendorMenuHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4">
      {/* Title & Add Button Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-title font-bold text-foreground sm:text-[28px]">
            Menu Management
          </h2>
          <p className="text-body-sm text-faint">
            Update your dishes, prices, and stock availability for the campus crowd.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewItem}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary transition-all duration-150 active:scale-95 hover:opacity-90 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            add
          </span>
          Add New Item
        </button>
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
          placeholder="Quick find a dish by name..."
          className="w-full rounded-xl border border-border bg-[#1e1f26] py-3.5 pl-12 pr-4 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
        />
      </div>
    </section>
  );
}
