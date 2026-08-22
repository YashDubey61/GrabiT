"use client";

import { useState, useEffect } from "react";
import type { PlatformConfigItem } from "@/lib/supabase/superadmin_configuration";

interface ConfigEditModalProps {
  item: PlatformConfigItem | null;
  onClose: () => void;
  onSave: (key: string, newValue: any, reason: string) => Promise<boolean>;
}

export function ConfigEditModal({ item, onClose, onSave }: ConfigEditModalProps) {
  const [newValue, setNewValue] = useState<any>("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      if (typeof item.value === "object" && item.value !== null) {
        setNewValue(JSON.stringify(item.value, null, 2));
      } else {
        setNewValue(item.value);
      }
      setReason("");
      setError(null);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (item.isHighImpact && !reason.trim()) {
      setError("A mandatory explanation reason is required for high-impact configuration changes.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onSave(item.key, newValue, reason);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderValueInput = () => {
    if (item.valueType === "boolean") {
      return (
        <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
            <input
              type="radio"
              name="boolVal"
              checked={newValue === true}
              onChange={() => setNewValue(true)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span className="font-semibold text-emerald-400">ENABLED (TRUE)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
            <input
              type="radio"
              name="boolVal"
              checked={newValue === false}
              onChange={() => setNewValue(false)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span className="font-semibold text-rose-400">DISABLED (FALSE)</span>
          </label>
        </div>
      );
    }

    if (item.valueType === "enum" && item.key === "vendor_default_operating_status") {
      return (
        <select
          value={String(newValue)}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
        >
          <option value="active">active (Canteen Open)</option>
          <option value="paused">paused (Temporarily Paused)</option>
          <option value="closed">closed (Closed for Operations)</option>
        </select>
      );
    }

    if (item.valueType === "json") {
      return (
        <textarea
          rows={4}
          value={typeof newValue === "string" ? newValue : JSON.stringify(newValue, null, 2)}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
          placeholder="JSON payload..."
        />
      );
    }

    return (
      <input
        type={item.valueType === "integer" || item.valueType === "decimal" ? "number" : "text"}
        step={item.valueType === "decimal" ? "0.01" : "1"}
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg font-mono text-sm text-zinc-200 focus:outline-none focus:border-orange-500"
        placeholder={`Enter new ${item.valueType} value...`}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded font-semibold">
                {item.key}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Edit Platform Setting</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* High Impact Warning Banner */}
        {item.isHighImpact && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-icons text-base text-rose-400">warning</span>
              Platform Impact Warning
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              {item.impactWarning || "Changing this setting may affect live platform transactions and financial calculations."}
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
          {/* Current vs New */}
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold text-zinc-500 uppercase mb-1">Current Value</div>
              <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-400">
                {JSON.stringify(item.value)}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold text-zinc-400 uppercase mb-1">New Value</div>
              {renderValueInput()}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
              Reason for Change {item.isHighImpact && <span className="text-rose-400">*</span>}
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain rationale for changing this platform rule..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              required={item.isHighImpact}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
              Save Setting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
