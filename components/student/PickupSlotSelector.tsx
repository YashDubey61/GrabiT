"use client";

// PRD §7.1 defines Short Break / Lunch time-slot ordering; the approved
// Checkout Stitch export renders that as concrete pickup times (ASAP +
// three clock times) rather than the two named slots — this follows the
// design as built, not the PRD's more abstract slot names. Local UI state
// only, per Day 3 scope — nothing is sent anywhere.
const PICKUP_SLOTS = ["ASAP", "12:30 PM", "1:00 PM", "1:30 PM"] as const;
export type PickupSlot = (typeof PICKUP_SLOTS)[number];

export function PickupSlotSelector({
  selected,
  onSelect,
}: {
  selected: PickupSlot;
  onSelect: (slot: PickupSlot) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-label font-700 uppercase tracking-[0.08em] text-muted">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          schedule
        </span>
        Pickup Slot
      </h2>
      <div
        role="radiogroup"
        aria-label="Pickup slot"
        className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PICKUP_SLOTS.map((slot) => {
          const isSelected = slot === selected;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(slot)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-6 py-3 text-caption font-700 transition-all ${
                isSelected
                  ? "border-transparent bg-primary text-on-primary"
                  : "border-border-subtle text-muted hover:bg-surface-elevated"
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </section>
  );
}
