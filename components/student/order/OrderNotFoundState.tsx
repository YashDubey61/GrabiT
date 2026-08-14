import Link from "next/link";

// Not part of the Stitch export (that screen assumes a valid order) — a
// nonexistent/expired order ID needs its own honest state rather than a
// blank or broken tracker. Same pattern as EmptyCheckoutState.
export function OrderNotFoundState() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="material-symbols-outlined text-[48px] text-muted" aria-hidden="true">
        receipt_long
      </span>
      <h1 className="font-display text-heading font-800 text-foreground">
        Order not found
      </h1>
      <p className="max-w-xs text-caption text-muted">
        This order doesn&apos;t exist in this session — it may have expired,
        or the link is incorrect.
      </p>
      <Link
        href="/student/menu"
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-body font-700 text-on-primary transition-transform active:scale-95"
      >
        Browse Menu
      </Link>
    </div>
  );
}
