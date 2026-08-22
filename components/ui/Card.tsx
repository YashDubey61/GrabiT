import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type Variant = "content" | "elevated" | "reward" | "featured" | "glass";

/**
 * GRABIT_DESIGN.md Cards & Containers — radius-xl, border, restrained shadow.
 * `glass` is reserved for elevated/floating contexts (reward cards, featured
 * modules) per the glassmorphism system in globals.css — default content
 * cards stay solid for readability and hierarchy.
 */
export function Card({
  variant = "content",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: Variant }) {
  return (
    <div
      className={cn(
        "p-5",
        variant === "glass"
          ? "glass-card"
          : "rounded-xl border border-border bg-surface",
        variant === "elevated" && "shadow-[var(--shadow-level-1)]",
        variant === "reward" && "border-transparent bg-accent-soft",
        variant === "featured" && "border-primary/30 bg-surface-elevated",
        className,
      )}
      {...props}
    />
  );
}
