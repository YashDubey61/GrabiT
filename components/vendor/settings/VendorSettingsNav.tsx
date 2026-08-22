"use client";

export type SettingsTab =
  | "profile"
  | "status"
  | "hours"
  | "prep"
  | "storefront"
  | "notifications"
  | "payouts"
  | "security";

export interface VendorSettingsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function VendorSettingsNav({
  activeTab,
  onTabChange,
}: VendorSettingsNavProps) {
  const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
    { id: "profile", label: "Store Profile", icon: "storefront" },
    { id: "status", label: "Availability & Status", icon: "power_settings_new" },
    { id: "hours", label: "Operating Hours", icon: "schedule" },
    { id: "prep", label: "Preparation Time", icon: "timer" },
    { id: "storefront", label: "Storefront & Banner", icon: "campaign" },
    { id: "notifications", label: "Notification Preferences", icon: "notifications" },
    { id: "payouts", label: "Payout Account", icon: "account_balance_wallet" },
    { id: "security", label: "Security & Account", icon: "shield_person" },
  ];

  return (
    <div className="flex flex-row overflow-x-auto gap-2 rounded-2xl border border-border bg-surface-elevated p-2 shadow-lg sm:flex-col shrink-0 sm:w-64 scrollbar-none">
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 font-display text-body-sm font-bold transition-all text-left shrink-0 ${
              isActive
                ? "bg-primary text-on-primary shadow-glow-primary"
                : "text-muted hover:bg-background/60 hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
