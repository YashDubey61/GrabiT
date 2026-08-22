"use client";

import type { RevenueChartPoint } from "@/lib/supabase/superadmin_finance";

interface RevenueAnalyticsChartProps {
  analytics: {
    chartPoints: RevenueChartPoint[];
    highestRevenueDay: { date: string; revenue: number };
    highestGmvDay: { date: string; gmv: number };
    highestOrderDay: { date: string; orders: number };
  };
}

export function RevenueAnalyticsChart({ analytics }: RevenueAnalyticsChartProps) {
  const { chartPoints, highestRevenueDay, highestGmvDay, highestOrderDay } = analytics;

  const maxGmv = Math.max(...chartPoints.map((p) => p.gmv), 1);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-5 mb-6">
      {/* Header & Highest Day Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-emerald-400">trending_up</span>
            <h3 className="text-base font-bold text-white">Revenue & GMV Performance Telemetry</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Financial growth and volume trends over selected period</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Peak Revenue Day</div>
            <div className="font-bold text-emerald-400 font-mono">
              {highestRevenueDay.date}: ₹{highestRevenueDay.revenue.toLocaleString()}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Peak GMV Day</div>
            <div className="font-bold text-purple-400 font-mono">
              {highestGmvDay.date}: ₹{highestGmvDay.gmv.toLocaleString()}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-0.5">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Peak Order Volume</div>
            <div className="font-bold text-orange-400 font-mono">
              {highestOrderDay.date}: {highestOrderDay.orders} orders
            </div>
          </div>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-end gap-1.5 h-48 pt-6 border-b border-zinc-800/80 overflow-x-auto">
          {chartPoints.map((pt, idx) => {
            const heightPct = Math.round((pt.gmv / maxGmv) * 100);
            return (
              <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group">
                <div className="text-[9px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{(pt.gmv / 1000).toFixed(1)}k
                </div>
                <div
                  style={{ height: `${Math.max(12, heightPct)}%` }}
                  className="w-full bg-gradient-to-t from-orange-600 to-emerald-400 rounded-t transition-all group-hover:brightness-125"
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
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Gross GMV
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-600" /> Platform Revenue
            </span>
          </div>
          <span>Showing {chartPoints.length} period datapoints</span>
        </div>
      </div>
    </div>
  );
}
