"use client";

import { useState } from "react";

export interface VendorPrepTimeSectionProps {
  currentPrepTimeMinutes: number;
  onSave: (minutes: number) => Promise<void>;
}

export function VendorPrepTimeSection({
  currentPrepTimeMinutes,
  onSave,
}: VendorPrepTimeSectionProps) {
  const [prepMinutes, setPrepMinutes] = useState(currentPrepTimeMinutes);
  const [isSaving, setIsSaving] = useState(false);

  const quickPicks = [10, 15, 20, 25, 30, 45];

  const handleSelectQuickPick = async (mins: number) => {
    setPrepMinutes(mins);
    setIsSaving(true);
    await onSave(mins);
    setIsSaving(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(prepMinutes);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Preparation Time Settings
          </h3>
          <p className="text-caption text-muted">
            Estimated food preparation time shown to students at checkout and live tracking
          </p>
        </div>
        <div className="flex items-center gap-1 text-primary font-display font-extrabold text-title">
          <span>{prepMinutes}</span>
          <span className="text-caption font-bold text-muted">mins</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-display text-caption font-bold text-muted">
          Quick Select Preparation Time
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {quickPicks.map((mins) => {
            const isSelected = prepMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                disabled={isSaving}
                onClick={() => handleSelectQuickPick(mins)}
                className={`rounded-xl border py-3 font-display text-body-sm font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary border-primary shadow-glow-primary"
                    : "border-border/60 bg-background/50 text-foreground hover:bg-background"
                }`}
              >
                {mins} mins
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Custom Preparation Time (Minutes)
        </label>
        <input
          type="number"
          min={5}
          max={120}
          value={prepMinutes}
          onChange={(e) => setPrepMinutes(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-background p-3 text-body-sm font-mono text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-primary px-6 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Preparation Time"}
        </button>
      </div>
    </form>
  );
}
