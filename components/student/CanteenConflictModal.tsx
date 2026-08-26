"use client";

import Link from "next/link";

interface CanteenConflictModalProps {
  currentCanteenName: string;
  attemptedCanteenName: string;
  onKeepCurrentCart: () => void;
  onStartOver: () => void;
}

export function CanteenConflictModal({
  currentCanteenName,
  attemptedCanteenName,
  onKeepCurrentCart,
  onStartOver,
}: CanteenConflictModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-[#121212] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header / Icon */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning border border-warning/30">
            <span className="material-symbols-outlined text-[24px]">storefront</span>
          </div>
          <div>
            <h3 id="conflict-modal-title" className="font-display text-body-lg font-bold text-foreground">
              Different vendor
            </h3>
            <p className="font-body text-caption text-muted">
              Orders can only contain items from one vendor
            </p>
          </div>
        </div>

        {/* Description Body */}
        <p className="mb-5 text-caption text-muted leading-relaxed">
          Your current cart contains items from <strong className="text-foreground">{currentCanteenName}</strong>. Orders can only contain items from one vendor. You can place a separate order from <strong className="text-foreground">{attemptedCanteenName}</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/customer/checkout"
            onClick={onKeepCurrentCart}
            className="flex-1 rounded-xl border border-border bg-surface-elevated py-3 text-center font-display text-caption font-bold text-foreground hover:bg-border/30 transition-colors"
          >
            View Current Cart
          </Link>
          <button
            type="button"
            onClick={onStartOver}
            className="flex-1 rounded-xl bg-primary py-3 font-display text-caption font-bold text-on-primary shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Start New Order
          </button>
        </div>
      </div>
    </div>
  );
}
