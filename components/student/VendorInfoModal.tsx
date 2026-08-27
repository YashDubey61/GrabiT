"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";

export interface VendorInfoData {
  name: string;
  description: string;
  avgPrepMinutes: number;
  rating: number;
  ratingCount: string;
  isOpen: boolean;
  operatingHours: string | null;
  pickupLocation: string | null;
  campusName: string | null;
}

/** Vendor info panel — reuses the shared Modal primitive, filled entirely
 * from the vendor record already loaded for this page (no hardcoded copy). */
export function VendorInfoModal({
  open,
  onClose,
  vendor,
}: {
  open: boolean;
  onClose: () => void;
  vendor: VendorInfoData;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: "timer", label: "Avg prep time", value: `${vendor.avgPrepMinutes} mins` },
    {
      icon: "star",
      label: "Rating",
      value: `${vendor.rating}${
        vendor.ratingCount && vendor.ratingCount !== "Live" ? ` (${vendor.ratingCount})` : ""
      }`,
    },
  ];
  if (vendor.operatingHours) {
    rows.push({ icon: "schedule", label: "Operating hours", value: vendor.operatingHours });
  }
  if (vendor.pickupLocation) {
    rows.push({ icon: "location_on", label: "Pickup location", value: vendor.pickupLocation });
  }
  if (vendor.campusName) {
    rows.push({ icon: "school", label: "Campus", value: vendor.campusName });
  }

  return (
    <Modal open={open} onClose={onClose} glass>
      <div role="dialog" aria-modal="true" aria-labelledby="vendor-info-title">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="vendor-info-title"
            className="text-display-sm font-bold text-foreground"
          >
            {vendor.name}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            aria-label="Close vendor information"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <span
          className={`mb-4 inline-block rounded-full border px-3 py-1 text-label font-700 uppercase ${
            vendor.isOpen
              ? "border-primary/40 bg-primary/20 text-primary"
              : "border-border bg-surface text-muted"
          }`}
        >
          {vendor.isOpen ? "Open Now" : "Closed"}
        </span>

        {vendor.description && (
          <p className="mb-4 text-body-sm leading-relaxed text-muted">{vendor.description}</p>
        )}

        <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <span
                className="material-symbols-outlined mt-0.5 text-[20px] text-primary"
                aria-hidden="true"
              >
                {row.icon}
              </span>
              <div>
                <p className="text-label font-700 uppercase tracking-[0.06em] text-muted">
                  {row.label}
                </p>
                <p className="text-body-sm text-foreground">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
