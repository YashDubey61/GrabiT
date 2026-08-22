"use client";

import type { ConfigCategory } from "@/lib/supabase/superadmin_configuration";

interface ConfigCategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
}

const CATEGORIES: { id: ConfigCategory | "ALL"; label: string; icon: string }[] = [
  { id: "ALL", label: "All Settings", icon: "tune" },
  { id: "GENERAL", label: "General", icon: "settings_applications" },
  { id: "ORDERS", label: "Orders & Fulfillment", icon: "shopping_bag" },
  { id: "VENDOR", label: "Vendor & Settlement", icon: "storefront" },
  { id: "OFFERS", label: "Offers & Coupons", icon: "local_offer" },
  { id: "PAYMENTS", label: "Payments", icon: "credit_card" },
  { id: "REFUNDS", label: "Refunds & Disputes", icon: "currency_exchange" },
  { id: "NOTIFICATIONS", label: "Notifications", icon: "notifications" },
];

export function ConfigCategoryNav({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: ConfigCategoryNavProps) {
  return (
    <div>
      {/* Desktop Vertical Category Rail */}
      <div className="hidden lg:block bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-md space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Categories
        </div>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === "ALL" ? Object.values(categoryCounts).reduce((a, b) => a + b, 0) : categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-icons text-base opacity-80">{cat.icon}</span>
                <span>{cat.label}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isSelected ? "bg-orange-500/20 text-orange-300 font-bold" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Horizontal Category Tabs */}
      <div className="block lg:hidden overflow-x-auto mb-4 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-orange-600 text-white shadow-sm font-semibold"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="material-icons text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
