/**
 * Shown when the student tries to add an item from a second canteen while
 * the cart already holds items from another one. GrabIt orders belong to
 * a single canteen (Day 3 rule) — this never silently merges the two.
 *
 * Not exercised by the current single-canteen mock menu, but the cart
 * architecture supports it once a second canteen's menu route exists.
 */
export function CanteenConflictBanner({
  currentCanteenName,
  attemptedCanteenName,
  onKeepCurrentCart,
  onStartOver,
}: {
  currentCanteenName: string;
  attemptedCanteenName: string;
  onKeepCurrentCart: () => void;
  onStartOver: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-warning/40 bg-warning-soft p-4"
    >
      <p className="text-body text-foreground">
        You can only order from one canteen at a time. Your cart has items
        from <strong>{currentCanteenName}</strong> — adding from{" "}
        <strong>{attemptedCanteenName}</strong> would start a new order.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-full bg-primary px-4 py-1.5 text-caption font-700 text-on-primary transition-transform active:scale-95"
        >
          Start new order here
        </button>
        <button
          type="button"
          onClick={onKeepCurrentCart}
          className="rounded-full border border-border-subtle px-4 py-1.5 text-caption font-700 text-muted transition-colors hover:text-foreground"
        >
          Keep current cart
        </button>
      </div>
    </div>
  );
}
