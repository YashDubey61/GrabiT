import Image from "next/image";
import type { CartItem } from "@/lib/cart/types";

// One row of grabit_checkout_premium_black's Order Summary card —
// thumbnail, name, "x{qty}", line price (price × quantity, matching the
// Stitch reference's ₹149 for a single ₹149 item rather than unit price).
export function CheckoutItem({ item }: { item: CartItem }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-body font-700 text-foreground">{item.name}</span>
          <span className="text-caption text-muted">x{item.quantity}</span>
        </div>
      </div>
      <span className="text-body font-700 tabular-nums text-foreground">
        ₹{item.price * item.quantity}
      </span>
    </div>
  );
}
