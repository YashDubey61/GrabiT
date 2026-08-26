"use client";

import Image from "next/image";
import type { CartItem } from "@/lib/cart/types";
import { useCart } from "@/lib/cart/CartContext";

export function CheckoutItem({ item }: { item: CartItem }) {
  const cart = useCart();

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0 last:pb-0 first:pt-0">
      {/* Left: Thumbnail & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface border border-border-subtle">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <span className="truncate font-display text-body-sm font-bold text-foreground">
            {item.name}
          </span>
          <span className="font-mono text-caption text-muted">
            ₹{item.price} each
          </span>
        </div>
      </div>

      {/* Right: Stepper [-] qty [+] & Line Total */}
      <div className="flex items-center gap-3 shrink-0">
        {/* [-] qty [+] Stepper */}
        <div
          className="flex h-8 items-center gap-1.5 rounded-lg bg-surface border border-border px-1 shadow-sm"
          role="group"
          aria-label={`Quantity of ${item.name}`}
        >
          <button
            type="button"
            onClick={() => cart.decrement(item.menuItemId)}
            aria-label={`Decrease ${item.name}`}
            className="flex h-6 w-6 items-center justify-center rounded text-muted hover:text-foreground hover:bg-surface-elevated active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <span className="min-w-[1.2ch] text-center font-display text-body-sm font-bold text-foreground tabular-nums px-0.5">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => cart.increment(item.menuItemId)}
            aria-label={`Increase ${item.name}`}
            className="flex h-6 w-6 items-center justify-center rounded text-primary hover:text-primary-hover hover:bg-primary/10 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        </div>

        {/* Line Price */}
        <span className="min-w-[48px] text-right font-display text-body-sm font-bold tabular-nums text-foreground">
          ₹{item.price * item.quantity}
        </span>
      </div>
    </div>
  );
}
