"use client";

import React from "react";
import Link from "next/link";
import { GrabItLogo } from "@/components/shared/GrabItLogo";

export interface DashboardHeaderProps {
  title: string;
  roleBadge?: string;
  subtitle?: string;
  searchSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  className?: string;
  onOpenMobileMenu?: () => void;
}

/**
 * Universal glass dashboard header across role surfaces (Student, Vendor, Super Admin).
 */
export function DashboardHeader({
  title,
  roleBadge,
  subtitle,
  searchSlot,
  actionsSlot,
  className = "",
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-white/[0.08] bg-background/80 backdrop-blur-2xl px-4 py-3 sm:px-6 transition-all ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Mobile trigger & Branding / Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-surface-elevated text-foreground md:hidden hover:border-primary/40 active:scale-95"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <GrabItLogo href="/" heightClassName="h-7" />

            <span className="hidden sm:inline text-border-strong">/</span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-body sm:text-heading font-extrabold text-foreground truncate">
                  {title}
                </h1>
                {roleBadge && (
                  <span className="shrink-0 rounded-full bg-primary/10 border border-primary/30 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                    {roleBadge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="hidden sm:block text-[11px] text-muted truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search slot */}
        {searchSlot && <div className="hidden md:flex flex-1 max-w-md mx-4">{searchSlot}</div>}

        {/* Right: Actions */}
        {actionsSlot && <div className="flex items-center gap-2 shrink-0">{actionsSlot}</div>}
      </div>
    </header>
  );
}
