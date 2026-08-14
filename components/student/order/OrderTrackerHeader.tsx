"use client";

import { useRouter } from "next/navigation";

// Converted from grabit_track_order_premium_black's TopAppBar — the brand
// wordmark instead of a screen title (matches the Stitch source exactly),
// plus QR and help icons. Both are decorative for Day 4: no real
// QR-scanner flow or help center exists yet, consistent with how
// CheckoutHeader/MenuTopBar treat their own decorative icons.
export function OrderTrackerHeader() {
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-background px-5 md:px-16">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="p-2 -ml-2 text-foreground transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <h1 className="font-display text-heading font-800 tracking-tight text-primary">
          GrabIt
        </h1>
      </div>
      <div className="flex items-center gap-4 text-foreground">
        <span className="material-symbols-outlined" aria-hidden="true">
          qr_code_scanner
        </span>
        <span className="material-symbols-outlined" aria-hidden="true">
          help_outline
        </span>
      </div>
    </header>
  );
}
