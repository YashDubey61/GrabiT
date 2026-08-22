import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

type Variant = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

/** GRABIT_DESIGN.md pill badges — status cues, points, chips. */
export function Badge({
  variant = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold",
        variant === "neutral" && "bg-surface-strong text-muted",
        variant === "accent" && "bg-accent-soft text-primary",
        variant === "success" && "bg-success-soft text-success",
        variant === "warning" && "bg-warning-soft text-warning",
        variant === "danger" && "bg-danger-soft text-danger",
        variant === "info" && "bg-info/10 text-info",
        className,
      )}
      {...props}
    />
  );
}
