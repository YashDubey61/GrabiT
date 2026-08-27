"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import type { CampusFoodItem } from "@/lib/supabase/data";

export function FoodSearchResultCard({ item }: { item: CampusFoodItem }) {
  const cart = useCart();

  const quantity =
    cart.items.find((i) => i.menuItemId === item.id)?.quantity ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    cart.addItem({
      canteenId: item.canteenId,
      canteenName: item.canteenName,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (quantity === 0) {
      handleAddToCart(e);
    } else {
      cart.increment(item.id);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cart.decrement(item.id);
  };

  return (
    <Link
      href={`/customer/menu/${item.canteenId}`}
      className="group relative flex items-center gap-3.5 rounded-2xl border border-border-subtle bg-surface-elevated p-3.5 transition-all duration-200 hover:border-primary/50 hover:bg-surface-elevated/90 active:scale-[0.99]"
    >
      {/* Dish Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-white/5">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.isVeg && (
          <span
            className="absolute left-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-sm bg-black/60 p-0.5 backdrop-blur-sm border border-success"
            aria-label="Vegetarian"
            title="Vegetarian"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
          </span>
        )}
      </div>

      {/* Info & Price */}
      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-body font-bold text-foreground group-hover:text-primary transition-colors">
              {item.name}
            </h3>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="material-symbols-outlined text-[13px] text-primary shrink-0">
              storefront
            </span>
            <span className="truncate font-medium">{item.canteenName}</span>
            {item.category && (
              <>
                <span className="text-border-subtle">•</span>
                <span className="truncate text-zinc-400">{item.category}</span>
              </>
            )}
          </div>

          {item.description && (
            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400 font-normal">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-display text-body font-bold text-primary font-mono">
            ₹{item.price}
          </span>

          {/* Quick Add Stepper */}
          <div onClick={(e) => e.stopPropagation()}>
            {quantity === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={`Quick add ${item.name} to cart`}
                className="px-3 py-1.5 rounded-xl font-display font-bold text-xs transition-all flex items-center gap-1 shrink-0 bg-primary text-black hover:bg-primary-hover shadow-[0_4px_16px_-4px_rgb(255_109_0_/_0.4)] active:scale-95 cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[16px] text-black font-bold"
                  aria-hidden="true"
                >
                  add
                </span>
                <span className="text-black font-bold">Quick Add</span>
              </button>
            ) : (
              <div
                className="flex h-[28px] items-center gap-2 rounded-xl bg-primary px-2 text-black shadow-[0_4px_16px_-4px_rgb(255_109_0_/_0.4)] shrink-0 font-display font-bold text-xs"
                role="group"
                aria-label={`Quantity of ${item.name}`}
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  aria-label={`Remove one ${item.name}`}
                  className="flex h-full w-4 items-center justify-center text-black font-bold transition-transform active:scale-90 cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[16px] font-bold"
                    aria-hidden="true"
                  >
                    remove
                  </span>
                </button>
                <span
                  className="min-w-[1ch] text-center font-mono font-bold text-xs text-black tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label={`Add one more ${item.name}`}
                  className="flex h-full w-4 items-center justify-center text-black font-bold transition-transform active:scale-90 cursor-pointer"
                >
                  <span
                    className="material-symbols-outlined text-[16px] font-bold"
                    aria-hidden="true"
                  >
                    add
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
