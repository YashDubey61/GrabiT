"use client";

import type { InventoryLogItem } from "@/lib/supabase/vendor_inventory";

export interface VendorInventoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: InventoryLogItem[];
  isLoading?: boolean;
}

export function VendorInventoryHistoryModal({
  isOpen,
  onClose,
  logs,
  isLoading = false,
}: VendorInventoryHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Inventory Audit Logs
            </h3>
            <p className="text-caption text-muted">
              Recent stock adjustments, order deductions, and restock records
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted">
              <span className="material-symbols-outlined text-[24px] animate-spin mr-2">
                progress_activity
              </span>
              Loading history...
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-border bg-background p-8 text-center text-caption text-muted">
              No inventory adjustment logs found yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-display text-body-sm font-bold text-foreground">
                      {log.menuItemName}
                    </span>
                    <div className="flex items-center gap-2 text-caption text-muted">
                      <span className="capitalize">{log.adjustmentType.replace(/_/g, " ")}</span>
                      {log.reason && <span>• {log.reason}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-body-sm font-bold">
                        <span className="text-muted">{log.previousQuantity}</span> →{" "}
                        <span className="text-foreground">{log.newQuantity}</span>
                      </div>
                      <span
                        className={`font-mono text-caption font-extrabold ${
                          log.quantityChanged > 0
                            ? "text-emerald-400"
                            : log.quantityChanged < 0
                              ? "text-danger"
                              : "text-muted"
                        }`}
                      >
                        {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                      </span>
                    </div>
                    <span className="text-[11px] text-faint whitespace-nowrap">
                      {new Date(log.createdAtIso).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 font-display text-caption font-bold text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
