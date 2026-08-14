import { getMockPlatformFee } from "@/lib/cart/calculations";

/**
 * Fixed bottom bar — "Total Payable" + "Pay & Place Order", matching the
 * approved export. Presentational only: order creation, validation, and
 * navigation live in app/student/checkout/page.tsx (via useOrders/useCart)
 * — this component just renders the total and forwards a click.
 *
 * Day 4 update: the button now actually creates a mock local order
 * (see lib/orders/OrderContext.tsx) instead of Day 3's inert
 * acknowledgement note. Still no Razorpay, no Supabase, no real payment —
 * "mock order" is explicit in the code, not implied.
 */
export function CheckoutAction({
  subtotal,
  onPlaceOrder,
  error,
}: {
  subtotal: number;
  onPlaceOrder: () => void;
  error?: string | null;
}) {
  const total = subtotal + getMockPlatformFee(subtotal);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface-elevated/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur-md md:px-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-label font-700 uppercase text-muted">
              Total Payable
            </span>
            <span className="font-display text-heading font-800 tabular-nums text-foreground">
              ₹{total}
            </span>
          </div>
          <a
            href="#bill-details"
            className="flex items-center gap-1 text-caption font-700 text-primary"
          >
            View Breakup
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              expand_less
            </span>
          </a>
        </div>

        <button
          type="button"
          onClick={onPlaceOrder}
          className="w-full rounded-xl bg-primary py-4 text-body font-800 uppercase tracking-wide text-on-primary shadow-xl shadow-primary/20 transition-transform active:scale-95"
        >
          Pay &amp; Place Order
        </button>

        {error && (
          <p role="alert" className="text-center text-caption text-danger">
            {error}
          </p>
        )}

        <p className="text-center text-[11px] text-faint">
          Mock checkout — no real payment is processed.
        </p>
      </div>
    </div>
  );
}
