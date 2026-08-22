"use client";

import { useState } from "react";
import type { GrowthPoint } from "@/lib/supabase/superadmin_intelligence";

interface PlatformGrowthChartsProps {
  growth: {
    points: GrowthPoint[];
    peakGmvDay: string;
    peakOrderDay: string;
  };
}

export function PlatformGrowthCharts({ growth }: PlatformGrowthChartsProps) {
  const [metricTab, setMetricTab] = useState<"gmv" | "revenue" | "orders" | "users">("gmv");
  const { points, peakGmvDay, peakOrderDay } = growth;

  const getMetricValue = (p: GrowthPoint) => {
    switch (metricTab) {
      case "revenue":
        return p.revenue;
      case "orders":
        return p.orders;
      case "users":
        return p.activeUsers;
      case "gmv":
      default:
        return p.gmv;
    }
  };

  const maxVal = Math.max(...points.map(getMetricValue), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-5 mb-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-purple-400">trending_up</span>
            <h3 className="text-base font-bold text-white">Platform Growth & Performance Analytics</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Historical growth trajectories across key platform dimensions</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setMetricTab("gmv")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                metricTab === "gmv" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              GMV
            </button>
            <button
              onClick={() => setMetricTab("revenue")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                metricTab === "revenue" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetricTab("orders")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                metricTab === "orders" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setMetricTab("users")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                metricTab === "users" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              Active Users
            </button>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-end gap-1.5 h-48 pt-6 border-b border-zinc-800/80 overflow-x-auto">
          {points.map((pt, idx) => {
            const val = getMetricValue(pt);
            const heightPct = Math.round((val / maxVal) * 100);
            return (
              <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                <div className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {metricTab === "gmv" || metricTab === "revenue" ? `₹${(val / 1000).toFixed(1)}k` : val}
                </div>
                <div
                  style={{ height: `${Math.max(12, heightPct)}%` }}
                  className="w-full bg-gradient-to-t from-purple-600 to-orange-500 rounded-t transition-all group-hover:brightness-125"
                />
                <span className="text-[9px] font-mono text-zinc-500 truncate w-full text-center">
                  {pt.date}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Peak GMV Period: <strong className="text-purple-400 font-mono">{peakGmvDay}</strong></span>
            <span className="text-zinc-400">Peak Order Volume: <strong className="text-orange-400 font-mono">{peakOrderDay}</strong></span>
          </div>
          <span>{points.length} Datapoints</span>
        </div>
      </div>
    </div>
  );
}
