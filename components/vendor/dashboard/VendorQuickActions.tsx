"use client";

import Link from "next/link";

export interface VendorQuickActionsProps {
  onAddNewItem: () => void;
  onOpenScanner: (mode: "qr" | "otp") => void;
  onScrollToOrders: () => void;
  onOpenManualOrder: () => void;
}

export function VendorQuickActions({
  onAddNewItem,
  onOpenScanner,
  onScrollToOrders,
  onOpenManualOrder,
}: VendorQuickActionsProps) {
  const actions = [
    {
      label: "Scan Order QR",
      icon: "qr_code_scanner",
      onClick: () => onOpenScanner("qr"),
      primary: true,
      color: "bg-primary text-black shadow-[0_4px_20px_-2px_rgba(255,122,0,0.45)] hover:bg-primary-soft border border-primary",
    },
    {
      label: "Add New Item",
      icon: "add_circle",
      onClick: onAddNewItem,
      primary: false,
      color: "border border-white/[0.08] bg-white/[0.04] text-white hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary",
    },
    {
      label: "Manage Menu",
      icon: "restaurant_menu",
      href: "/vendor/menu",
      primary: false,
      color: "border border-white/[0.08] bg-white/[0.04] text-white hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary",
    },
    {
      label: "Orders Board",
      icon: "soup_kitchen",
      onClick: onScrollToOrders,
      primary: false,
      color: "border border-white/[0.08] bg-white/[0.04] text-white hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary",
    },
    {
      label: "Analytics & Payouts",
      icon: "monitoring",
      href: "/vendor/analytics",
      primary: false,
      color: "border border-white/[0.08] bg-white/[0.04] text-white hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary",
    },
    {
      label: "Manual Cash Order",
      icon: "point_of_sale",
      onClick: onOpenManualOrder,
      primary: false,
      color: "border border-white/[0.08] bg-white/[0.04] text-white hover:border-primary/40 hover:bg-white/[0.08] hover:text-primary",
    },
  ];

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-4 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)]">
      {/* Top glare highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <h2 className="font-display text-title font-extrabold text-white">
            Quick Actions
          </h2>
          <p className="text-caption text-zinc-400">
            Frequent operations &amp; canteen management shortcuts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, idx) =>
          act.href ? (
            <Link
              key={idx}
              href={act.href}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center font-display text-caption font-extrabold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${act.color}`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {act.icon}
              </span>
              <span>{act.label}</span>
            </Link>
          ) : (
            <button
              key={idx}
              type="button"
              onClick={act.onClick}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center font-display text-caption font-extrabold backdrop-blur-md transition-all active:scale-95 cursor-pointer ${act.color}`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {act.icon}
              </span>
              <span>{act.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
