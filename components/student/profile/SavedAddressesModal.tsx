"use client";

import { useState, useEffect, useCallback } from "react";
import { type SavedAddress, getLiveStudentAddresses, createStudentAddress, deleteStudentAddress } from "@/lib/supabase/student_addresses";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface SavedAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedAddressesModal({ isOpen, onClose }: SavedAddressesModalProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("Hostel");
  const [addressLine, setAddressLine] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    const list = await getLiveStudentAddresses();
    setAddresses(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAddresses();
    }
  }, [isOpen, loadAddresses]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressLine.trim()) {
      setError("Please enter address line.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createStudentAddress({
      label,
      addressLine: addressLine.trim(),
      city: "Kanpur",
      isDefault: addresses.length === 0,
    });

    if (res.ok && res.address) {
      setAddresses((prev) => [res.address!, ...prev]);
      setAddressLine("");
      setIsAdding(false);
    } else {
      setError(res.error || "Failed to save address.");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    const res = await deleteStudentAddress(id);
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 pb-[calc(5rem+var(--safe-area-inset-bottom))] sm:p-4 sm:pb-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border-subtle bg-surface-elevated p-6 shadow-2xl max-h-[calc(100dvh-8rem)] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              location_on
            </span>
            <h3 className="font-display text-title font-bold text-foreground">
              Saved Delivery Spots
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:text-foreground active:scale-95"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-caption font-medium text-danger">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-caption font-medium text-muted animate-pulse">
              Loading saved addresses...
            </div>
          ) : addresses.length === 0 && !isAdding ? (
            <div className="rounded-xl border border-border-subtle bg-background p-6 text-center">
              <span className="material-symbols-outlined text-[36px] text-muted mb-2">
                home_pin
              </span>
              <p className="text-body-sm text-muted">No saved addresses found.</p>
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-caption font-bold text-on-primary shadow-glow-primary"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Delivery Spot
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-border-subtle bg-background p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">
                      {a.label === "Home" ? "home" : a.label === "Hostel" ? "apartment" : "location_on"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-caption font-bold text-foreground">
                          {a.label}
                        </span>
                        {a.isDefault && (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-muted">{a.addressLine}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="rounded-full p-1.5 text-muted hover:text-danger active:scale-95"
                    aria-label="Delete address"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}

              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-3 text-caption font-bold text-primary hover:bg-primary/10"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add New Delivery Spot
                </button>
              )}
            </div>
          )}

          {/* Add Address Form */}
          {isAdding && (
            <form onSubmit={handleAddAddress} className="rounded-xl border border-primary/30 bg-background p-4 space-y-3 mt-4">
              <h4 className="font-display text-caption font-bold text-foreground">Add Delivery Spot</h4>
              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">Spot Label</label>
                <div className="flex gap-2">
                  {["Hostel", "Home", "Other"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`flex-1 rounded-lg py-1.5 text-caption font-bold border transition-colors ${
                        label === l
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-subtle bg-surface-elevated text-muted"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="address-line" className="block text-[11px] font-bold text-muted mb-1">
                  Address Line / Room / Spot
                </label>
                <input
                  id="address-line"
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="e.g. Block B, Room 204 or Main Gate Spot"
                  required
                  className="w-full rounded-xl border border-border-subtle bg-surface-elevated px-3 py-2 text-caption text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-lg px-3 py-1.5 text-caption font-bold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-1.5 text-caption font-bold text-on-primary shadow-glow-primary"
                >
                  {isSubmitting ? "Saving..." : "Save Spot"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
