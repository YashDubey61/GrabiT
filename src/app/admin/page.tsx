"use client";

import { formatPrice } from "@/lib/constants";

export default function AdminRevenuePage() {
  const metrics = [
    { label: "Orders Today", value: "147", change: "+12%", color: "text-accent" },
    { label: "GMV", value: formatPrice(8450000), change: "+8%", color: "text-success" },
    { label: "Platform Fees", value: formatPrice(425000), change: "+15%", color: "text-warning" },
    { label: "Gold Subscribers", value: "23", change: "+3", color: "text-accent" },
  ];

  // Sparkline data (7 days)
  const sparklines: Record<string, number[]> = {
    "Orders Today": [95, 102, 88, 120, 115, 138, 147],
    "GMV": [52, 61, 48, 72, 68, 78, 84],
    "Platform Fees": [28, 32, 25, 38, 35, 40, 42],
    "Gold Subscribers": [18, 18, 19, 20, 20, 22, 23],
  };

  return (
    <div className="px-4 pt-6 md:px-8 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Revenue Dashboard</h1>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger-children">
        {metrics.map((metric) => {
          const data = sparklines[metric.label] || [];
          const max = Math.max(...data);
          const min = Math.min(...data);
          const range = max - min || 1;

          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-border bg-surface p-5 relative overflow-hidden"
            >
              <p className="text-xs text-text-secondary uppercase tracking-wider">
                {metric.label}
              </p>
              <p className={`text-2xl font-bold font-mono mt-2 ${metric.color}`}>
                {metric.value}
              </p>
              <span className="text-xs text-success font-medium mt-1 inline-block">
                {metric.change}
              </span>

              {/* Mini sparkline */}
              <div className="flex items-end gap-px mt-3 h-8">
                {data.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent/20 rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${((val - min) / range) * 100}%`,
                      minHeight: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent revenue table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Revenue by Canteen</h2>
        </div>
        <div className="divide-y divide-border/50">
          {[
            { name: "Café Central", orders: 62, revenue: 3860000, fees: 186000 },
            { name: "South Side Bites", orders: 53, revenue: 3120000, fees: 156000 },
            { name: "Quick Bites Corner", orders: 32, revenue: 1470000, fees: 83000 },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{row.name}</p>
                <p className="text-xs text-text-muted">{row.orders} orders</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">
                  {formatPrice(row.revenue)}
                </p>
                <p className="text-xs text-text-muted">
                  Fees: {formatPrice(row.fees)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
