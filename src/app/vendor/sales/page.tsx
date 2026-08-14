"use client";

import { formatPrice } from "@/lib/constants";

export default function VendorSalesPage() {
  // Mock sales data
  const summary = {
    totalOrders: 24,
    totalRevenue: 384000, // ₹3,840
    avgOrderValue: 16000,
    topItem: "Masala Dosa",
  };

  const itemBreakdown = [
    { name: "Masala Dosa", qty: 8, revenue: 32000 },
    { name: "Filter Coffee", qty: 12, revenue: 24000 },
    { name: "Samosa", qty: 15, revenue: 22500 },
    { name: "Veg Biryani", qty: 5, revenue: 35000 },
    { name: "Cold Coffee", qty: 6, revenue: 21000 },
    { name: "Paneer Tikka", qty: 3, revenue: 18000 },
    { name: "Chai", qty: 10, revenue: 15000 },
  ];

  const maxRevenue = Math.max(...itemBreakdown.map((i) => i.revenue));

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-bold tracking-tight mb-6">Today&apos;s Sales</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-8 stagger-children">
        {[
          { label: "Orders", value: summary.totalOrders.toString(), color: "text-accent" },
          { label: "Revenue", value: formatPrice(summary.totalRevenue), color: "text-success" },
          { label: "Avg Order", value: formatPrice(summary.avgOrderValue), color: "text-text" },
          { label: "Top Item", value: summary.topItem, color: "text-warning" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-text-secondary uppercase tracking-wider">
              {card.label}
            </p>
            <p className={`text-xl font-bold font-mono mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Item breakdown */}
      <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-4">
        Item Breakdown
      </h2>
      <div className="space-y-3 stagger-children">
        {itemBreakdown.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text">{item.name}</span>
              <span className="font-mono text-text-secondary">
                {item.qty} sold · {formatPrice(item.revenue)}
              </span>
            </div>
            {/* CSS bar chart */}
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700 ease-out"
                style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
