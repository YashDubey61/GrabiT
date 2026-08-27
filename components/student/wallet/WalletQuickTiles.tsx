"use client";

import Link from "next/link";
import type { Wallet } from "@/lib/mock/wallet";

interface WalletQuickTilesProps {
  wallet: Wallet;
  rewardsPoints?: number;
  onTileClick?: (tile: string) => void;
}

export function WalletQuickTiles({
  wallet,
  rewardsPoints = 1250,
  onTileClick,
}: WalletQuickTilesProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3.5">
      {/* GrabIt Rewards Tile */}
      <Link
        href="/customer/rewards"
        onClick={() => onTileClick?.("rewards")}
        className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 text-left backdrop-blur-md transition-all duration-150 active:scale-[0.98] hover:border-primary/40 group"
      >
        <div className="flex flex-col gap-1">
          <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
            redeem
          </span>
          <span className="font-display text-body-sm font-bold text-foreground group-hover:text-primary transition-colors">
            GrabIt Rewards
          </span>
          <span className="text-caption text-faint">
            {rewardsPoints.toLocaleString()} points
          </span>
        </div>
        <span className="mt-2 text-[11px] font-medium text-primary flex items-center gap-0.5">
          Redeem rewards →
        </span>
      </Link>

      {/* Cashback Tile */}
      <button
        type="button"
        onClick={() => onTileClick?.("cashback")}
        className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 text-left backdrop-blur-md transition-all duration-150 active:scale-[0.98] hover:border-white/20"
      >
        <div className="flex flex-col gap-1">
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
        </div>
      </button>
    </div>
  );
}

