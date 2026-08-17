"use client";

import { useState } from "react";
import type { SupabaseCampus } from "@/lib/supabase/data";

interface CampusSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campuses: SupabaseCampus[];
  selectedCampusId: string | null;
  onSelectCampus: (campus: SupabaseCampus) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  locationStatusMessage?: string;
}

export function CampusSelectorModal({
  isOpen,
  onClose,
  campuses,
  selectedCampusId,
  onSelectCampus,
  onDetectLocation,
  isDetectingLocation,
  locationStatusMessage,
}: CampusSelectorModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredCampuses = campuses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      (c.short_name && c.short_name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4 backdrop-blur-md transition-all">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-border bg-surface p-6 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-heading font-extrabold text-foreground">
              Choose Your Campus
            </h3>
            <p className="font-body text-caption text-muted">
              Select your college to discover open canteens & food stalls
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        {/* GPS Auto Detect Button */}
        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isDetectingLocation}
          className="mb-4 flex w-full items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3.5 text-left font-display text-body-sm font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span
              className={`material-symbols-outlined text-[22px] ${
                isDetectingLocation ? "animate-spin text-primary" : "text-primary"
              }`}
              aria-hidden="true"
            >
              {isDetectingLocation ? "progress_activity" : "my_location"}
            </span>
            <div>
              <p className="leading-tight">
                {isDetectingLocation ? "Detecting location..." : "Auto-Detect Campus via GPS"}
              </p>

            </div>
          </div>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            chevron_right
          </span>
        </button>

        {locationStatusMessage && (
          <p className="mb-3 text-caption font-medium text-warning text-center">
            {locationStatusMessage}
          </p>
        )}

        {/* Search Campus Input */}
        <div className="relative mb-4">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[20px]"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college name or city..."
            className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-10 pr-4 text-body-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
          />
        </div>

        {/* Campus List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredCampuses.map((cmp) => {
            const isSelected = cmp.id === selectedCampusId;
            return (
              <button
                key={cmp.id}
                type="button"
                onClick={() => {
                  onSelectCampus(cmp);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all ${
                  isSelected
                    ? "border border-primary bg-primary/10 text-primary shadow-glow-primary/20"
                    : "border border-border bg-surface-elevated text-foreground hover:border-muted hover:bg-border/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isSelected ? "text-primary" : "text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    location_city
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display text-body-sm font-bold text-foreground">
                        {cmp.name}
                      </p>
                      {cmp.short_name && (
                        <span className="rounded bg-surface px-1.5 py-0.5 font-display text-[10px] font-extrabold uppercase text-primary border border-border">
                          {cmp.short_name}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-caption text-muted">{cmp.city}</p>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="material-symbols-outlined text-[20px] text-primary"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                )}
              </button>
            );
          })}

          {filteredCampuses.length === 0 && (
            <div className="py-8 text-center">
              <p className="font-display text-caption font-bold text-muted">
                No campuses found matching &quot;{search}&quot;
              </p>
              <p className="mt-1 font-body text-caption text-faint">
                Contact your canteen administrator to onboard your university.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
