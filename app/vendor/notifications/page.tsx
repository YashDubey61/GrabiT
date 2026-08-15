"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { OperationalNotificationItem } from "@/lib/notifications/operational_notifications";
import { trackProductEvent } from "@/lib/analytics/events";

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<OperationalNotificationItem[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/vendor/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setOpenCount(json.openCount || 0);

        trackProductEvent({
          eventName: "operational_notification_viewed",
          metadata: { count: json.notifications?.length || 0, openCount: json.openCount || 0 },
        });
      }
    } catch (err) {
      console.error("Failed to load vendor operational notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, []);

  const handleAction = async (id: string, action: "ACKNOWLEDGE" | "RESOLVE") => {
    try {
      const res = await fetch(`/api/vendor/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? {
                  ...n,
                  status: action === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : "RESOLVED",
                  acknowledgedAt: action === "ACKNOWLEDGE" ? new Date().toISOString() : n.acknowledgedAt,
                  resolvedAt: action === "RESOLVE" ? new Date().toISOString() : n.resolvedAt,
                }
              : n,
          ),
        );

        if (action === "RESOLVE") {
          setOpenCount((prev) => Math.max(0, prev - 1));
        }

        showToast(action === "ACKNOWLEDGE" ? "Notification Acknowledged" : "Notification Resolved");

        trackProductEvent({
          eventName: action === "ACKNOWLEDGE" ? "operational_notification_acknowledged" : "operational_notification_resolved",
          metadata: { notificationId: id },
        });
      }
    } catch (err) {
      console.error("Failed to update notification action:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (statusFilter !== "ALL" && n.status !== statusFilter) return false;
    if (activeCategory === "ALL") return true;
    if (activeCategory === "ORDERS" && (n.type === "NEW_ORDER" || n.type === "ORDER_READY_PENDING_HANDOVER")) return true;
    if (activeCategory === "SLA" && (n.type === "ORDER_AGING" || n.type === "ORDER_SLA_BREACH" || n.type === "HIGH_PENDING_BACKLOG")) return true;
    if (activeCategory === "MENU" && (n.type.includes("MENU") || n.type.includes("OUT_OF_STOCK"))) return true;
    if (activeCategory === "PAYOUTS" && n.type.includes("PAYOUT")) return true;
    if (activeCategory === "PERFORMANCE" && (n.type.includes("PERFORMANCE") || n.type.includes("SALES") || n.type.includes("PEAK"))) return true;
    return false;
  });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 pb-24">
      {toastMsg && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-center text-body-sm font-semibold text-primary animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase mb-1">
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            Kitchen Operational Dispatch
          </div>
          <h1 className="font-display text-title font-bold text-foreground sm:text-[28px]">
            Operational Notifications &amp; SLA Alerts
          </h1>
          <p className="text-body-sm text-faint">
            Real-time kitchen order alerts, preparation SLA warnings, and menu availability notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/40 text-xs font-mono font-bold">
            {openCount} Open Alerts
          </span>
        </div>
      </div>

      {/* Status & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#262626]">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["ALL", "ORDERS", "SLA", "MENU", "PAYOUTS", "PERFORMANCE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md"
                  : "bg-[#1E1F26] text-gray-400 border border-[#262626] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-[#1E1F26] p-1 rounded-xl border border-[#262626] w-fit">
          {["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all ${
                statusFilter === st ? "bg-primary text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400 space-y-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          <p className="text-xs">Loading kitchen alerts...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center space-y-2 rounded-2xl bg-[#1E1F26] border border-[#262626] p-8">
          <span className="material-symbols-outlined text-4xl text-gray-600">notifications_off</span>
          <h3 className="text-body font-bold text-white">No operational notifications found</h3>
          <p className="text-xs text-gray-400">All kitchen SLA and order conditions are running smoothly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                notif.status === "OPEN"
                  ? notif.severity === "CRITICAL"
                    ? "bg-red-950/20 border-red-800/40 shadow-lg"
                    : notif.severity === "WARNING"
                    ? "bg-amber-950/20 border-amber-800/40 shadow-lg"
                    : "bg-[#1E1F26] border-primary/40 shadow-lg"
                  : "bg-black/40 border-[#262626] opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                    notif.severity === "CRITICAL"
                      ? "bg-red-950/80 text-red-400 border-red-800/60"
                      : notif.severity === "WARNING"
                      ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                      : "bg-blue-950/80 text-blue-400 border-blue-800/60"
                  }`}>
                    {notif.severity}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                    notif.status === "OPEN"
                      ? "bg-amber-950/40 text-amber-300 border-amber-800/30"
                      : notif.status === "ACKNOWLEDGED"
                      ? "bg-sky-950/40 text-sky-300 border-sky-800/30"
                      : "bg-emerald-950/40 text-emerald-300 border-emerald-800/30"
                  }`}>
                    {notif.status}
                  </span>
                </div>

                <span className="text-[11px] text-gray-400 font-mono">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div>
                <h3 className="text-body font-bold text-white">{notif.title}</h3>
                <p className="text-xs text-gray-300 mt-1">{notif.message}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                {notif.actionUrl ? (
                  <Link
                    href={notif.actionUrl}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    Open Page <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                ) : (
                  <span className="text-gray-500 italic">No direct page link</span>
                )}

                <div className="flex items-center gap-2">
                  {notif.status === "OPEN" && (
                    <button
                      onClick={() => handleAction(notif.id, "ACKNOWLEDGE")}
                      className="px-3 py-1 rounded-xl bg-[#1E1F26] border border-[#262626] text-gray-300 hover:text-white font-semibold text-xs transition-all"
                    >
                      Acknowledge
                    </button>
                  )}

                  {notif.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleAction(notif.id, "RESOLVE")}
                      className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-all"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
