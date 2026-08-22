"use client";

import { useState, useEffect } from "react";
import type { CampusDirectoryItem } from "@/lib/supabase/superadmin_campuses";

interface CampusStatusModalProps {
  campus: CampusDirectoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStatus: (campusId: string, newStatus: string, reason: string) => Promise<boolean>;
}

export function CampusStatusModal({
  campus,
  isOpen,
  onClose,
  onSaveStatus,
}: CampusStatusModalProps) {
  const [status, setStatus] = useState("ACTIVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campus) {
      setStatus(campus.status || "ACTIVE");
      setReason("");
      setError(null);
    }
  }, [campus, isOpen]);

  if (!isOpen || !campus) return null;

  const isDeactivating = status === "INACTIVE" || status === "MAINTENANCE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeactivating && !reason.trim()) {
      setError("A mandatory explanation reason is required when deactivating or placing a campus in maintenance.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onSaveStatus(campus.id, status, reason);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update campus operational status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono text-orange-400 font-semibold">{campus.name}</span>
            <h2 className="text-xl font-bold text-white mt-1">Campus Operational Status</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Deactivation Warning Banner */}
        {isDeactivating && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-icons text-base text-rose-400">warning</span>
              Campus Operations Impact Warning
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              Deactivating or placing this campus in maintenance will temporarily block student order placement across all campus canteens. Historical orders, payments, and settlements remain 100% intact.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Operational Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-semibold text-orange-400 focus:outline-none focus:border-orange-500"
            >
              <option value="ACTIVE">ACTIVE (Fully Operational)</option>
              <option value="INACTIVE">INACTIVE (Deactivated)</option>
              <option value="MAINTENANCE">MAINTENANCE (Temporary Maintenance)</option>
              <option value="PRE_ONBOARDING">PRE_ONBOARDING (Under Onboarding)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
              Reason for Status Change {isDeactivating && <span className="text-rose-400">*</span>}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain rationale for changing campus operational status..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              required={isDeactivating}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
              Save Operational Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
