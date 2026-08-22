"use client";

import type { SearchEntityCategory } from "@/lib/supabase/superadmin_search";

interface GlobalSearchFilterBarProps {
  selectedCategory: SearchEntityCategory;
  onSelectCategory: (cat: SearchEntityCategory) => void;
}

const CATEGORIES: { id: SearchEntityCategory; label: string; icon: string }[] = [
  { id: "ALL", label: "All Domain Entities", icon: "select_all" },
  { id: "USERS", label: "Users & Roles", icon: "manage_accounts" },
  { id: "VENDORS", label: "Vendors & Canteens", icon: "storefront" },
  { id: "CAMPUSES", label: "Campuses", icon: "school" },
  { id: "ORDERS", label: "Orders", icon: "shopping_bag" },
  { id: "SUPPORT", label: "Support Tickets", icon: "headset_mic" },
  { id: "DISPUTES", label: "Disputes & Refunds", icon: "support_agent" },
  { id: "RISK", label: "Fraud & Risk", icon: "security" },
  { id: "REVIEWS", label: "Reviews", icon: "star" },
  { id: "FINANCE", label: "Settlements & Finance", icon: "payments" },
  { id: "FEATURE_FLAGS", label: "Feature Flags", icon: "flag" },
  { id: "AUDIT", label: "Audit Events", icon: "receipt_long" },
];

export function GlobalSearchFilterBar({
  selectedCategory,
  onSelectCategory,
}: GlobalSearchFilterBarProps) {
  return (
    <div className="w-full overflow-x-auto pb-3 mb-2 border-b border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-800">
      <div className="flex items-center gap-2.5 min-w-max pr-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                isSelected
                  ? "bg-orange-600 text-white shadow-md shadow-orange-950/40 border border-orange-500/50"
                  : "bg-zinc-900 border border-zinc-800/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 hover:border-zinc-700"
              }`}
            >
              <span className="material-symbols-outlined text-base shrink-0">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

