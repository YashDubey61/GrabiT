// Keyed loosely (not by the current PaymentMethod type) because
// historical orders may still carry "upi" from before standalone UPI
// was removed as a selectable GRABIT payment option — this is a
// display label lookup for past data, not a re-introduction of UPI as
// a choice.
const PAYMENT_LABELS: Record<string, string> = {
  wallet: "GrabIt Wallet",
  upi: "UPI",
  card: "Pay Online",
};

// Converted from the two remaining Order Detail Bento tiles — Stall and
// Paid via. Pickup-only: the Stitch source's "Level 2, North Wing" is
// static placeholder copy (canteens don't carry a floor/wing field in
// the mock data or the TRD schema), so this uses "Pickup counter"
// instead of inventing per-canteen location data that doesn't exist.
export function OrderInfoTiles({
  canteenName,
  paymentMethod,
  totalAmount,
}: {
  canteenName: string;
  paymentMethod: string;
  totalAmount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/5 bg-surface p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
            storefront
          </span>
          <span className="text-label font-700 text-muted">Stall</span>
        </div>
        <p className="text-body font-700 text-foreground">{canteenName}</p>
        <p className="text-caption text-muted">Pickup counter</p>
      </div>

      <div className="flex flex-col justify-between rounded-2xl border border-white/5 bg-surface p-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">
              payments
            </span>
            <span className="text-label font-700 text-muted">Paid via</span>
          </div>
          <p className="text-body font-700 text-foreground">{PAYMENT_LABELS[paymentMethod]}</p>
        </div>
        <p className="mt-2 text-caption font-700 tabular-nums text-primary">₹{totalAmount}</p>
      </div>
    </div>
  );
}
