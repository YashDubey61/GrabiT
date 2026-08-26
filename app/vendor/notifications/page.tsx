"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import type { OperationalNotificationItem } from "@/lib/notifications/operational_notifications";
import {
  fetchVendorNotificationsApi,
  markNotificationReadApi,
  markNotificationUnreadApi,
  markAllNotificationsReadApi,
  getCategoryForType,
  type NotificationCategory,
} from "@/lib/supabase/vendor_notifications_center";
import { useVendor } from "@/lib/vendor/VendorContext";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

import { VendorNotificationCenterHeader } from "@/components/vendor/notifications/VendorNotificationCenterHeader";
import { VendorNotificationFilterBar } from "@/components/vendor/notifications/VendorNotificationFilterBar";
import { VendorNotificationCard } from "@/components/vendor/notifications/VendorNotificationCard";
import { VendorNotificationPreferencesModal } from "@/components/vendor/notifications/VendorNotificationPreferencesModal";

export default function VendorNotificationsPage() {
  const { store, canteenId } = useVendor();
  const sound = useOrderAlertSound();

  const [notifications, setNotifications] = useState<OperationalNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "UNREAD" | "READ">("ALL");

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsError(false);
    const res = await fetchVendorNotificationsApi();
    if (res.ok) {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } else {
      setIsError(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

    loadNotifications();

    if (canteenId) {
      const supabase = createClient();
      channel = supabase
        .channel(`vendor-notifications-center-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "operational_notifications",
            filter: `canteen_id=eq.${canteenId}`,
          },
          () => {
            loadNotifications();
          },
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [canteenId, loadNotifications]);

  const handleToggleRead = async (id: string, currentStatus: string) => {
    if (currentStatus === "OPEN") {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "ACKNOWLEDGED" } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationReadApi(id);
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "OPEN" } : n)),
      );
      setUnreadCount((c) => c + 1);
      await markNotificationUnreadApi(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "ACKNOWLEDGED" })),
    );
    setUnreadCount(0);
    const ok = await markAllNotificationsReadApi();
    if (ok) {
      showToast("All operational notifications marked as read.");
    } else {
      loadNotifications();
    }
  };

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  }, []);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category filter
      if (selectedCategory !== "ALL") {
        const cat = getCategoryForType(item.type);
        if (cat !== selectedCategory) return false;
      }

      // Status filter
      if (selectedStatus === "UNREAD" && item.status !== "OPEN") return false;
      if (selectedStatus === "READ" && item.status === "OPEN") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchMsg = item.message.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg) return false;
      }

      return true;
    });
  }, [notifications, selectedCategory, selectedStatus, searchQuery]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMobileNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        items={VENDOR_NAV}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMoreFeaturesSheet
        isOpen={isMoreFeaturesOpen}
        onClose={() => setIsMoreFeaturesOpen(false)}
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8 flex flex-col gap-6">
        {toastMsg && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {toastMsg}
          </div>
        )}

        {/* Header */}
        <VendorNotificationCenterHeader
          unreadCount={unreadCount}
          totalCount={notifications.length}
          onMarkAllAsRead={handleMarkAllAsRead}
          onOpenPreferences={() => setIsPrefsModalOpen(true)}
        />

        {/* Filters */}
        <VendorNotificationFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onResetFilters={handleResetFilters}
          filteredCount={filteredNotifications.length}
          totalCount={notifications.length}
        />

        {/* List Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Fetching operational alerts from Supabase...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load notifications
            </h3>
            <p className="text-caption text-muted">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadNotifications()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-12 text-center backdrop-blur-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[48px] text-muted">
              {notifications.length === 0 ? "notifications_off" : "filter_list_off"}
            </span>
            <h3 className="font-display text-title font-bold text-foreground">
              {notifications.length === 0
                ? "You're all caught up!"
                : "No notifications match your filters"}
            </h3>
            <p className="text-caption text-muted max-w-sm">
              {notifications.length === 0
                ? "When new orders arrive, inventory levels drop, or settlements occur, real-time alerts will appear here."
                : "Try selecting another category or clearing your search term."}
            </p>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary shadow-glow-primary"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredNotifications.map((notification) => (
              <VendorNotificationCard
                key={notification.id}
                notification={notification}
                onToggleRead={handleToggleRead}
              />
            ))}
          </div>
        )}
      </main>

      <VendorNotificationPreferencesModal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        onSavePreferences={() => {
          showToast("Notification preferences updated.");
        }}
      />

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
