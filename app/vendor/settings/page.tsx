"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MOCK_VENDOR_STORE } from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import {
  getLiveVendorStoreSettings,
  updateVendorStoreSettings,
  type VendorStoreSettingsData,
} from "@/lib/supabase/vendor_settings";
import {
  getLiveVendorCanteenId,
  getLiveVendorShopName,
} from "@/lib/supabase/vendor_context";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

import { VendorSettingsNav, type SettingsTab } from "@/components/vendor/settings/VendorSettingsNav";
import { VendorStoreProfileSection } from "@/components/vendor/settings/VendorStoreProfileSection";
import { VendorStoreStatusSection } from "@/components/vendor/settings/VendorStoreStatusSection";
import { VendorOperatingHoursSection } from "@/components/vendor/settings/VendorOperatingHoursSection";
import { VendorPrepTimeSection } from "@/components/vendor/settings/VendorPrepTimeSection";
import { VendorStorefrontSection } from "@/components/vendor/settings/VendorStorefrontSection";
import { VendorNotificationPreferencesSection } from "@/components/vendor/settings/VendorNotificationPreferencesSection";
import { VendorPayoutAccountSection } from "@/components/vendor/settings/VendorPayoutAccountSection";
import { VendorSecurityAccountSection } from "@/components/vendor/settings/VendorSecurityAccountSection";

export default function VendorSettingsPage() {
  const sound = useOrderAlertSound();
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const [data, setData] = useState<VendorStoreSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const canteenIdRef = useRef<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadSettings = useCallback(async () => {
    setIsError(false);
    const res = await getLiveVendorStoreSettings();
    if (res.ok && res.data) {
      setData(res.data);
      setStore((prev) => ({
        ...prev,
        name: res.data!.name,
        isStoreOpen: res.data!.status === "active" || res.data!.status === "busy",
        prepTimeMinutes: res.data!.prepTimeMinutes,
      }));
    } else {
      setIsError(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorShopName().then((name) => {
      if (isMounted && name) {
        setStore((prev) => ({ ...prev, name }));
      }
    });

    getLiveVendorCanteenId().then((canteenId) => {
      if (!isMounted) return;
      canteenIdRef.current = canteenId;

      loadSettings();

      if (!canteenId) return;

      channel = supabase
        .channel(`vendor-settings-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "canteens", filter: `id=eq.${canteenId}` },
          () => {
            loadSettings();
          },
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  const handlePartialUpdate = async (payload: Partial<VendorStoreSettingsData>) => {
    const res = await updateVendorStoreSettings(payload);
    if (res.ok) {
      showToast("Store settings saved & updated successfully.");
      loadSettings();
    } else {
      showToast(res.error ?? "Failed to save store settings.");
    }
  };

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

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
            Store Settings & Vendor Profile
          </h1>
          <p className="text-caption text-muted">
            Manage canteen information, operating status, prep times, storefront banners, and security
          </p>
        </div>

        {/* Main Content Layout */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading store settings from Supabase...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load store settings
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadSettings()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Settings Sidebar Nav */}
            <VendorSettingsNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Active Tab Panel */}
            <div className="flex-1 w-full">
              {activeTab === "profile" && (
                <VendorStoreProfileSection data={data} onSave={handlePartialUpdate} />
              )}
              {activeTab === "status" && (
                <VendorStoreStatusSection
                  currentStatus={data.status}
                  onSaveStatus={(st) => handlePartialUpdate({ status: st })}
                />
              )}
              {activeTab === "hours" && (
                <VendorOperatingHoursSection
                  openingTime={data.openingTime}
                  closingTime={data.closingTime}
                  operatingDays={data.operatingDays}
                  onSave={handlePartialUpdate}
                />
              )}
              {activeTab === "prep" && (
                <VendorPrepTimeSection
                  currentPrepTimeMinutes={data.prepTimeMinutes}
                  onSave={(mins) => handlePartialUpdate({ prepTimeMinutes: mins })}
                />
              )}
              {activeTab === "storefront" && (
                <VendorStorefrontSection
                  announcementMessage={data.announcementMessage}
                  cuisineTags={data.cuisineTags}
                  onSave={handlePartialUpdate}
                />
              )}
              {activeTab === "notifications" && <VendorNotificationPreferencesSection />}
              {activeTab === "payouts" && (
                <VendorPayoutAccountSection payoutAccount={data.payoutAccount} />
              )}
              {activeTab === "security" && <VendorSecurityAccountSection data={data} />}
            </div>
          </div>
        )}
      </main>

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
