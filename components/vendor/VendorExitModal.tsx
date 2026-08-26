"use client";

import { useEffect, useState, useRef } from "react";
import {
  subscribeExitConfirmation,
  hideExitConfirmation,
  performAppExit,
} from "@/lib/navigation/backButtonManager";

export function VendorExitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    return subscribeExitConfirmation((open) => {
      setIsOpen(open);
      if (open) {
        // Auto-focus the safe CANCEL button
        setTimeout(() => cancelButtonRef.current?.focus(), 50);
      }
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-vendor-title"
      aria-describedby="exit-vendor-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hideExitConfirmation();
        }
      }}
    >
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface-elevated p-6 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20 text-danger">
            <span className="material-symbols-outlined text-[24px]">logout</span>
          </div>
          <div>
            <h3
              id="exit-vendor-title"
              className="font-display text-title font-extrabold text-foreground"
            >
              Exit GRABIT Vendor?
            </h3>
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-muted">
              Application Exit
            </span>
          </div>
        </div>

        {/* Body message */}
        <p
          id="exit-vendor-desc"
          className="text-body-sm text-muted mt-2 mb-6 leading-relaxed"
        >
          Are you sure you want to exit the app?
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={() => hideExitConfirmation()}
            className="flex-1 rounded-xl border border-border bg-surface py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-foreground hover:bg-surface-elevated transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => performAppExit()}
            className="flex-1 rounded-xl bg-danger py-3.5 font-display text-body-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 transition-all active:scale-95"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
