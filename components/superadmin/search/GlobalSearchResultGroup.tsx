"use client";

import Link from "next/link";
import type { GlobalSearchResultItem } from "@/lib/supabase/superadmin_search";

interface GlobalSearchResultGroupProps {
  results: GlobalSearchResultItem[];
  loading?: boolean;
}

export function GlobalSearchResultGroup({ results, loading }: GlobalSearchResultGroupProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-16 bg-zinc-900/60 border border-zinc-800 rounded-xl animate-pulse p-4" />
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-symbols-outlined text-5xl text-zinc-600 mb-3">search_off</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Matching Entities Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No records matched your search query across selected domain entities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((item) => (
        <div
          key={`${item.category}-${item.id}`}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950/60 text-orange-400 border border-orange-800 uppercase">
                {item.entityName}
              </span>
              <h3 className="font-bold text-sm text-white">{item.title}</h3>
            </div>
            <p className="text-xs text-zinc-400">{item.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                item.status === "ACTIVE" || item.status === "COMPLETED" || item.status === "PAID" || item.status === "ENABLED"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : item.status === "OPEN" || item.status === "PREPARING" || item.status === "ROLLOUT"
                  ? "bg-orange-950/80 text-orange-300 border-orange-800"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {item.status}
            </span>

            <Link
              href={item.deepLink}
              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm flex items-center gap-1 whitespace-nowrap"
            >
              Open Module <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
