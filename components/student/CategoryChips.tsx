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
      className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
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
            className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.05em] transition-all duration-150 active:scale-95 cursor-pointer ${
              isSelected
                ? "bg-primary text-black shadow-[0_2px_14px_rgba(255,122,0,0.4)] border border-primary"
                : "border border-white/[0.08] bg-white/[0.04] text-zinc-400 backdrop-blur-md hover:border-white/[0.15] hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
