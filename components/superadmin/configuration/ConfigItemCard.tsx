"use client";

import type { PlatformConfigItem } from "@/lib/supabase/superadmin_configuration";

interface ConfigItemCardProps {
  item: PlatformConfigItem;
  onEdit: (item: PlatformConfigItem) => void;
  onViewHistory: (item: PlatformConfigItem) => void;
}

export function ConfigItemCard({ item, onEdit, onViewHistory }: ConfigItemCardProps) {
  const renderValueDisplay = () => {
    if (typeof item.value === "boolean") {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            item.value ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800" : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${item.value ? "bg-emerald-400" : "bg-rose-400"}`} />
          {item.value ? "ENABLED (TRUE)" : "DISABLED (FALSE)"}
        </span>
      );
    }

    if (item.valueType === "decimal" || item.valueType === "integer") {
      const isCurrency = item.key.includes("min_order") || item.key.includes("amount") || item.key.includes("threshold");
      const isPercent = item.key.includes("percent") || item.key.includes("commission");
      return (
        <span className="font-mono text-base font-bold text-white bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
          {isCurrency && "₹"}
          {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
          {isPercent && "%"}
        </span>
      );
    }

    if (typeof item.value === "object" && item.value !== null) {
      return (
        <pre className="font-mono text-[11px] text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800 max-h-24 overflow-auto">
          {JSON.stringify(item.value, null, 2)}
        </pre>
      );
    }

    return (
      <span className="font-mono text-sm font-semibold text-orange-400 bg-zinc-950 px-3 py-1 rounded border border-zinc-800">
        {String(item.value)}
      </span>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-zinc-700 transition-all flex flex-col justify-between">
      {/* Top Bar: Key & Badges */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-zinc-300 bg-zinc-950 px-2.5 py-0.5 rounded border border-zinc-800">
              {item.key}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase bg-zinc-800 px-2 py-0.5 rounded">
              {item.valueType}
            </span>
          </div>

          {item.isHighImpact && (
            <span className="bg-rose-950/60 border border-rose-800 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span className="material-icons text-xs text-rose-400">warning</span>
              High Impact
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">{item.description}</p>
      </div>

      {/* Middle Bar: Value Display */}
      <div className="space-y-3 pt-2 border-t border-zinc-800/80">
        <div>
          <div className="text-[10px] uppercase font-semibold text-zinc-500 mb-1.5">Current Value</div>
          {renderValueDisplay()}
        </div>

        {/* Impact warning banner if present */}
        {item.impactWarning && (
          <div className="p-2.5 bg-rose-950/30 border border-rose-900/50 rounded-lg text-[11px] text-rose-300 flex items-start gap-2">
            <span className="material-icons text-sm text-rose-400 shrink-0 mt-0.5">info</span>
            <span>{item.impactWarning}</span>
          </div>
        )}

        {/* Used By Modules Chips */}
        {item.usedByModules && item.usedByModules.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Used By:</span>
            {item.usedByModules.map((m, idx) => (
              <span
                key={idx}
                className="text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-800/80 px-2 py-0.5 rounded"
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer: Actions */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewHistory(item)}
          className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
          title="View configuration audit history"
        >
          <span className="material-icons text-xs">history</span>
          History
        </button>

        <button
          onClick={() => onEdit(item)}
          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
        >
          <span className="material-icons text-xs">edit</span>
          Edit Setting
        </button>
      </div>
    </div>
  );
}
