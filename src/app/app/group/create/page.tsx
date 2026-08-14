"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/store/auth";
import { Canteen, TimeSlot } from "@/lib/types/database";
import { SlotPicker } from "@/components/ui/SlotPicker";

export default function CreateGroupOrderPage() {
  const { student } = useAuth();
  const router = useRouter();

  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/canteens")
      .then((res) => res.json())
      .then((data) => {
        if (data.canteens && data.canteens.length > 0) {
          setCanteens(data.canteens);
          setSelectedCanteenId(data.canteens[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedCanteenId) {
      fetch(`/api/canteens/${selectedCanteenId}/menu`)
        .then((res) => res.json())
        .then((data) => {
          setTimeSlots(data.timeSlots || []);
          if (data.timeSlots && data.timeSlots.length > 0) {
            setSelectedSlotId(data.timeSlots[0].id);
          }
        });
    }
  }, [selectedCanteenId]);

  const handleCreate = async () => {
    if (!selectedCanteenId || !selectedSlotId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/group-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: student?.id,
          student_name: student?.name || "Host",
          canteen_id: selectedCanteenId,
          time_slot_id: selectedSlotId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/app/group/${data.groupOrder.share_code}`);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-6 pb-20">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href="/app"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-2 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Create Group Order</h1>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
          <h2 className="text-sm font-semibold text-accent mb-1">👥 Group Ordering</h2>
          <p className="text-xs text-text-secondary">
            Order together with friends! Create a group order, share the unique link/code, and combine your items into one pickup slot.
          </p>
        </div>

        {/* Select Canteen */}
        <div>
          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Select Canteen
          </label>
          <div className="space-y-2">
            {canteens.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCanteenId(c.id)}
                className={`
                  w-full text-left rounded-xl border p-4 transition-all duration-200
                  ${
                    selectedCanteenId === c.id
                      ? "border-accent bg-accent/10 shadow-[0_0_0_1px_theme(colors.accent)]"
                      : "border-border bg-surface hover:bg-surface-2"
                  }
                `}
              >
                <p className={`text-sm font-semibold ${selectedCanteenId === c.id ? "text-accent" : "text-text"}`}>
                  {c.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{c.location_desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Select Slot */}
        <div>
          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Select Pickup Slot
          </label>
          <SlotPicker
            slots={timeSlots}
            selectedId={selectedSlotId}
            onSelect={setSelectedSlotId}
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !selectedSlotId}
          className="
            w-full rounded-2xl bg-accent px-6 py-4
            text-bg font-semibold text-base
            hover:bg-accent-dim active:scale-[0.98]
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-[0_8px_32px_rgba(255,109,0,0.3)]
          "
        >
          {loading ? "Creating..." : "Create Group & Share Link"}
        </button>
      </div>
    </div>
  );
}
