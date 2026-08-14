"use client";

import { OrderStatus } from "@/lib/types/database";
import { ORDER_STATE_LABELS } from "@/lib/constants";

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  placed: {
    bg: "bg-warning/15",
    text: "text-warning",
    dot: "bg-warning",
  },
  preparing: {
    bg: "bg-accent/15",
    text: "text-accent",
    dot: "bg-accent",
  },
  ready: {
    bg: "bg-success/15",
    text: "text-success",
    dot: "bg-success",
  },
};

export function StatusPill({
  status,
  isDelayed,
  size = "md",
}: {
  status: OrderStatus;
  isDelayed?: boolean;
  size?: "sm" | "md";
}) {
  const style = STATUS_STYLES[status];
  const label = isDelayed ? "Delayed" : ORDER_STATE_LABELS[status];
  const delayedStyle = isDelayed
    ? { bg: "bg-error/15", text: "text-error", dot: "bg-error" }
    : style;
  const s = isDelayed ? delayedStyle : style;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        transition-all duration-500 ease-out
        ${s.bg} ${s.text}
        ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}
      `}
    >
      <span
        className={`
          inline-block rounded-full
          ${s.dot}
          ${size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"}
          ${status === "preparing" && !isDelayed ? "animate-pulse" : ""}
        `}
      />
      {label}
    </span>
  );
}
