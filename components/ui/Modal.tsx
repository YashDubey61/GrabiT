"use client";

import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";
import type { ReactNode } from "react";

/** GRABIT modal-card — floating layer elevated above bottom nav with safe-area offset. */
export function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  className,
  glass = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Glass surface by default (DESIGN.md modal-card is a floating layer). */
  glass?: boolean;
}) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-md p-3 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] transition-all sm:items-center sm:p-4 sm:pb-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md max-h-[75dvh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          glass
            ? "glass-modal"
            : "border border-border bg-surface-elevated shadow-[var(--shadow-level-2)]",
          className,
        )}
      >
        {title && (
          <h2 className="mb-3 text-display-sm font-bold text-foreground">{title}</h2>
        )}
        <div className="text-body-md text-muted">{children}</div>
        {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
      </div>
    </div>
  );
}

