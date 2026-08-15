"use client";

import { useRouter } from "next/navigation";

// Converted from grabit_checkout_premium_black/code.html's TopAppBar —
// same back-button pattern as MenuTopBar, but the title is the brand
// orange "Checkout" wordmark the Stitch export uses, not white.
export function CheckoutHeader() {
  const router = useRouter();

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-background/80 px-5 backdrop-blur-md md:px-16">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="-ml-2 p-2 text-foreground transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined" aria-hidden="true">
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
    </header>
  );
}
