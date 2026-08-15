"use client";

import { useState } from "react";
import {
  MOCK_TRANSACTIONS,
  type WalletTransaction,
  type TransactionCategory,
} from "@/lib/mock/wallet";
import { WalletTransactionItem } from "@/components/student/wallet/WalletTransactionItem";

interface WalletTransactionListProps {
  transactions?: WalletTransaction[];
  onTransactionClick?: (tx: WalletTransaction) => void;
}

export function WalletTransactionList({
  transactions = MOCK_TRANSACTIONS,
  onTransactionClick,
}: WalletTransactionListProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | TransactionCategory>("all");

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    return tx.category === activeFilter;
  });

  return (
    <section className="flex flex-col gap-4">
      {/* Header & Filter Row */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-title font-bold text-foreground">
          Recent Transactions
        </h3>

        <button
          type="button"
          onClick={() =>
            setActiveFilter((prev) => (prev === "all" ? "food" : "all"))
          }
          className="font-display text-caption font-semibold text-primary hover:underline"
        >
          {activeFilter === "all" ? "Filter Food" : "Show All"}
        </button>
      </div>

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-[#1e1f26]/50 p-6 text-center backdrop-blur-md">
          <p className="text-body-sm text-muted">No transactions found in this category.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((tx) => (
            <WalletTransactionItem
              key={tx.id}
              transaction={tx}
              onSelect={onTransactionClick}
            />
          ))}
        </div>
      )}
    </section>
  );
}
