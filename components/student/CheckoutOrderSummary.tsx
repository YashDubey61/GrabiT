import { CheckoutItem } from "@/components/student/CheckoutItem";
import type { PickupSlot } from "@/components/student/PickupSlotSelector";
import type { CartItem } from "@/lib/cart/types";

// Converted from grabit_checkout_premium_black's "glass-card" Order
// Summary section — semi-transparent elevated surface with a blur, kept
// as its own token-driven treatment rather than the flat MenuItemCard style.
// `pickupSlot` isn't in the Stitch source directly — added so the selected
// slot is visible in the order summary itself (Day 3 step 8), not only as
// a highlighted chip further down the page.
export function CheckoutOrderSummary({
  items,
  pickupSlot,
}: {
  items: CartItem[];
  pickupSlot: PickupSlot;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-label font-700 uppercase tracking-[0.08em] text-muted">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
            receipt_long
          </span>
          Order Summary
        </h2>
        <span className="text-caption text-primary-soft">Pickup: {pickupSlot}</span>
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-surface-elevated/80 p-4 backdrop-blur-md">
        {items.map((item) => (
          <CheckoutItem key={item.menuItemId} item={item} />
        ))}
      </div>
    </section>
  );
}
