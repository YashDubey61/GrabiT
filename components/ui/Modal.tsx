"use client";

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/** GRABIT_DESIGN.md modal-card — radius 16-20px, Level 2 shadow, title/body/actions. */
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
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl",
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
