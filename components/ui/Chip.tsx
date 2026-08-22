import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

/**
 * Category/filter pill — glass surface, orange-tinted glass-glow when
 * selected (per GRABIT_DESIGN.md category-chip-row + glassmorphism system).
 */
export function Chip({
  selected = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "glass-chip inline-flex h-11 shrink-0 items-center justify-center px-4 text-body-sm font-semibold",
        selected ? "is-selected" : "text-foreground",
        "disabled:opacity-40 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
