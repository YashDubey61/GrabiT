"use client";

import { useMemo, useState } from "react";
import { CategoryChips } from "@/components/student/CategoryChips";
import { MenuItemCard } from "@/components/student/MenuItemCard";
import { CartBar } from "@/components/student/CartBar";
import { CanteenConflictBanner } from "@/components/student/CanteenConflictBanner";
import { useCart } from "@/lib/cart/CartContext";
import type { MockMenuCategory, MockMenuItem } from "@/lib/mock/menu";

/**
 * Owns Menu's one screen-local interaction (category filtering). Cart
 * state moved to the shared CartContext on Day 3 — this component reads
 * quantities from `useCart()` instead of holding its own copy, so Menu
 * and Checkout stay in sync automatically.
 */
export function MenuBrowser({
  canteenId,
  canteenName,
  items,
  categories,
}: {
  canteenId: string;
  canteenName: string;
  items: MockMenuItem[];
  categories: { id: MockMenuCategory; label: string }[];
}) {
  const [selected, setSelected] = useState<MockMenuCategory>("all");
  const cart = useCart();

  const visibleItems = useMemo(
    () =>
      selected === "all"
        ? items
        : items.filter((item) => item.category === selected),
    [items, selected],
  );

  function quantityOf(menuItemId: string) {
    return cart.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0;
  }

  function handleAdd(item: MockMenuItem) {
    cart.addItem({
      canteenId,
      canteenName,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  }

  return (
    <>
      {cart.conflict && (
        <CanteenConflictBanner
          currentCanteenName={cart.canteenName ?? ""}
          attemptedCanteenName={cart.conflict.attemptedCanteenName}
          onKeepCurrentCart={cart.dismissConflict}
          onStartOver={cart.resolveConflictByStartingOver}
        />
      )}

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
            quantity={quantityOf(item.id)}
            onIncrement={() =>
              quantityOf(item.id) === 0 ? handleAdd(item) : cart.increment(item.id)
            }
            onDecrement={() => cart.decrement(item.id)}
          />
        ))}
        {visibleItems.length === 0 && (
          <p className="col-span-full py-12 text-center text-body text-muted">
            Nothing in this category right now.
          </p>
        )}
      </div>

      {cart.itemCount > 0 && (
        <CartBar canteenName={cart.canteenName ?? canteenName} itemCount={cart.itemCount} total={cart.subtotal} />
      )}
    </>
  );
}
