import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "primary-dark" | "secondary" | "subtle" | "danger" | "ghost";
type Size = "md" | "lg";

/**
 * Restyled against GrabIt design tokens (GRABIT_DESIGN.md Buttons) — this is
 * the pattern every future component-library primitive follows: never a
 * shadcn/Tailwind default left as-is.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 ease-standard disabled:opacity-40 disabled:pointer-events-none",
        size === "md" && "h-11 px-5 text-body-sm",
        size === "lg" && "h-[52px] px-6 text-body-md",
        variant === "primary" &&
          "bg-primary text-on-primary hover:bg-accent-pressed",
        variant === "primary-dark" &&
          "bg-background text-on-dark hover:bg-surface-elevated",
        variant === "secondary" &&
          "border border-border bg-transparent text-foreground hover:bg-surface-elevated",
        variant === "subtle" &&
          "bg-surface-pressed text-foreground hover:bg-surface-strong",
        variant === "danger" && "bg-danger text-on-dark hover:opacity-90",
        variant === "ghost" && "text-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
