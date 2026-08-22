import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

/** Loading state primitive — pulses a surface-strong block. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-strong", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
