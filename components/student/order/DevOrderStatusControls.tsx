"use client";

import type { OrderStatus } from "@/types";

const PROGRESSION: OrderStatus[] = ["placed", "preparing", "ready"];

/**
 * Development-only mechanism to step an order through its lifecycle for
 * visual QA. This is explicitly NOT a stand-in for the real architecture
 * (Vendor dashboard → Supabase → Realtime → Student), which doesn't
 * exist yet — it directly calls updateOrderStatus on the local mock
 * store. Rendered only outside production builds and styled to never be
 * mistaken for part of the approved design (dashed border, "DEV" tag).
 */
export function DevOrderStatusControls({
  status,
  onSetStatus,
}: {
  status: OrderStatus;
  onSetStatus: (status: OrderStatus) => void;
}) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="rounded-xl border border-dashed border-warning/50 bg-warning-soft p-4">
      <p className="mb-2 text-label font-700 uppercase tracking-[0.1em] text-warning">
        Dev only — not real-time
      </p>
      <p className="mb-3 text-caption text-muted">
        Simulates a status update a vendor would trigger. Production status
        changes will come from Supabase Realtime, not this control.
      </p>
      <div className="flex gap-2">
        {PROGRESSION.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSetStatus(s)}
            className={`rounded-full px-4 py-1.5 text-caption font-700 capitalize transition-colors ${
              s === status
                ? "bg-primary text-on-primary"
                : "border border-border-subtle text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
