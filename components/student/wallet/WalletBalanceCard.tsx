"use client";

import type { Wallet } from "@/lib/mock/wallet";

interface WalletBalanceCardProps {
  wallet: Wallet;
  onAddMoney: () => void;
  onTransfer: () => void;
}

export function WalletBalanceCard({
  wallet,
  onAddMoney,
  onTransfer,
}: WalletBalanceCardProps) {
  const formattedBalance = wallet.balance.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-3xl p-6 shadow-2xl"
      style={{ background: "linear-gradient(135deg, #FF7A00 0%, #E96800 100%)" }}
    >
      {/* Decorative Blur Circles */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 text-white">
        <p className="mb-1 font-display text-caption font-bold uppercase tracking-widest text-white/90">
          Total Balance
        </p>

        <h2 className="mb-6 flex items-baseline gap-1 font-display text-[38px] font-extrabold text-white tracking-tight sm:text-[44px]">
          <span className="font-display text-[28px] font-bold text-white/90">
            {wallet.currency}
          </span>
          {formattedBalance}
        </h2>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAddMoney}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3.5 font-display text-body-sm font-bold text-primary shadow-md transition-all duration-150 active:scale-[0.97] hover:bg-white/95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              add_circle
            </span>
            Add Money
          </button>

          <button
            type="button"
            onClick={onTransfer}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/20 py-3.5 font-display text-body-sm font-bold text-white transition-all duration-150 active:scale-[0.97] hover:bg-black/30 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              send
            </span>
            Transfer
          </button>
        </div>
      </div>
    </section>
  );
}
