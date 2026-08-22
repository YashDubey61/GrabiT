"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { CampusHealthMatrix } from "@/components/superadmin/campuses/CampusHealthMatrix";
import { CampusVendorList } from "@/components/superadmin/campuses/CampusVendorList";
import { CampusStatusModal } from "@/components/superadmin/campuses/CampusStatusModal";
import type { CampusDetailData } from "@/lib/supabase/superadmin_campuses";

export default function SuperAdminCampusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<CampusDetailData | null>(null);
  const [timeframe, setTimeframe] = useState("30d");

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const loadCampusDetail = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/superadmin/campuses/${id}?timeframe=${timeframe}`);
      const json = await res.json();

      if (json.ok && json.data) {
        setData(json.data);
      } else {
        setErrorMsg(json.error || "Failed to load campus details.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error loading campus detail.");
    } finally {
      setLoading(false);
    }
  }, [id, timeframe]);

  useEffect(() => {
    loadCampusDetail();
  }, [loadCampusDetail]);

  const handleSaveStatus = async (campusId: string, newStatus: string, reason: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/superadmin/campuses/${campusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const json = await res.json();

      if (json.ok) {
        await loadCampusDetail();
        return true;
      } else {
        alert(json.error || "Failed to update campus status.");
        return false;
      }
    } catch {
      alert("Network error updating campus status.");
      return false;
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-12 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="p-8 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl max-w-md mx-auto">
          <span className="material-icons text-4xl text-rose-400 mb-2">error</span>
          <h3 className="text-lg font-bold">Campus Control Console Error</h3>
          <p className="text-xs text-rose-200 mt-1">{errorMsg || "Campus ID not found."}</p>
          <Link
            href="/superadmin/campuses"
            className="mt-4 inline-block px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded font-semibold text-xs"
          >
            Back to Campus Directory
          </Link>
        </div>
      </div>
    );
  }

  const { info, students, vendors, orders, finance, health, alerts, vendorList } = data;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-3 border-b border-zinc-800 pb-4">
        <Link
          href="/superadmin/campuses"
          className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
        >
          <span className="material-icons text-xs">arrow_back</span> Back to Campus Directory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{info.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  info.status === "ACTIVE"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                {info.status}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Location: {info.location} | Logistics Lead: {info.logisticsLeadName || "Operations Lead"} | ID: {info.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>

            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="material-icons text-xs">tune</span>
              Change Operational Status
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Students Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase">
            <span>Students</span>
            <span className="material-icons text-purple-400">groups</span>
          </div>
          <div className="text-2xl font-bold text-white">{students.total.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400">
            {students.active} Active | {students.new30d} New (30d)
          </div>
        </div>

        {/* Vendors Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase">
            <span>Canteen Vendors</span>
            <span className="material-icons text-emerald-400">storefront</span>
          </div>
          <div className="text-2xl font-bold text-white">{vendors.total}</div>
          <div className="text-[11px] text-zinc-400">
            {vendors.active} Active | {vendors.closed} Closed/Paused
          </div>
        </div>

        {/* Orders Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase">
            <span>Orders Breakdown</span>
            <span className="material-icons text-orange-400">shopping_bag</span>
          </div>
          <div className="text-2xl font-bold text-white">{orders.orders30d.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400">
            Today: {orders.todaysOrders} | Completion: {orders.completionRate}%
          </div>
        </div>

        {/* Financials Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase">
            <span>30-Day GMV</span>
            <span className="material-icons text-emerald-400">payments</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">₹{finance.gmv.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400">
            Commission: ₹{finance.commission.toLocaleString()} | Earnings: ₹{finance.vendorEarnings.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Operational Health Matrix & Alerts */}
      <CampusHealthMatrix health={health} alerts={alerts} />

      {/* Vendor Storefronts List */}
      <CampusVendorList vendors={vendorList} campusId={id} />

      {/* Status Modal */}
      <CampusStatusModal
        campus={info}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSaveStatus={handleSaveStatus}
      />
    </div>
  );
}
