"use client";

import Link from "next/link";
import type { VendorFinancialItem } from "@/lib/supabase/superadmin_finance";

interface VendorFinancialTableProps {
  vendors: VendorFinancialItem[];
  loading?: boolean;
}

export function VendorFinancialTable({ vendors, loading }: VendorFinancialTableProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="h-12 bg-zinc-950/60 border border-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center shadow-md">
        <span className="material-icons text-5xl text-zinc-600 mb-3">storefront</span>
        <h3 className="text-lg font-semibold text-zinc-200">No Vendor Financial Records Found</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
          No vendor financial records match your search query or selected campus filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl mb-6">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Vendor Financial Directory</h3>
          <p className="text-xs text-zinc-400">Financial performance, commission, net earnings, and settlement status by canteen</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <th className="py-3.5 px-4">Canteen Vendor</th>
              <th className="py-3.5 px-4">Campus</th>
              <th className="py-3.5 px-4 text-right">Orders</th>
              <th className="py-3.5 px-4 text-right">Gross GMV</th>
              <th className="py-3.5 px-4 text-right">Refunds</th>
              <th className="py-3.5 px-4 text-right">Commission</th>
              <th className="py-3.5 px-4 text-right">Net Earnings</th>
              <th className="py-3.5 px-4 text-right">Pending Settlement</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {vendors.map((v) => (
              <tr key={v.canteenId} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-3 px-4 font-bold text-zinc-100">{v.canteenName}</td>
                <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{v.campusName}</td>
                <td className="py-3 px-4 text-right font-mono text-zinc-200 font-semibold">{v.totalOrders.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">₹{v.gmv.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-rose-400">₹{v.refunds.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-blue-400 font-semibold">₹{v.commission.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-purple-300 font-bold">₹{v.netEarnings.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-orange-400 font-bold">₹{v.pendingSettlement.toLocaleString()}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      v.settlementStatus === "PAID"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        : "bg-amber-950/80 text-amber-300 border-amber-800"
                    }`}
                  >
                    {v.settlementStatus}
                  </span>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                  <Link
                    href={`/superadmin/vendors?canteenId=${v.canteenId}`}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                  >
                    Oversight
                  </Link>
                  <Link
                    href={`/superadmin/settlements?canteenId=${v.canteenId}`}
                    className="px-2.5 py-1 bg-orange-950/60 hover:bg-orange-900 border border-orange-800 text-orange-300 rounded text-xs font-semibold transition-colors"
                  >
                    Settlements
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
