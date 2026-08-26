"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  openNotificationSettings,
  sendTestOrderAlert,
} from "@/lib/vendor/orderAlertService";

export function VendorNotificationPreferencesSection() {
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    areNotificationsEnabled: boolean;
    isPermanentlyDenied: boolean;
  }>({
    granted: true,
    areNotificationsEnabled: true,
    isPermanentlyDenied: false,
  });
  const [isChecking, setIsChecking] = useState(true);
  const [testSending, setTestSending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const refreshPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await checkNotificationPermission();
      setPermissionStatus(res);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
    if (!res.granted) {
      await openNotificationSettings();
    }
  };

  const handleSendTestAlert = async () => {
    setTestSending(true);
    try {
      const success = await sendTestOrderAlert();
      if (success) {
        setToastMsg("Test order alert dispatched! Check your notification bar and sound.");
      } else {
        setToastMsg("Could not dispatch alert. Check Android notification settings.");
      }
    } catch {
      setToastMsg("Error dispatching test alert.");
    } finally {
      setTestSending(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface-elevated p-6 shadow-lg">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Order Notifications & Alerts
          </h3>
          <p className="text-caption text-muted">
            Android native notification channels, distinct kitchen chime & vibration
          </p>
        </div>
        <span className="material-symbols-outlined text-primary text-[24px]">notifications_active</span>
      </div>

      {toastMsg && (
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Permission Warning / Status Card */}
      {!permissionStatus.granted ? (
        <div className="rounded-2xl border border-danger/40 bg-danger-soft/30 p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-danger text-[26px] shrink-0 mt-0.5">
              notification_important
            </span>
            <div>
              <h4 className="font-display text-body-sm font-extrabold uppercase tracking-wide text-danger">
                Notifications Disabled
              </h4>
              <p className="text-caption text-foreground/90 mt-1 leading-relaxed">
                Android notifications are currently turned off. You will <strong>miss incoming customer orders</strong> when the GRABIT Vendor app is minimized or running in the background.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleRequestPermission}
              className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 font-display text-caption font-bold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>Open Notification Settings</span>
            </button>
            <button
              type="button"
              onClick={refreshPermissions}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2 font-display text-caption font-semibold text-muted hover:text-foreground transition-all"
            >
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <div>
              <span className="font-display text-body-sm font-bold text-foreground">
                Android Notification Channel Active
              </span>
              <p className="text-[12px] text-muted">
                Channel: <strong>GRABIT New Orders</strong> (High Importance, Sound & Vibration)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openNotificationSettings()}
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 font-display text-[12px] font-semibold text-muted hover:text-foreground hover:bg-surface transition-all"
          >
            Manage in OS
          </button>
        </div>
      )}

      {/* Alert Sound & Hardware Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-caption font-bold text-muted uppercase tracking-wider">
                Audible Alert Sound
              </span>
              <h4 className="font-display text-body-sm font-bold text-foreground mt-0.5">
                GRABIT Kitchen Chime
              </h4>
              <p className="text-[11px] text-faint mt-1">
                Optimized audio curve for noisy restaurant environments
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">volume_up</span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold text-foreground">
              Direct Hardware Channel Resource (@raw/order_alert)
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-caption font-bold text-muted uppercase tracking-wider">
                Vibration Pattern
              </span>
              <h4 className="font-display text-body-sm font-bold text-foreground mt-0.5">
                Multi-Pulse Haptic Alert
              </h4>
              <p className="text-[11px] text-faint mt-1">
                Triple 600ms pulses with 200ms rest for pocket notice
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-[22px]">vibration</span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold text-foreground">
              Hardware Haptics Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Test Alert Button */}
      <div className="rounded-xl border border-border bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="font-display text-body-sm font-bold text-foreground">
            Test Order Alert System
          </span>
          <p className="text-caption text-muted mt-0.5">
            Trigger a local test order notification to verify sound, vibration, and heads-up banner.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendTestAlert}
          disabled={testSending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">
            {testSending ? "hourglass_top" : "campaign"}
          </span>
          <span>{testSending ? "Triggering..." : "Send Test Alert"}</span>
        </button>
      </div>

      {/* Operational Preferences Link */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-4 flex items-center justify-between">
        <div>
          <span className="font-display text-body-sm font-semibold text-foreground">
            Operational Notification Preferences
          </span>
          <p className="text-caption text-muted">
            Configure stock alerts, settlement reports, and customer review notifications
          </p>
        </div>

        <Link
          href="/vendor/notifications"
          className="inline-flex items-center gap-1 text-caption font-bold text-primary hover:underline"
        >
          <span>Preferences</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
