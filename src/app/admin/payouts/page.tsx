"use client";

import { formatPrice } from "@/lib/constants";

export default function AdminPayoutsPage() {
  const payouts = [
    { vendor: "Rajan Kumar", canteen: "Café Central", amount: 250000, status: "pending" as const, requested: "Aug 13, 2026" },
    { vendor: "Meena Devi", canteen: "South Side Bites", amount: 180000, status: "pending" as const, requested: "Aug 12, 2026" },
    { vendor: "Rajan Kumar", canteen: "Café Central", amount: 320000, status: "paid" as const, requested: "Aug 8, 2026" },
    { vendor: "Amit Sharma", canteen: "Quick Bites Corner", amount: 95000, status: "paid" as const, requested: "Aug 5, 2026" },
    { vendor: "Meena Devi", canteen: "South Side Bites", amount: 275000, status: "paid" as const, requested: "Aug 1, 2026" },
  ];

  const totalPending = payouts
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="px-4 pt-6 md:px-8 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Payouts</h1>
      <p className="text-sm text-text-secondary mb-8">
        Pending: <span className="font-mono text-warning font-semibold">{formatPrice(totalPending)}</span>
      </p>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="divide-y divide-border/50">
          {payouts.map((payout, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{payout.vendor}</p>
                <p className="text-xs text-text-muted">{payout.canteen} · {payout.requested}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">
                  {formatPrice(payout.amount)}
                </span>
                <span
                  className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${
                      payout.status === "pending"
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                    }
                  `}
                >
                  {payout.status === "pending" ? "Pending" : "Paid"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
