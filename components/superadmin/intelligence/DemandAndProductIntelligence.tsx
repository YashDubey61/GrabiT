"use client";

import type {
  DemandForecastData,
  ProductIntelligenceItem,
} from "@/lib/supabase/superadmin_intelligence";

interface DemandAndProductIntelligenceProps {
  demand: DemandForecastData;
  products: ProductIntelligenceItem[];
}

export function DemandAndProductIntelligence({
  demand,
  products,
}: DemandAndProductIntelligenceProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Demand Analytics & Predictive Forecast */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-amber-400">schedule</span>
            <h3 className="text-base font-bold text-white">Demand Analytics & Statistical Forecast</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded">
            {demand.confidencePct}% Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Peak Ordering Windows</div>
            <div className="font-bold text-orange-400">{demand.peakHours.join(" & ")}</div>
            <div className="text-zinc-400">Peak Days: {demand.peakDays.join(", ")}</div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Demand Forecast</div>
            <div className="font-bold text-emerald-400 text-sm">{demand.forecastedOrdersNextDay.toLocaleString()} Orders (Tomorrow)</div>
            <div className="text-zinc-400">{demand.forecastedOrdersNext7Days.toLocaleString()} Orders (Next 7 Days)</div>
          </div>
        </div>

        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs text-zinc-300 flex items-center gap-2">
          <span className="material-icons text-amber-400 text-sm">lightbulb</span>
          <span>Demand peaks between 12:00–14:00. Advise vendors to prep top 3 items prior to 11:45 AM.</span>
        </div>
      </div>

      {/* Product Velocity & Menu Performance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-emerald-400">restaurant_menu</span>
            <h3 className="text-base font-bold text-white">Top Menu Items & Product Velocity</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Item Name</th>
                <th className="py-2.5 px-3">Canteen</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-zinc-100">{p.name}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{p.canteenName}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{p.unitsSold.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">₹{p.revenue.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">⭐ {p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
