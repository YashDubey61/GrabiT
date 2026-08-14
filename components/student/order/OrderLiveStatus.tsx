"use client";

import { useEffect, useState } from "react";
import type { OrderStatus } from "@/types";

type StepId = "placed" | "accepted" | "preparing" | "ready";

const STEPS: { id: StepId; label: string; icon: string }[] = [
  { id: "placed", label: "Placed", icon: "check" },
  { id: "accepted", label: "Accepted", icon: "check" },
  { id: "preparing", label: "Preparing", icon: "restaurant" },
  { id: "ready", label: "Ready", icon: "inventory_2" },
];

/**
 * Maps the domain's 3-value OrderStatus onto the Stitch design's 4-node
 * stepper. There is no "accepted" status in the domain model (PRD/TRD
 * only define placed → preparing → ready) — rather than inventing one,
 * "Accepted" is treated as implicit: by definition, an order can't be
 * `preparing` without having been accepted first, so that node completes
 * together with the transition out of `placed`. This is a UI mapping
 * decision, not a new business state.
 */
function stepState(step: StepId, status: OrderStatus): "done" | "active" | "pending" {
  const order: StepId[] = ["placed", "accepted", "preparing", "ready"];
  const currentIndex = status === "placed" ? 0 : status === "preparing" ? 2 : 3;
  const stepIndex = order.indexOf(step);
  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

function headingFor(status: OrderStatus): { eyebrow: string; heading: string } {
  switch (status) {
    case "placed":
      return { eyebrow: "Live Tracking", heading: "Order Received" };
    case "preparing":
      return { eyebrow: "Live Tracking", heading: "Preparing Your Meal" };
    default:
      return { eyebrow: "Live Tracking", heading: "Ready for Pickup!" };
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

  // Ticks every 30s while preparing so "Ready in ~N mins" counts down —
  // the PRD's "feel like a live process" requirement, without pretending
  // this is a Realtime subscription.
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
          <p className="mb-1 text-label font-700 uppercase tracking-[0.14em] text-primary">
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

      <div className="mt-2 flex w-full items-center justify-between">
        {STEPS.map((step, i) => {
          const state = stepState(step.id, status);
          return (
            <div key={step.id} className="contents">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex items-center justify-center rounded-full transition-colors ${
                    state === "done"
                      ? "h-8 w-8 bg-primary text-white"
                      : state === "active"
                        ? "h-10 w-10 border-2 border-primary bg-primary/20 text-primary"
                        : "h-8 w-8 bg-surface-elevated text-muted"
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
                  className={`text-[10px] font-700 ${
                    state === "pending" ? "text-muted" : state === "active" ? "text-primary" : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-grow rounded-full transition-colors ${
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
