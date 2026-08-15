"use client";

/**
 * Reusable pill filter row — the same pattern drives Campus Home's stall
 * filter and the Menu screen's category tabs in the Stitch designs
 * (identical visual treatment, different data). Generic over an `id`
 * string so both screens can use it without a shared enum.
 */
export function CategoryChips<T extends string>({
  categories,
  selected,
  onSelect,
}: {
  categories: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Filter by category"
      className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
    >
      {categories.map((category) => {
        const isSelected = category.id === selected;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(category.id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-6 py-2 text-label font-700 uppercase tracking-[0.04em] transition-all duration-150 active:scale-95 ${
              isSelected
                ? "bg-primary text-on-primary shadow-[0_4px_12px_-2px_rgb(255_109_0_/_0.4)]"
                : "border border-border-subtle bg-surface-elevated text-muted hover:bg-surface"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
