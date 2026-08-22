"use client";

import { useEffect, useState } from "react";
import type { CampusComparisonItem } from "@/lib/supabase/superadmin_campuses";

interface CampusComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CampusComparisonModal({ isOpen, onClose }: CampusComparisonModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CampusComparisonItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadComparison() {
      try {
        setLoading(true);
        const res = await fetch("/api/superadmin/campuses/comparison");
        const json = await res.json();
        if (isMounted && json.ok) {
          setData(json.comparison);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComparison();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-orange-400">compare_arrows</span>
              <h2 className="text-xl font-bold text-white">Campus Benchmark Comparison Matrix</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Side-by-side performance benchmarking across active university campuses
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Matrix Table */}
        {loading ? (
          <div className="py-12 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <span className="material-icons text-4xl text-zinc-600 mb-2">school</span>
            <p className="text-sm">No campus metrics available for comparison.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                  <th className="py-3 px-4">Campus Name</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4 text-right">30-Day GMV</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">AOV</th>
                  <th className="py-3 px-4 text-right">Active Vendors</th>
                  <th className="py-3 px-4 text-right">Students</th>
                  <th className="py-3 px-4 text-right">Completion %</th>
                  <th className="py-3 px-4 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {data.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-zinc-100">{c.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{c.city}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      ₹{c.gmv.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-200">
                      {c.orders.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-orange-400">
                      ₹{c.aov}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-300">
                      {c.activeVendors}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {c.activeStudents}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-300 font-semibold">
                      {c.completionRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-300 font-bold flex items-center justify-end gap-1">
                      <span className="material-icons text-xs text-amber-400">star</span>
                      {c.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
