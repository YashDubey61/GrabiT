import Image from "next/image";
import { QuantityControl } from "@/components/student/QuantityControl";
import type { MockMenuItem } from "@/lib/mock/menu";

/**
 * No 'use client' here — quantity state and its handlers live in the
 * parent (MenuBrowser) and arrive as props, so this stays a plain
 * component even though it renders an interactive control.
 */
export function MenuItemCard({
  item,
  quantity,
  onIncrement,
  onDecrement,
}: {
  item: MockMenuItem;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface p-4 transition-colors active:bg-surface-elevated">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-elevated ring-1 ring-white/5">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          {item.isVeg && (
            <span
              className="flex h-3 w-3 shrink-0 items-center justify-center border border-success p-0.5"
              aria-label="Vegetarian"
              title="Vegetarian"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
            </span>
          )}
          <h3 className="truncate font-display text-body font-700 text-foreground">
            {item.name}
          </h3>
        </div>
        <p className="mb-2 line-clamp-2 text-caption text-muted">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-display text-heading font-700 text-primary">
            ₹{item.price}
          </span>
          <QuantityControl
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            itemName={item.name}
          />
        </div>
      </div>
    </article>
  );
}
