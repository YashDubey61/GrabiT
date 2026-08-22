"use client";

import { useEffect, useState } from "react";
import type { FeatureFlagItem } from "@/lib/supabase/superadmin_feature_flags";
import type { AuditLogEntry } from "@/lib/supabase/superadmin_audit";

interface FlagHistoryModalProps {
  flag: FeatureFlagItem | null;
  onClose: () => void;
  onRollback: (flagKey: string, targetState: any, reason: string) => Promise<boolean>;
}

export function FlagHistoryModal({ flag, onClose, onRollback }: FlagHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [rollbackTarget, setRollbackTarget] = useState<AuditLogEntry | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flag) return;

    let isMounted = true;
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/superadmin/feature-flags/history?flagKey=${flag?.key}`);
        const data = await res.json();
        if (isMounted && data.ok) {
          setHistory(data.history);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [flag]);

  if (!flag) return null;

  const handleExecuteRollback = async () => {
    if (!rollbackTarget) return;
    if (!rollbackReason.trim()) {
      setError("A mandatory reason explanation is required when performing a feature flag rollback.");
      return;
    }

    const targetState = rollbackTarget.newState || rollbackTarget.previousState;
    if (!targetState) {
      setError("Unable to resolve historical feature flag configuration state from selected log entry.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const success = await onRollback(flag.key, targetState, rollbackReason);
      if (success) {
        setRollbackTarget(null);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to execute feature flag rollback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="text-xs font-mono text-orange-400 bg-orange-950/40 border border-orange-800/60 px-2 py-0.5 rounded font-semibold">
              {flag.key}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Feature Flag Audit Trail History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Rollback Prompt Confirmation Sub-Panel */}
        {rollbackTarget && (
          <div className="p-4 bg-orange-950/40 border border-orange-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-orange-300 text-xs font-bold uppercase tracking-wider">
              <span className="material-icons text-base text-orange-400">restore</span>
              Confirm Feature Flag Rollback
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono">
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Current Status:</span>
                <div className="text-zinc-200 mt-0.5">{flag.status} ({flag.rolloutPercentage}%)</div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase text-[10px]">Restore Configuration:</span>
                <div className="text-emerald-400 font-bold mt-0.5">
                  {JSON.stringify(rollbackTarget.newState || rollbackTarget.previousState)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Reason for Rollback <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Mandatory explanation for restoring historical feature flag state..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            {error && <div className="text-xs text-rose-400 font-medium">{error}</div>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRollbackTarget(null)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={submitting}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded text-xs flex items-center gap-1 shadow-sm"
              >
                {submitting && <span className="material-icons text-xs animate-spin">sync</span>}
                Execute Rollback
              </button>
            </div>
          </div>
        )}

        {/* History List */}
        {loading ? (
          <div className="space-y-3 py-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-16 bg-zinc-950/60 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <span className="material-icons text-4xl text-zinc-600 mb-2">history_toggle_off</span>
            <p className="text-sm">No historical audit log mutations recorded yet for {flag.key}.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {history.map((evt) => {
              const dt = new Date(evt.createdAt);
              const prevVal = evt.previousState;
              const nextVal = evt.newState;

              return (
                <div
                  key={evt.id}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-orange-400 uppercase">
                        {evt.action}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {dt.toLocaleDateString()} {dt.toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setRollbackTarget(evt);
                        setRollbackReason("");
                        setError(null);
                      }}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-orange-950/60 text-zinc-300 hover:text-orange-300 border border-zinc-800 hover:border-orange-800 text-[11px] font-semibold rounded transition-colors flex items-center gap-1"
                    >
                      <span className="material-icons text-xs">restore</span>
                      Rollback to this
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div>
                      <span className="text-zinc-500 text-[10px]">BEFORE:</span>{" "}
                      <span className="text-rose-400">{JSON.stringify(prevVal)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px]">AFTER:</span>{" "}
                      <span className="text-emerald-400">{JSON.stringify(nextVal)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 pt-1 border-t border-zinc-900">
                    <span className="text-zinc-500">Reason:</span> {evt.reason || "No explanation provided"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
