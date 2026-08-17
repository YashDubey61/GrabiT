import Link from "next/link";

// Not part of the Stitch export (that screen assumes an active cart) —
// a genuinely empty /customer/checkout needs its own state rather than
// rendering a broken bill breakdown of nothing. Styled to the same
// Premium Black system as the rest of Checkout.
export function EmptyCheckoutState() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span
        className="material-symbols-outlined text-[48px] text-muted"
        aria-hidden="true"
      >
        shopping_bag
      </span>
      <h1 className="font-display text-heading font-800 text-foreground">
        Your cart is empty
      </h1>
      <p className="max-w-xs text-caption text-muted">
        Add something from a canteen menu before checking out.
      </p>
      <Link
        href="/customer/menu"
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-body font-700 text-on-primary transition-transform active:scale-95"
      >
        Browse Menu
      </Link>
    </div>
  );
}
