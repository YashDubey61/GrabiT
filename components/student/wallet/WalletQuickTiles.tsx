"use client";

import type { Wallet } from "@/lib/mock/wallet";

interface WalletQuickTilesProps {
  wallet: Wallet;
  onTileClick?: (tile: string) => void;
}

export function WalletQuickTiles({ wallet, onTileClick }: WalletQuickTilesProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3.5">
      {/* Linked Bank Tile */}
      <button
        type="button"
        onClick={() => onTileClick?.("bank")}
        className="flex flex-col gap-1 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 text-left backdrop-blur-md transition-all duration-150 active:scale-[0.98] hover:border-white/20"
      >
        <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
          account_balance
        </span>
        <span className="font-display text-body-sm font-bold text-foreground">
          Linked Bank
        </span>
        <span className="text-caption text-faint">{wallet.linkedBank}</span>
      </button>

      {/* Cashback Tile */}
      <button
        type="button"
        onClick={() => onTileClick?.("cashback")}
        className="flex flex-col gap-1 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 text-left backdrop-blur-md transition-all duration-150 active:scale-[0.98] hover:border-white/20"
      >
        <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
          savings
        </span>
        <span className="font-display text-body-sm font-bold text-foreground">
          Cashback
        </span>
        <span className="text-caption text-faint">
          {wallet.currency}
          {wallet.cashbackBalance.toFixed(2)} earned
        </span>
      </button>
    </div>
  );
}
