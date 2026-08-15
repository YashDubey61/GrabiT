"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@/types";

type StepId = "placed" | "preparing" | "ready" | "picked_up" | "completed";

const STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: "placed", label: "Placed", icon: "check" },
  { id: "preparing", label: "Preparing", icon: "restaurant" },
  { id: "ready", label: "Ready", icon: "inventory_2" },
  { id: "picked_up", label: "Picked Up", icon: "shopping_bag" },
  { id: "completed", label: "Completed", icon: "task_alt" },
];

function stepState(step: StepId, status: OrderStatus): "done" | "active" | "pending" {
  if (status === "cancelled") return "pending";

  const order: StepId[] = ["placed", "preparing", "ready", "picked_up", "completed"];
  const currentIndex = order.indexOf(status as StepId);
  const stepIndex = order.indexOf(step);

  if (currentIndex === -1) return "pending";
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function headingFor(status: OrderStatus): { eyebrow: string; heading: string } {
  switch (status) {
    case "placed":
      return { eyebrow: "Live Tracking", heading: "Order Placed" };
    case "preparing":
      return { eyebrow: "Live Tracking", heading: "Preparing Your Meal" };
    case "ready":
      return { eyebrow: "Live Tracking", heading: "Ready for Pickup!" };
    case "picked_up":
      return { eyebrow: "Live Tracking", heading: "Order Picked Up" };
    case "completed":
      return { eyebrow: "Order Completed", heading: "Enjoy Your Meal!" };
    case "cancelled":
      return { eyebrow: "Order Cancelled", heading: "Order Cancelled by Store" };
    default:
      return { eyebrow: "Live Tracking", heading: "Order Processing" };
  }
}

export function OrderLiveStatus({
  status,
  estimatedReadyAt,
}: {
  status: OrderStatus;
  estimatedReadyAt: string;
}) {
  const { eyebrow, heading } = headingFor(status);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "preparing") return;
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, [status]);

  const minutesLeft = Math.max(
    0,
    Math.round((new Date(estimatedReadyAt).getTime() - now) / 60_000),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p
            className={`mb-1 text-label font-700 uppercase tracking-[0.14em] ${
              status === "cancelled"
                ? "text-danger"
                : status === "completed"
                  ? "text-success"
                  : "text-primary"
            }`}
          >
            {eyebrow}
          </p>
          <h2 className="text-balance font-display text-[28px] font-700 leading-[1.2] text-foreground">
            {heading}
          </h2>
        </div>
        {status === "preparing" && (
          <div className="shrink-0 text-right">
            <p className="text-label font-700 text-muted">Ready in</p>
            <p className="animate-pulse font-display text-heading font-700 text-primary">
              ~{minutesLeft} mins
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 flex w-full items-center justify-between gap-1 overflow-x-auto pb-1">
        {STEPS.map((step, i) => {
          const state = stepState(step.id, status);
          return (
            <div key={step.id} className="contents">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`flex items-center justify-center rounded-full transition-colors ${
                    state === "done"
                      ? "h-8 w-8 bg-primary text-white"
                      : state === "active"
                        ? "h-9 w-9 border-2 border-primary bg-primary/20 text-primary"
                        : "h-7 w-7 bg-surface-elevated text-muted"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-sm ${
                      state === "active" && step.id === "preparing" ? "animate-spin" : ""
                    }`}
                    style={state !== "pending" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {step.icon}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-700 text-center ${
                    state === "pending"
                      ? "text-muted"
                      : state === "active"
                        ? "text-primary"
                        : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 min-w-[12px] flex-grow rounded-full transition-colors ${
                    state === "done" ? "bg-primary" : "bg-surface-elevated"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Order status: {heading}
      </span>
    </section>
  );
}
