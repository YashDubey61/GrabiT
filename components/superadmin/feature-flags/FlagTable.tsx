"use client";

import type { FeatureFlagItem, FlagStatus } from "@/lib/supabase/superadmin_feature_flags";

interface FlagTableProps {
  flags: FeatureFlagItem[];
  onSelectFlag: (flag: FeatureFlagItem) => void;
  onViewHistory: (flag: FeatureFlagItem) => void;
  onKillSwitch: (flag: FeatureFlagItem) => void;
  loading?: boolean;
}

export function FlagTable({
  flags,
  onSelectFlag,
  onViewHistory,
  onKillSwitch,
  loading,
}: FlagTableProps) {
  const getStatusBadge = (status: FlagStatus) => {
    switch (status) {
      case "ENABLED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "ROLLOUT":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "SCHEDULED":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "DISABLED":
      default:
        return "bg-zinc-800/80 text-zinc-400 border-zinc-700";
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "text-rose-400 font-bold";
      case "HIGH":
        return "text-orange-400 font-semibold";
      case "MEDIUM":
        return "text-amber-400 font-medium";
      case "LOW":
      default:
        return "text-emerald-400 font-normal";
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!flags || flags.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">flag_circle</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Feature Flags Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No feature flags match your search query or applied status/category filters. Try adjusting your filters or creating a new flag.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Feature Name & Key</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Rollout %</th>
              <th className="py-3.5 px-4">Target Scope</th>
              <th className="py-3.5 px-4">Env</th>
              <th className="py-3.5 px-4">Risk Level</th>
              <th className="py-3.5 px-4">Last Updated</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {flags.map((flag) => {
              const updatedAtStr = new Date(flag.updatedAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <tr
                  key={flag.id || flag.key}
                  className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectFlag(flag)}
                >
                  {/* Name & Key */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">{flag.name}</span>
                      {flag.isHighImpact && (
                        <span className="material-icons text-xs text-rose-400" title="High Impact Feature Flag">
                          warning
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-orange-400 mt-0.5">{flag.key}</div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {flag.category}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(flag.status)}`}>
                      {flag.status}
                    </span>
                  </td>

                  {/* Rollout % */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-zinc-200 font-semibold">
                    {flag.rolloutPercentage}%
                  </td>

                  {/* Target Scope */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                    {flag.targetScope}
                  </td>

                  {/* Env */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-[10px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded uppercase">
                      {flag.environment}
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-xs ${getRiskBadge(flag.riskLevel)}`}>{flag.riskLevel}</span>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-zinc-300 font-mono">{updatedAtStr}</div>
                    <div className="text-[10px] text-zinc-500">{flag.updatedByName || "Super Admin"}</div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(flag);
                      }}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                      title="View audit history"
                    >
                      History
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFlag(flag);
                      }}
                      className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                    >
                      Edit
                    </button>

                    {flag.status !== "DISABLED" && flag.isHighImpact && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onKillSwitch(flag);
                        }}
                        className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs font-bold transition-colors"
                        title="Emergency Kill Switch: Immediately disable in production"
                      >
                        Kill Switch
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Activity Cards View */}
      <div className="block md:hidden divide-y divide-zinc-800">
        {flags.map((flag) => (
          <div
            key={flag.id || flag.key}
            onClick={() => onSelectFlag(flag)}
            className="p-4 hover:bg-zinc-800/30 transition-colors space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(flag.status)}`}>
                {flag.status} ({flag.rolloutPercentage}%)
              </span>
              <span className="text-[10px] font-mono text-purple-300 uppercase bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                {flag.environment}
              </span>
            </div>

            <div>
              <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                {flag.name}
                {flag.isHighImpact && <span className="material-icons text-xs text-rose-400">warning</span>}
              </div>
              <div className="font-mono text-xs text-orange-400 mt-0.5">{flag.key}</div>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{flag.description}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
              <div>
                <span className="text-zinc-500">Category:</span> {flag.category}
              </div>
              <div>
                <span className="text-zinc-500">Scope:</span> <span className="font-mono text-zinc-300">{flag.targetScope}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
