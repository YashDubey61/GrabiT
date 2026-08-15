"use client";

import Image from "next/image";
import type { VendorStoreConfig } from "@/lib/mock/vendor";

interface VendorHeaderProps {
  store: VendorStoreConfig;
  onToggleStatus: () => void;
  onChangePrepTime: () => void;
  onOpenNotifications: () => void;
}

export function VendorHeader({
  store,
  onToggleStatus,
  onChangePrepTime,
  onOpenNotifications,
}: VendorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
      {/* Brand & Hub Title */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
          location_on
        </span>
        <h1 className="font-display text-title font-extrabold tracking-tight text-primary">
          GrabIt
        </h1>
        <div className="hidden sm:block h-5 w-[1px] bg-border" />
        <span className="hidden sm:inline-block font-display text-caption font-bold tracking-wider text-muted uppercase">
          {store.hubTitle}
        </span>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Prep Time Setting */}
        <button
          type="button"
          onClick={onChangePrepTime}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground transition-colors hover:border-primary/40 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px] text-muted" aria-hidden="true">
            schedule
          </span>
          <span>PREP: {store.prepTimeMinutes} MINS</span>
        </button>

        {/* Store Status Toggle */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1">
          <span
            className={`font-display text-[11px] font-bold uppercase tracking-wider ${
              store.isOpen ? "text-success" : "text-muted"
            }`}
          >
            {store.isOpen ? "OPEN" : "CLOSED"}
          </span>
          <button
            type="button"
            onClick={onToggleStatus}
            aria-label="Toggle store status"
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
              store.isOpen ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                store.isOpen ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-elevated hover:text-foreground active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            notifications
          </span>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* Vendor Avatar */}
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border">
          <Image
            src={store.avatarUrl}
            alt={store.name}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
