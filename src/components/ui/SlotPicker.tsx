"use client";

import { TimeSlot } from "@/lib/types/database";

export function SlotPicker({
  slots,
  selectedId,
  onSelect,
}: {
  slots: TimeSlot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-text-muted">No time slots available</p>
    );
  }

  return (
    <div className="flex gap-3">
      {slots.map((slot) => {
        const isSelected = slot.id === selectedId;
        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => onSelect(slot.id)}
            className={`
              flex-1 rounded-xl border px-4 py-3
              transition-all duration-200 ease-out
              ${
                isSelected
                  ? "border-accent bg-accent/10 shadow-[0_0_0_1px_theme(colors.accent)]"
                  : "border-border bg-surface hover:border-accent/40 hover:bg-surface-2"
              }
            `}
          >
            <p
              className={`text-sm font-semibold ${
                isSelected ? "text-accent" : "text-text"
              }`}
            >
              {slot.name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-text-secondary">
              {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
