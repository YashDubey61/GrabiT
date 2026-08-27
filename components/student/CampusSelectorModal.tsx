"use client";

import { useState } from "react";
import type { SupabaseCampus } from "@/lib/supabase/data";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface CampusSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  campuses: SupabaseCampus[];
  selectedCampusId: string | null;
  onSelectCampus: (campus: SupabaseCampus) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
  locationStatusMessage?: string;
  /** Set only for a 1–5km GPS match — shown as an explicit confirm step instead of switching automatically. */
  pendingConfirmCampus?: { campus: SupabaseCampus; distanceMeters: number } | null;
  onConfirmDetectedCampus?: () => void;
  onDismissConfirm?: () => void;
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
  pendingConfirmCampus,
  onConfirmDetectedCampus,
  onDismissConfirm,
}: CampusSelectorModalProps) {
  const [search, setSearch] = useState("");

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const filteredCampuses = campuses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      (c.short_name && c.short_name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md transition-all p-3 pb-[max(2rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))] sm:items-center sm:p-4 sm:pb-4">
      <div className="w-full max-w-md max-h-[75dvh] flex flex-col rounded-3xl border border-border bg-surface p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2 shrink-0">
          <div>
            <h3 className="font-display text-body-lg sm:text-heading font-extrabold text-foreground tracking-tight">
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
            className="rounded-full p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors shrink-0"
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
          className="mb-3 flex w-full shrink-0 items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-left font-display text-body-sm font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`material-symbols-outlined text-[20px] ${
                isDetectingLocation ? "animate-spin text-primary" : "text-primary"
              }`}
              aria-hidden="true"
            >
              {isDetectingLocation ? "progress_activity" : "my_location"}
            </span>
            <span className="leading-tight">
              {isDetectingLocation ? "Detecting your campus…" : "Auto-Detect Campus via GPS"}
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            chevron_right
          </span>
        </button>

        {/* Pending Confirmation Banner (1–5km range) */}
        {pendingConfirmCampus && (
          <div className="mb-3 shrink-0 rounded-xl border border-primary/40 bg-primary/10 p-3">
            <p className="font-display text-body-sm font-bold text-foreground">
              You seem to be near {pendingConfirmCampus.campus.name}
            </p>
            <p className="mt-0.5 text-caption text-muted">
              About {(pendingConfirmCampus.distanceMeters / 1000).toFixed(1)} km away. Use this campus?
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={onConfirmDetectedCampus}
                className="flex-1 rounded-xl bg-primary py-2 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary transition-all hover:opacity-90 active:scale-95"
              >
                Yes, use this campus
              </button>
              <button
                type="button"
                onClick={onDismissConfirm}
                className="rounded-xl border border-border px-3.5 py-2 font-display text-caption font-bold text-muted hover:text-foreground"
              >
                No
              </button>
            </div>
          </div>
        )}

        {/* Location Status Alert (shown only after user attempts GPS detection) */}
        {locationStatusMessage && (
          <div className="mb-3 shrink-0 rounded-xl border border-warning/30 bg-warning/10 p-2.5 text-caption font-medium text-warning flex items-center justify-center gap-2 text-center">
            <span className="material-symbols-outlined text-[16px] shrink-0">location_off</span>
            <span>{locationStatusMessage}</span>
          </div>
        )}

        {/* Search Campus Input */}
        <div className="relative mb-3 shrink-0">
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[18px]"
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college name or city..."
            className="w-full rounded-xl border border-border bg-surface-elevated py-2 pl-9 pr-3 text-caption text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
          />
        </div>

        {/* Campus List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 pb-2">
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
                className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all ${
                  isSelected
                    ? "border border-primary bg-primary/10 text-primary"
                    : "border border-border-subtle bg-surface-elevated text-foreground hover:border-muted hover:bg-border/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isSelected ? "text-primary" : "text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    location_city
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-body-sm font-bold text-foreground">
                        {cmp.name}
                      </p>
                      {cmp.short_name && (
                        <span className="rounded bg-surface px-1.5 py-0.5 font-display text-[9px] font-extrabold uppercase text-primary border border-border-subtle">
                          {cmp.short_name}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-[11px] text-muted">{cmp.city}</p>
                  </div>
                </div>

                {isSelected && (
                  <span
                    className="material-symbols-outlined text-[18px] text-primary shrink-0"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                )}
              </button>
            );
          })}

          {filteredCampuses.length === 0 && (
            <div className="py-6 text-center">
              <span className="material-symbols-outlined text-[28px] text-muted mb-1">
                search_off
              </span>
              <p className="font-display text-caption font-bold text-muted">
                No campuses found matching &quot;{search}&quot;
              </p>
              <p className="mt-0.5 font-body text-[11px] text-faint">
                Try searching for another college or city.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
