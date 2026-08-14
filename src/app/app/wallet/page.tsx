"use client";

import { formatPrice } from "@/lib/constants";
import { useAuth } from "@/lib/store/auth";

export default function WalletPage() {
  const { student } = useAuth();
  // Mock wallet data
  const balance = student?.is_gold_subscriber ? 55000 : 25000;

  const bonusOptions = [
    { amount: 20000, bonus: 1000 },
    { amount: 50000, bonus: 5000 },
    { amount: 100000, bonus: 10000 },
  ];

  const transactions = [
    { type: "credit" as const, amount: 50000, bonus: 5000, ref: "Top-up", date: "Today, 2:30 PM" },
    { type: "debit" as const, amount: 4000, bonus: 0, ref: "Order #A1B2C3", date: "Today, 1:15 PM" },
    { type: "debit" as const, amount: 7000, bonus: 0, ref: "Order #D4E5F6", date: "Yesterday, 12:45 PM" },
    { type: "credit" as const, amount: 20000, bonus: 1000, ref: "Top-up", date: "2 days ago" },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Wallet</h1>

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 p-6 mb-8 animate-fade-in">
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Available Balance
        </p>
        <p className="text-4xl font-bold font-mono tracking-tight mt-2 text-text">
          {formatPrice(balance)}
        </p>
        {student?.is_gold_subscriber && (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
            ✦ GrabIt Gold
          </span>
        )}
      </div>

      {/* Top-up options */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
          Top Up
        </h2>
        <div className="grid grid-cols-3 gap-3 stagger-children">
          {bonusOptions.map((opt) => (
            <button
              key={opt.amount}
              className="
                rounded-xl border border-border bg-surface p-3
                text-center transition-all duration-200
                hover:border-accent/40 hover:bg-surface-2
                active:scale-95
              "
            >
              <p className="font-mono font-semibold text-sm text-text">
                {formatPrice(opt.amount)}
              </p>
              <p className="text-[10px] text-success font-medium mt-1">
                Get {formatPrice(opt.amount + opt.bonus)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
          Recent Transactions
        </h2>
        <div className="space-y-3 stagger-children">
          {transactions.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-sm
                    ${tx.type === "credit" ? "bg-success/10 text-success" : "bg-error/10 text-error"}
                  `}
                >
                  {tx.type === "credit" ? "↓" : "↑"}
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{tx.ref}</p>
                  <p className="text-xs text-text-muted">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono text-sm font-semibold ${tx.type === "credit" ? "text-success" : "text-error"}`}>
                  {tx.type === "credit" ? "+" : "-"}{formatPrice(tx.amount)}
                </p>
                {tx.bonus > 0 && (
                  <p className="text-[10px] text-success">
                    +{formatPrice(tx.bonus)} bonus
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
