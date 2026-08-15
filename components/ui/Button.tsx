import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

/**
 * Restyled against GrabIt design tokens — this is the pattern every future
 * component-library primitive follows: never a shadcn/Tailwind default
 * left as-is (PRD §12 / TRD §10).
 */
export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full text-body font-600 transition-colors duration-150 ease-standard disabled:opacity-40",
        "px-5 py-2.5",
        variant === "primary" &&
          "bg-primary text-on-primary hover:bg-primary-soft",
        variant === "secondary" &&
          "border border-border bg-transparent text-foreground hover:bg-surface-elevated",
        variant === "ghost" && "text-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
