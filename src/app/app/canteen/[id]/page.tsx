"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { MenuItem, TimeSlot } from "@/lib/types/database";
import { useCart } from "@/lib/store/cart";
import { formatPrice } from "@/lib/constants";
import { PriceTag } from "@/components/ui/PriceTag";
import { MenuItemSkeleton } from "@/components/ui/Skeleton";

type MenuItemsByCategory = { category: string; items: MenuItem[] };

export default function CanteenMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: canteenId } = use(params);
  const cart = useCart();
  const [categories, setCategories] = useState<MenuItemsByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/canteens/${canteenId}/menu`)
      .then((r) => r.json())
      .then((data) => {
        const grouped = data.menuItems.reduce(
          (acc: Record<string, MenuItem[]>, item: MenuItem) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
          },
          {} as Record<string, MenuItem[]>
        );
        const cats = Object.entries(grouped).map(([category, items]) => ({
          category,
          items: items as MenuItem[],
        }));
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].category);
      })
      .finally(() => setLoading(false));
  }, [canteenId]);

  const getCartQuantity = (itemId: string) => {
    return cart.items.find((i) => i.menu_item.id === itemId)?.quantity || 0;
  };

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/app"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Menu</h1>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => {
                  setActiveCategory(cat.category);
                  document.getElementById(`cat-${cat.category}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`
                  whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium
                  transition-all duration-200
                  ${
                    activeCategory === cat.category
                      ? "bg-accent text-bg"
                      : "bg-surface text-text-secondary hover:bg-surface-2"
                  }
                `}
              >
                {cat.category}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Menu items */}
      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="stagger-children">
            {categories.map((cat) => (
              <div key={cat.category} id={`cat-${cat.category}`} className="mb-8">
                <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                  {cat.category}
                </h2>
                <div className="space-y-0 divide-y divide-border/50">
                  {cat.items.map((item) => {
                    const qty = getCartQuantity(item.id);
                    const outOfStock = !item.in_stock;

                    return (
                      <div
                        key={item.id}
                        className={`
                          flex items-center gap-4 py-4
                          transition-opacity duration-300
                          ${outOfStock ? "opacity-40" : ""}
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text truncate">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <div className="mt-1.5">
                            <PriceTag paise={item.price} size="sm" />
                          </div>
                        </div>

                        {/* Add / qty controls */}
                        <div className="flex-shrink-0">
                          {outOfStock ? (
                            <span className="text-[10px] font-medium text-error/80 bg-error/10 px-2 py-1 rounded-full">
                              Out of stock
                            </span>
                          ) : qty === 0 ? (
                            <button
                              onClick={() => cart.addItem(item)}
                              className="
                                rounded-full border border-accent/50 bg-accent/10
                                px-4 py-1.5 text-xs font-semibold text-accent
                                hover:bg-accent/20 active:scale-95
                                transition-all duration-150
                              "
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center gap-0 rounded-full border border-accent bg-accent/10 overflow-hidden">
                              <button
                                onClick={() => cart.updateQuantity(item.id, qty - 1)}
                                className="flex h-7 w-7 items-center justify-center text-accent hover:bg-accent/20 transition-colors"
                              >
                                <span className="text-sm font-bold">−</span>
                              </button>
                              <span className="min-w-[1.5rem] text-center font-mono text-xs font-bold text-accent">
                                {qty}
                              </span>
                              <button
                                onClick={() => cart.updateQuantity(item.id, qty + 1)}
                                className="flex h-7 w-7 items-center justify-center text-accent hover:bg-accent/20 transition-colors"
                              >
                                <span className="text-sm font-bold">+</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar */}
      {cart.totalItems > 0 && (
        <Link
          href="/app/cart"
          className="
            fixed bottom-20 left-4 right-4 z-30
            flex items-center justify-between
            rounded-2xl bg-accent px-5 py-4
            shadow-[0_8px_32px_rgba(255,109,0,0.3)]
            animate-slide-up
            active:scale-[0.98] transition-transform
          "
        >
          <div>
            <span className="text-bg font-semibold text-sm">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"}
            </span>
            <span className="text-bg/70 text-xs ml-2">
              {formatPrice(cart.subtotalPaise)}
            </span>
          </div>
          <span className="text-bg font-semibold text-sm flex items-center gap-1">
            View Cart →
          </span>
        </Link>
      )}
    </div>
  );
}
