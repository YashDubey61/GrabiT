import Link from "next/link";

/**
 * Floating cart summary bar. Presentational aside from real navigation —
 * Day 3 wires this to /student/checkout via a genuine Next.js <Link>
 * (real route change, not a click handler faking one). The parent decides
 * whether to render it at all (hidden when the cart is empty).
 */
export function CartBar({
  canteenName,
  itemCount,
  total,
}: {
  canteenName: string;
  itemCount: number;
  total: number;
}) {
  return (
    <div className="fixed inset-x-5 bottom-[88px] z-40 md:inset-x-16">
      <Link
        href="/student/checkout"
        className="flex h-14 w-full items-center justify-between rounded-xl bg-primary px-6 text-on-primary shadow-[0_4px_24px_-4px_rgb(255_109_0_/_0.4)] transition-transform active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="material-symbols-outlined" aria-hidden="true">
            shopping_bag
          </span>
          <span className="text-left">
            <span className="block text-label font-700 uppercase leading-tight">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <span className="block font-display text-body font-700 leading-tight">
              {canteenName}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-display text-heading font-700 tabular-nums">
            ₹{total}
          </span>
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward_ios
          </span>
        </span>
      </Link>
    </div>
  );
}
