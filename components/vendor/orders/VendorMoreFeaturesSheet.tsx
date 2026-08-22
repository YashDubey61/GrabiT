"use client";

import { useRouter } from "next/navigation";
import type { VendorStoreConfig } from "@/lib/mock/vendor";

interface VendorMoreFeaturesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  store: VendorStoreConfig;
  onToggleStatus: () => void;
  onChangePrepTime: () => void;
  isSoundUnlocked: boolean;
  onUnlockSound: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-display text-[11px] font-extrabold uppercase tracking-widest text-faint">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  onClick,
}: {
  icon: string;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface-elevated p-3.5 text-left hover:border-primary/40"
    >
      <span className="material-symbols-outlined text-[20px] text-primary">{icon}</span>
      <span className="font-display text-body-sm font-bold leading-tight text-foreground">
        {label}
      </span>
      {value && <span className="font-display text-caption font-bold text-muted">{value}</span>}
    </button>
  );
}

/** Only lists features that already exist elsewhere in the Vendor
 * Panel/backend — this is a shortcut menu, not a second implementation
 * of store settings, menu, categories, or analytics. Sections with no
 * real feature behind them are omitted rather than shown as dead
 * buttons. */
export function VendorMoreFeaturesSheet({
  isOpen,
  onClose,
  store,
  onToggleStatus,
  onChangePrepTime,
  isSoundUnlocked,
  onUnlockSound,
}: VendorMoreFeaturesSheetProps) {
  const router = useRouter();
  if (!isOpen) return null;

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="glass-drawer flex max-h-[85dvh] w-full max-w-md flex-col sm:max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h3 className="font-display text-title font-bold text-foreground">More Features</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-5">
          <Section title="Operations">
            <Tile
              icon="storefront"
              label="Store Control"
              value={store.isOpen ? "Open" : "Closed"}
              onClick={onToggleStatus}
            />
            <Tile
              icon="schedule"
              label="Prep Time"
              value={`${store.prepTimeMinutes} min`}
              onClick={onChangePrepTime}
            />
            <Tile
              icon="notifications_active"
              label="Order Sound"
              value={isSoundUnlocked ? "Enabled" : "Tap to enable"}
              onClick={onUnlockSound}
            />
          </Section>

          <Section title="Menu Management">
            <Tile icon="add_circle" label="Add Dish" onClick={() => go("/vendor/menu?add=dish")} />
            <Tile
              icon="category"
              label="Manage Categories"
              onClick={() => go("/vendor/menu?manage=categories")}
            />
            <Tile
              icon="inventory_2"
              label="Stock / Availability"
              onClick={() => go("/vendor/menu")}
            />
            <Tile
              icon="image"
              label="Food Images"
              onClick={() => go("/vendor/menu?add=dish")}
            />
          </Section>

          <Section title="Business">
            <Tile icon="payments" label="Sales & Earnings" onClick={() => go("/vendor/analytics")} />
            <Tile icon="trending_up" label="Best Sellers & Peak Hours" onClick={() => go("/vendor/analytics")} />
          </Section>
        </div>
      </div>
    </div>
  );
}
