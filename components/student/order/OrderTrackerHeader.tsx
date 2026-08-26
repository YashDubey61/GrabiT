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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6 md:px-16">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <h1 className="font-display text-heading font-800 tracking-tight text-primary">
            GrabIt
          </h1>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            qr_code_scanner
          </span>
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            help_outline
          </span>
        </div>
      </div>
    </header>
  );
}
