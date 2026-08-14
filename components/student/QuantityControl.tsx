/**
 * Presentational only — no internal state. Renders the Stitch "ADD" pill
 * when qty is 0, and a −/qty/+ stepper once an item is in the cart.
 * Decrementing to 0 removes the item (handled by the parent's cart
 * reducer, not here).
 */
export function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  itemName,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  itemName: string;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Add ${itemName} to cart`}
        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-6 text-label font-700 uppercase text-on-primary shadow-[0_4px_24px_-4px_rgb(255_109_0_/_0.4)] transition-transform active:scale-95"
      >
        Add
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          add
        </span>
      </button>
    );
  }

  return (
    <div
      className="flex h-9 items-center gap-3 rounded-lg bg-primary px-2 text-on-primary shadow-[0_4px_24px_-4px_rgb(255_109_0_/_0.4)]"
      role="group"
      aria-label={`Quantity of ${itemName}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Remove one ${itemName}`}
        className="flex h-full w-6 items-center justify-center transition-transform active:scale-90"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          remove
        </span>
      </button>
      <span
        className="min-w-[1ch] text-center text-label font-700 tabular-nums"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Add one more ${itemName}`}
        className="flex h-full w-6 items-center justify-center transition-transform active:scale-90"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          add
        </span>
      </button>
    </div>
  );
}
