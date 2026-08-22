"use client";

import { useState } from "react";
import type { IncidentSeverity } from "@/lib/supabase/superadmin_incidents";

interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIncident: (payload: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    category: string;
    affectedService: string;
    customerImpact?: string;
  }) => Promise<boolean>;
}

export function CreateIncidentModal({ isOpen, onClose, onCreateIncident }: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("SEV2");
  const [category, setCategory] = useState("SYSTEM");
  const [affectedService, setAffectedService] = useState("Core Platform");
  const [customerImpact, setCustomerImpact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onCreateIncident({
        title,
        description,
        severity,
        category,
        affectedService,
        customerImpact,
      });

      if (success) {
        setTitle("");
        setDescription("");
        setSeverity("SEV2");
        setCustomerImpact("");
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-icons text-rose-400">warning</span>
            <h2 className="text-lg font-bold text-white">Declare Platform Incident</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <span className="material-icons">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
            <span className="material-icons text-sm text-rose-400">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-300 uppercase mb-1">Incident Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cashfree UPI Gateway Failure Spike"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-orange-400 font-bold focus:outline-none"
              >
                <option value="SEV1">SEV1 (Critical Outage)</option>
                <option value="SEV2">SEV2 (High Impact)</option>
                <option value="SEV3">SEV3 (Moderate Degraded)</option>
                <option value="SEV4">SEV4 (Minor Anomaly)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
              >
                <option value="SYSTEM">SYSTEM</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="VENDOR">VENDOR</option>
                <option value="ORDER">ORDER</option>
                <option value="SECURITY">SECURITY</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 uppercase mb-1">Affected Service</label>
              <input
                type="text"
                value={affectedService}
                onChange={(e) => setAffectedService(e.target.value)}
                placeholder="e.g. Cashfree UPI"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 uppercase mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe symptoms, telemetry signals, and initial findings..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 uppercase mb-1">Customer / Student Impact</label>
            <textarea
              rows={2}
              value={customerImpact}
              onChange={(e) => setCustomerImpact(e.target.value)}
              placeholder="Summary of external customer impact..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-1"
            >
              {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
              Declare Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
