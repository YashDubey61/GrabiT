"use client";

import Link from "next/link";
import type {
  CampusIntelligenceItem,
  VendorIntelligenceItem,
} from "@/lib/supabase/superadmin_intelligence";

interface CampusVendorIntelligenceTablesProps {
  campuses: CampusIntelligenceItem[];
  vendors: VendorIntelligenceItem[];
}

export function CampusVendorIntelligenceTables({
  campuses,
  vendors,
}: CampusVendorIntelligenceTablesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Campus Performance Rankings */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-blue-400">school</span>
            <h3 className="text-base font-bold text-white">Campus Performance Rankings</h3>
          </div>
          <Link
            href="/superadmin/campuses"
            className="text-xs text-orange-400 hover:underline font-semibold"
          >
            Campus Control Center →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Campus</th>
                <th className="py-2.5 px-3 text-right">Active Students</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Gross GMV</th>
                <th className="py-2.5 px-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {campuses.map((c) => (
                <tr key={c.campusId} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-orange-400">#{c.rank}</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-100">{c.campusName}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">{c.activeStudents.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{c.ordersCount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">₹{c.gmv.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">⭐ {c.avgRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Operational Intelligence */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-purple-400">storefront</span>
            <h3 className="text-base font-bold text-white">Vendor Operational Intelligence</h3>
          </div>
          <Link
            href="/superadmin/vendors"
            className="text-xs text-orange-400 hover:underline font-semibold"
          >
            Vendor Directory →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Canteen</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Prep Time</th>
                <th className="py-2.5 px-3 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {vendors.map((v) => (
                <tr key={v.canteenId} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-zinc-100">{v.canteenName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-purple-300 border border-zinc-700 uppercase">
                      {v.performanceCategory}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{v.ordersCount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">{v.avgPrepTimeMinutes}m</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">⭐ {v.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
