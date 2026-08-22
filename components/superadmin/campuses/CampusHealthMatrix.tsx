"use client";

import Link from "next/link";
import type { CampusDetailData, CampusAlertItem } from "@/lib/supabase/superadmin_campuses";

interface CampusHealthMatrixProps {
  health: CampusDetailData["health"];
  alerts: CampusAlertItem[];
}

export function CampusHealthMatrix({ health, alerts }: CampusHealthMatrixProps) {
  const getBadgeColor = (val: string) => {
    if (val === "Normal" || val === "Healthy") {
      return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
    }
    if (val === "Elevated" || val === "Degraded" || val === "Attention Required" || val === "Low Stock") {
      return "bg-amber-950/80 text-amber-300 border-amber-800";
    }
    return "bg-rose-950/80 text-rose-300 border-rose-800";
  };

  const healthItems = [
    { label: "Orders Engine", value: health.orders },
    { label: "Payments Gateway", value: health.payments },
    { label: "Vendor Storefronts", value: health.vendors },
    { label: "Inventory Levels", value: health.inventory },
    { label: "Dispute Center", value: health.disputes },
    { label: "Fraud & Risk", value: health.risk },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Health Matrix */}
      <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-icons text-emerald-400">monitor_heart</span>
          <h3 className="text-base font-bold text-white">Campus Operational Health</h3>
        </div>

        <div className="space-y-3">
          {healthItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-lg border border-zinc-800/80">
              <span className="text-xs text-zinc-300 font-medium">{item.label}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getBadgeColor(item.value)}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Alerts */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-orange-400">warning</span>
            <h3 className="text-base font-bold text-white">Campus Operational Alerts</h3>
          </div>
          <span className="text-xs text-zinc-400">{alerts.length} active alerts</span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <span className="material-icons text-3xl text-emerald-500 mb-1">check_circle</span>
            <p className="text-xs font-semibold text-zinc-300">All Systems Nominal</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">No critical operational alerts detected for this campus.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 uppercase">
                      {alt.severity}
                    </span>
                    <span className="text-xs font-bold text-zinc-200">{alt.module}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{alt.description}</p>
                </div>

                <Link
                  href={alt.deepLink}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Investigate
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
