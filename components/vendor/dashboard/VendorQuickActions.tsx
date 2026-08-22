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
      color: "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-95",
    },
    {
      label: "Add New Item",
      icon: "add_circle",
      onClick: onAddNewItem,
      primary: false,
      color: "bg-surface-elevated border border-border text-foreground hover:border-primary/40 hover:text-primary",
    },
    {
      label: "Manage Menu",
      icon: "restaurant_menu",
      href: "/vendor/menu",
      primary: false,
      color: "bg-surface-elevated border border-border text-foreground hover:border-primary/40 hover:text-primary",
    },
    {
      label: "View Orders Board",
      icon: "soup_kitchen",
      onClick: onScrollToOrders,
      primary: false,
      color: "bg-surface-elevated border border-border text-foreground hover:border-primary/40 hover:text-primary",
    },
    {
      label: "Analytics & Payouts",
      icon: "monitoring",
      href: "/vendor/analytics",
      primary: false,
      color: "bg-surface-elevated border border-border text-foreground hover:border-primary/40 hover:text-primary",
    },
    {
      label: "Manual Cash Order",
      icon: "point_of_sale",
      onClick: onOpenManualOrder,
      primary: false,
      color: "bg-surface-elevated border border-border text-foreground hover:border-primary/40 hover:text-primary",
    },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-display text-title font-bold text-foreground">
            Quick Actions
          </h2>
          <p className="text-caption text-muted">
            Frequent operations & canteen management shortcuts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((act, idx) =>
          act.href ? (
            <Link
              key={idx}
              href={act.href}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 text-center font-display text-caption font-bold transition-all active:scale-95 ${act.color}`}
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
              className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3.5 text-center font-display text-caption font-bold transition-all active:scale-95 ${act.color}`}
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
