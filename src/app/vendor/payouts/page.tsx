"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/constants";

export default function VendorPayoutsPage() {
  const [requested, setRequested] = useState(false);

  const payoutHistory = [
    { id: "p1", amount: 250000, status: "paid" as const, requested_at: "Aug 10, 2026", paid_at: "Aug 11, 2026" },
    { id: "p2", amount: 180000, status: "paid" as const, requested_at: "Aug 3, 2026", paid_at: "Aug 4, 2026" },
    { id: "p3", amount: 320000, status: "paid" as const, requested_at: "Jul 27, 2026", paid_at: "Jul 28, 2026" },
  ];

  const pendingBalance = 184000; // ₹1,840

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-bold tracking-tight mb-6">Payouts</h1>

      {/* Pending balance */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 p-6 mb-6">
        <p className="text-xs text-text-secondary uppercase tracking-wider">Pending Balance</p>
        <p className="text-3xl font-bold font-mono mt-1">{formatPrice(pendingBalance)}</p>
        <button
          onClick={() => setRequested(true)}
          disabled={requested}
          className={`
            mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200
            ${requested
              ? "bg-success/20 text-success border border-success/30"
              : "bg-accent text-bg hover:bg-accent-dim active:scale-95"
            }
          `}
        >
          {requested ? "✓ Payout Requested" : "Request Payout"}
        </button>
      </div>

      {/* History */}
      <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
        Payout History
      </h2>
      <div className="space-y-3 stagger-children">
        {payoutHistory.map((payout) => (
          <div
            key={payout.id}
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-mono text-sm font-semibold">{formatPrice(payout.amount)}</p>
              <p className="text-xs text-text-muted">{payout.requested_at}</p>
            </div>
            <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
              Paid
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
