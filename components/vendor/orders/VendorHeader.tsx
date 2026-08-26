"use client";

import Image from "next/image";
import type { VendorStoreConfig } from "@/lib/mock/vendor";

interface VendorHeaderProps {
  store: VendorStoreConfig;
  onToggleStatus: () => void;
  onChangePrepTime: () => void;
  onOpenNotifications: () => void;
  onOpenMoreFeatures?: () => void;
  onOpenNavMenu: () => void;
  onOpenProfile: () => void;
  pendingOrderCount?: number;
}

export function VendorHeader({
  store,
  onToggleStatus,
  onChangePrepTime,
  onOpenNotifications,
  onOpenNavMenu,
  onOpenProfile,
  pendingOrderCount = 0,
}: VendorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md pt-[var(--safe-area-inset-top,0px)]">
      <div className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6">
        {/* Left: Clean Store Name (Storefront Icon & '...' Menu hidden on mobile) */}
        <div className="flex min-w-0 items-center gap-1.5 pr-1 sm:pr-2">
          <span
            className="hidden sm:inline-flex material-symbols-outlined text-[22px] text-primary shrink-0"
            aria-hidden="true"
          >
            storefront
          </span>
          <h1 className="min-w-0 max-w-[90px] min-[360px]:max-w-[120px] min-[400px]:max-w-[160px] sm:max-w-none truncate font-display text-xs sm:text-sm font-extrabold tracking-tight text-foreground">
            {store.name || "My Store"}
          </h1>
          <button
            type="button"
            onClick={onOpenNavMenu}
            aria-label="More vendor navigation"
            className="hidden sm:flex shrink-0 items-center justify-center rounded-lg p-1 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              more_horiz
            </span>
          </button>
        </div>

        {/* Right Operational Controls: [Prep] [Status] [Bell] [Avatar] */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Prep Time Setting */}
          <button
            type="button"
            onClick={onChangePrepTime}
            className="flex h-8 sm:h-9 shrink-0 items-center gap-1 rounded-xl border border-border bg-surface-elevated px-2 py-1 font-display text-[10px] font-bold text-foreground transition-colors hover:border-primary/40 active:scale-95 sm:gap-1.5 sm:px-3 sm:text-caption"
          >
            <span className="material-symbols-outlined text-[13px] text-muted sm:text-[16px]" aria-hidden="true">
              schedule
            </span>
            <span className="whitespace-nowrap">
              PREP: {store.prepTimeMinutes}<span className="hidden sm:inline"> MINS</span>
              <span className="sm:hidden">M</span>
            </span>
          </button>

          {/* Store Status Toggle */}
          <div className="flex h-8 sm:h-9 shrink-0 items-center gap-1 sm:gap-2 rounded-full border border-border bg-surface-elevated px-2 sm:px-3 py-1">
            <span
              className={`font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                store.isOpen ? "text-success" : "text-muted"
              }`}
            >
              {store.isOpen ? "OPEN" : "CLOSED"}
            </span>
            <button
              type="button"
              onClick={onToggleStatus}
              aria-label="Toggle store status"
              className={`relative h-4 w-7 sm:h-5 sm:w-9 rounded-full transition-colors duration-200 ${
                store.isOpen ? "bg-primary" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  store.isOpen ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
          >
            <span
              className={`material-symbols-outlined text-[18px] sm:text-[22px] ${pendingOrderCount > 0 ? "animate-pulse text-primary" : ""}`}
              aria-hidden="true"
            >
              notifications
            </span>
            {pendingOrderCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 font-display text-[9px] font-extrabold text-on-primary ring-2 ring-background">
                {pendingOrderCount}
              </span>
            ) : (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>

          {/* Vendor Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Vendor profile"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-full border border-border transition-transform active:scale-95"
          >
            <Image
              src={store.avatarUrl}
              alt={store.name || "Vendor Profile"}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
