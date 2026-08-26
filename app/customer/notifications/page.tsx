"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  StudentNotificationItem,
  StudentNotificationPreferences,
} from "@/lib/notifications/student_notifications";
import { trackProductEvent } from "@/lib/analytics/events";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<StudentNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [prefs, setPrefs] = useState<StudentNotificationPreferences>({
    userId: "",
    orderUpdatesEnabled: true,
    paymentUpdatesEnabled: true,
    walletUpdatesEnabled: true,
    goldUpdatesEnabled: true,
    recommendationUpdatesEnabled: true,
    marketingEnabled: false,
  });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/student/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setUnreadCount(json.unreadCount || 0);

        trackProductEvent({
          eventName: "notification_viewed",
          metadata: { count: json.notifications?.length || 0, unreadCount: json.unreadCount || 0 },
        });
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/student/notifications/preferences");
      if (res.ok) {
        const json = await res.json();
        if (json.preferences) {
          setPrefs({
            userId: json.preferences.user_id || "",
            orderUpdatesEnabled: json.preferences.order_updates_enabled ?? true,
            paymentUpdatesEnabled: json.preferences.payment_updates_enabled ?? true,
            walletUpdatesEnabled: json.preferences.wallet_updates_enabled ?? true,
            goldUpdatesEnabled: json.preferences.gold_updates_enabled ?? true,
            recommendationUpdatesEnabled: json.preferences.recommendation_updates_enabled ?? true,
            marketingEnabled: json.preferences.marketing_enabled ?? false,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load notification preferences:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    fetchPreferences();
  }, []);

  const handleMarkRead = async (id: string, readAt?: string | null) => {
    if (readAt) return; // already read

    try {
      const res = await fetch(`/api/student/notifications/${id}`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        trackProductEvent({
          eventName: "notification_marked_read",
          metadata: { notificationId: id },
        });
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/student/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
        );
        setUnreadCount(0);
        showToast("All notifications marked as read");
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const res = await fetch("/api/student/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_updates_enabled: prefs.orderUpdatesEnabled,
          payment_updates_enabled: prefs.paymentUpdatesEnabled,
          wallet_updates_enabled: prefs.walletUpdatesEnabled,
          gold_updates_enabled: prefs.goldUpdatesEnabled,
          recommendation_updates_enabled: prefs.recommendationUpdatesEnabled,
          marketing_enabled: prefs.marketingEnabled,
        }),
      });

      if (res.ok) {
        setShowPreferencesModal(false);
        showToast("Notification preferences updated");
      }
    } catch (err) {
      console.error("Failed to save preferences:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === "ALL") return true;
    return n.category === activeCategory;
  });

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="mx-auto flex h-14 sm:h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6 md:px-16">
          <div className="flex items-center gap-3">
            <Link
              href="/customer"
              className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-body font-bold text-foreground">Notification Center</h1>
              <p className="text-[11px] text-muted">Order updates, wallet receipts &amp; recommendations</p>
            </div>
          </div>

          <button
            onClick={() => setShowPreferencesModal(true)}
            className="p-2 rounded-xl bg-surface-elevated border border-border text-muted hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">settings</span>
            <span className="hidden sm:inline">Preferences</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-5 space-y-6 pb-24">
        {notificationMsg && (
          <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notificationMsg}
          </div>
        )}

        {/* Unread Bar & Mark Read All */}
        <div className="p-4 rounded-2xl bg-surface-elevated border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">notifications</span>
            <div>
              <span className="text-body font-bold text-white">
                {unreadCount > 0 ? `${unreadCount} Unread Notification${unreadCount > 1 ? "s" : ""}` : "All Caught Up!"}
              </span>
              <p className="text-[11px] text-muted">Real-time status alerts and campus updates</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary border border-primary/30 font-semibold text-xs hover:bg-primary/30 transition-all"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {["ALL", "ORDERS", "PAYMENTS", "WALLET", "GOLD", "RECOMMENDATIONS"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase font-mono tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md"
                  : "bg-surface-elevated text-muted border border-border hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="py-16 text-center text-muted space-y-2">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
            <p className="text-xs">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center space-y-2 rounded-2xl bg-surface-elevated border border-border p-8">
            <span className="material-symbols-outlined text-4xl text-faint">notifications_off</span>
            <h3 className="text-body font-bold text-white">No notifications found</h3>
            <p className="text-xs text-muted">You do not have any notifications in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkRead(notif.id, notif.readAt)}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  !notif.readAt
                    ? "bg-surface-elevated border-primary/40 shadow-lg"
                    : "bg-black/40 border-border opacity-80"
                }`}
              >
                {/* Category Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  notif.category === "ORDERS"
                    ? "bg-warning-soft text-warning border border-warning/30"
                    : notif.category === "PAYMENTS"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                    : notif.category === "WALLET"
                    ? "bg-sky-950/60 text-sky-400 border border-sky-800/40"
                    : notif.category === "GOLD"
                    ? "bg-accent-soft text-primary border border-primary/40"
                    : "bg-info/10 text-info border border-info/30"
                }`}>
                  <span className="material-symbols-outlined text-xl">
                    {notif.category === "ORDERS"
                      ? "shopping_bag"
                      : notif.category === "PAYMENTS"
                      ? "verified"
                      : notif.category === "WALLET"
                      ? "account_balance_wallet"
                      : notif.category === "GOLD"
                      ? "workspace_premium"
                      : "auto_awesome"}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono font-semibold text-muted">
                      {notif.category}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h3 className="text-body-sm font-bold text-white">{notif.title}</h3>
                  <p className="text-xs text-muted">{notif.message}</p>

                  {notif.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={notif.actionUrl}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Open Action <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Unread Indicator Dot */}
                {!notif.readAt && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1"></span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md p-6 space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Notification Preferences
              </h3>
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between py-1 border-b border-white/5 cursor-pointer">
                <div>
                  <span className="font-semibold text-white">Order Status Updates</span>
                  <p className="text-[11px] text-muted">Order placed, preparing, ready for pickup</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.orderUpdatesEnabled}
                  onChange={(e) => setPrefs({ ...prefs, orderUpdatesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 border-b border-white/5 cursor-pointer">
                <div>
                  <span className="font-semibold text-white">Payment &amp; Refund Alerts</span>
                  <p className="text-[11px] text-muted">Razorpay receipts, refund processing</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.paymentUpdatesEnabled}
                  onChange={(e) => setPrefs({ ...prefs, paymentUpdatesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 border-b border-white/5 cursor-pointer">
                <div>
                  <span className="font-semibold text-white">Wallet Activity Updates</span>
                  <p className="text-[11px] text-muted">Wallet top-ups and low balance alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.walletUpdatesEnabled}
                  onChange={(e) => setPrefs({ ...prefs, walletUpdatesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 border-b border-white/5 cursor-pointer">
                <div>
                  <span className="font-semibold text-white">GrabIt Gold Subscription</span>
                  <p className="text-[11px] text-muted">Gold activation and expiration reminders</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.goldUpdatesEnabled}
                  onChange={(e) => setPrefs({ ...prefs, goldUpdatesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between py-1 border-b border-white/5 cursor-pointer">
                <div>
                  <span className="font-semibold text-white">Dish Recommendations</span>
                  <p className="text-[11px] text-muted">Trending dishes &amp; meal time picks (Max 1/day)</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.recommendationUpdatesEnabled}
                  onChange={(e) => setPrefs({ ...prefs, recommendationUpdatesEnabled: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-3 py-2 rounded-xl bg-black/40 border border-border text-muted font-semibold text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
