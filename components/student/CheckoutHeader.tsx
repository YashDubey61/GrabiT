"use client";

import { useRouter } from "next/navigation";

// Converted from grabit_checkout_premium_black/code.html's TopAppBar —
// same back-button pattern as MenuTopBar, but the title is the brand
// orange "Checkout" wordmark the Stitch export uses, not white.
export function CheckoutHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6 md:px-16">
        <div className="flex items-center gap-3">
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
            Checkout
          </h1>
        </div>
        <span
          className="material-symbols-outlined text-muted"
          aria-hidden="true"
        >
          qr_code_scanner
        </span>
      </div>
    </header>
  );
}
