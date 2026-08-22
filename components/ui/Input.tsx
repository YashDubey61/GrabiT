import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";

/** GRABIT_DESIGN.md text-input — visible label, orange focus ring, 44-52px height. */
export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-md border border-border bg-surface-elevated px-4 text-body-md text-foreground placeholder:text-faint transition-colors duration-150 ease-standard",
        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-body-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1.5 text-body-sm text-danger">{error}</p>}
    </div>
  );
}
