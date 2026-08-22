"use client";

import type { IncidentSignalItem } from "@/lib/supabase/superadmin_incidents";

interface IncidentSignalsPanelProps {
  signals: IncidentSignalItem[];
  onDeclareFromSignal: (signal: IncidentSignalItem) => void;
}

export function IncidentSignalsPanel({ signals, onDeclareFromSignal }: IncidentSignalsPanelProps) {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons text-amber-400">sensors</span>
          <h3 className="text-base font-bold text-white">Automated Anomaly Signal Telemetry</h3>
        </div>
        <span className="text-xs font-mono text-zinc-400">{signals.length} Signals Detected</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((sig) => (
          <div
            key={sig.id}
            className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3 hover:border-zinc-700 transition-colors shadow-md flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950/80 text-rose-300 border border-rose-800">
                  {sig.severityRecommendation}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{sig.currentValue}</span>
              </div>

              <h4 className="text-sm font-bold text-white">{sig.signal}</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">{sig.evidence}</p>

              <div className="text-[11px] font-mono text-zinc-400">
                Baseline: {sig.baseline} | Service: {sig.affectedService}
              </div>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Human-in-the-loop Guard</span>
              <button
                onClick={() => onDeclareFromSignal(sig)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded transition-colors text-xs flex items-center gap-1"
              >
                <span className="material-icons text-xs">add_alert</span>
                Declare Incident
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
