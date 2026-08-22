"use client";

import type { VendorMenuCategory } from "@/lib/mock/vendor";

export type CategoryFilterOption = "All Items" | VendorMenuCategory;

interface VendorMenuCategoryChipsProps {
  categories: VendorMenuCategory[];
  selectedCategory: CategoryFilterOption;
  onSelectCategory: (category: CategoryFilterOption) => void;
}

export function VendorMenuCategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
}: VendorMenuCategoryChipsProps) {
  const options: CategoryFilterOption[] = ["All Items", ...categories];
  return (
    <section className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {options.map((cat) => {
        const isActive = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`shrink-0 rounded-full px-5 py-2 font-display text-caption font-semibold transition-all duration-150 active:scale-95 ${
              isActive
                ? "bg-primary text-on-primary shadow-glow-primary"
                : "border border-border bg-surface-elevated text-muted hover:border-white/20 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </section>
  );
}
