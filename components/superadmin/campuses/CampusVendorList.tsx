"use client";

import Link from "next/link";
import type { CampusVendorItem } from "@/lib/supabase/superadmin_campuses";

interface CampusVendorListProps {
  vendors: CampusVendorItem[];
  campusId: string;
}

export function CampusVendorList({ vendors, campusId }: CampusVendorListProps) {
  if (!vendors || vendors.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
        <span className="material-icons text-4xl text-zinc-600 mb-2">storefront</span>
        <p className="text-sm">No canteen vendors currently mapped to this campus.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Campus Canteen Storefronts</h3>
          <p className="text-xs text-zinc-400">Active vendor canteens operating on this campus</p>
        </div>
        <Link
          href={`/superadmin/vendors?campusId=${campusId}`}
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
        >
          View All Vendors <span className="material-icons text-xs">arrow_forward</span>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Orders</th>
              <th className="py-3 px-4 text-right">Revenue (₹)</th>
              <th className="py-3 px-4 text-right">Pending Settlement</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-800/40 transition-colors">
                <td className="py-3 px-4 font-bold text-zinc-100">{v.name}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.status === "active"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {v.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-zinc-200">{v.ordersCount.toLocaleString()}</td>
                <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                  ₹{v.revenue.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right font-mono text-orange-300">
                  ₹{v.pendingSettlement.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                  <Link
                    href={`/superadmin/vendors?canteenId=${v.id}`}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                  >
                    Oversight
                  </Link>
                  <Link
                    href={`/superadmin/settlements?canteenId=${v.id}`}
                    className="px-2 py-1 bg-orange-950/60 hover:bg-orange-900 border border-orange-800 text-orange-300 rounded text-xs font-semibold transition-colors"
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
