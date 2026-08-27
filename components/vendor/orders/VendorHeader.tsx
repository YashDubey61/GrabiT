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
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#08080a]/85 backdrop-blur-2xl pt-[var(--safe-area-inset-top,0px)] transition-all">
      <div className="flex h-14 sm:h-16 w-full items-center justify-between px-3 sm:px-6">
        {/* Left: Clean Store Name */}
        <div className="flex min-w-0 items-center gap-2 pr-1 sm:pr-2">
          <span
            className="inline-flex material-symbols-outlined text-[22px] text-primary shrink-0 drop-shadow-[0_0_8px_rgba(255,122,0,0.4)]"
            aria-hidden="true"
          >
            storefront
          </span>
          <h1 className="min-w-0 max-w-[120px] min-[360px]:max-w-[160px] sm:max-w-none truncate font-display text-sm sm:text-base font-extrabold tracking-tight text-white">
            {store.name || "My Store"}
          </h1>
          <button
            type="button"
            onClick={onOpenNavMenu}
            aria-label="More vendor navigation"
            className="hidden sm:flex shrink-0 items-center justify-center rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              more_horiz
            </span>
          </button>
        </div>

        {/* Right Operational Controls: [Prep] [Status] [Bell] [Avatar] */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Prep Time Setting */}
          <button
            type="button"
            onClick={onChangePrepTime}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-3 py-1 font-display text-[11px] font-bold text-white backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white/[0.08] active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">
              schedule
            </span>
            <span className="whitespace-nowrap">
              PREP: <strong className="text-white font-mono">{store.prepTimeMinutes}M</strong>
            </span>
          </button>

          {/* Store Status Toggle */}
          <div className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 backdrop-blur-md">
            <span
              className={`font-display text-[11px] font-extrabold uppercase tracking-wider ${
                store.isOpen ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              {store.isOpen ? "OPEN" : "CLOSED"}
            </span>
            <button
              type="button"
              onClick={onToggleStatus}
              aria-label="Toggle store status"
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                store.isOpen ? "bg-primary shadow-[0_0_10px_rgba(255,122,0,0.5)]" : "bg-white/[0.15]"
              }`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
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
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.04] text-zinc-400 backdrop-blur-md transition-all hover:border-primary/40 hover:text-white hover:bg-white/[0.08] active:scale-95 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${pendingOrderCount > 0 ? "animate-pulse text-primary" : ""}`}
              aria-hidden="true"
            >
              notifications
            </span>
            {pendingOrderCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-display text-[9px] font-extrabold text-black ring-2 ring-black">
                {pendingOrderCount}
              </span>
            ) : (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-black" />
            )}
          </button>

          {/* Vendor Avatar */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Vendor profile"
            className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/[0.15] transition-transform active:scale-95 cursor-pointer hover:border-primary/50 shadow-sm"
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
