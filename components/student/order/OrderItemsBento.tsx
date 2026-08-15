import Image from "next/image";
import type { OrderItem } from "@/lib/orders/types";

/**
 * Converted from the Order Detail Bento section's item tile. The Stitch
 * source shows exactly one item ("Veg Burger x1") since its example order
 * only has one — this maps over the *actual* order's items (step 13:
 * "must not contain hardcoded order items"), repeating the same tile
 * pattern for each rather than only ever showing the first.
 */
export function OrderItemsBento({ items }: { items: OrderItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 rounded-2xl border border-white/5 bg-surface p-4"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
            <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h4 className="text-body font-700 text-foreground">
              {item.name} x{item.quantity}
            </h4>
            <p className="text-caption tabular-nums text-primary-soft">₹{item.lineTotal}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
