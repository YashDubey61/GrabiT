"use client";

import type { WalletTransaction } from "@/lib/mock/wallet";

interface WalletTransactionItemProps {
  transaction: WalletTransaction;
  onSelect?: (tx: WalletTransaction) => void;
}

export function WalletTransactionItem({
  transaction,
  onSelect,
}: WalletTransactionItemProps) {
  const isDebit = transaction.type === "debit";
  const formattedAmount = `${isDebit ? "-" : "+"} ₹${transaction.amount.toFixed(2)}`;

  return (
    <div
      onClick={() => onSelect?.(transaction)}
      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all duration-150 active:scale-[0.98] hover:border-white/20"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated text-primary shadow-sm">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            {transaction.icon}
          </span>
        </div>

        <div>
          <p className="font-display text-body-sm font-bold text-foreground">
            {transaction.title}
          </p>
          <p className="text-caption text-faint">{transaction.subtitle}</p>
        </div>
      </div>

      <p
        className={`font-display text-body-sm font-bold ${
          isDebit ? "text-danger" : "text-primary"
        }`}
      >
        {formattedAmount}
      </p>
    </div>
  );
}
