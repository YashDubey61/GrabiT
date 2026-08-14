"use client";

import { useMemo, useState } from "react";
import { CategoryChips } from "@/components/student/CategoryChips";
import { MenuItemCard } from "@/components/student/MenuItemCard";
import { CartBar } from "@/components/student/CartBar";
import type { MockMenuCategory, MockMenuItem } from "@/lib/mock/menu";

/**
 * Owns the Menu screen's two interactions: category filtering and the
 * local cart (add / increment / decrement / remove-at-zero). Cart state
 * is a plain Record<itemId, quantity> — deliberately not a reducer or
 * context, since this is local-only, single-screen state per the Day 2
 * brief ("keep this implementation intentionally simple").
 */
export function MenuBrowser({
  canteenName,
  items,
  categories,
}: {
  canteenName: string;
  items: MockMenuItem[];
  categories: { id: MockMenuCategory; label: string }[];
}) {
  const [selected, setSelected] = useState<MockMenuCategory>("all");
  const [cart, setCart] = useState<Record<string, number>>({});

  const visibleItems = useMemo(
    () =>
      selected === "all"
        ? items
        : items.filter((item) => item.category === selected),
    [items, selected],
  );

  const { itemCount, total } = useMemo(() => {
    return Object.entries(cart).reduce(
      (acc, [itemId, qty]) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return acc;
        return { itemCount: acc.itemCount + qty, total: acc.total + item.price * qty };
      },
      { itemCount: 0, total: 0 },
    );
  }, [cart, items]);

  function increment(itemId: string) {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  }

  function decrement(itemId: string) {
    setCart((prev) => {
      const next = (prev[itemId] ?? 0) - 1;
      if (next <= 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([id]) => id !== itemId),
        );
      }
      return { ...prev, [itemId]: next };
    });
  }

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 mb-4 bg-background/95 px-5 py-4 backdrop-blur-sm md:mx-0 md:px-0">
        <CategoryChips
          categories={categories}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            quantity={cart[item.id] ?? 0}
            onIncrement={() => increment(item.id)}
            onDecrement={() => decrement(item.id)}
          />
        ))}
        {visibleItems.length === 0 && (
          <p className="col-span-full py-12 text-center text-body text-muted">
            Nothing in this category right now.
          </p>
        )}
      </div>

      {itemCount > 0 && (
        <CartBar canteenName={canteenName} itemCount={itemCount} total={total} />
      )}
    </>
  );
}
