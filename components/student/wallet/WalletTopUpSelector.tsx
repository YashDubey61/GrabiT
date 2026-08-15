"use client";

import { useState } from "react";
import { MOCK_TOPUP_OPTIONS, type TopUpOption } from "@/lib/mock/wallet";

interface WalletTopUpSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTopUp: (option: TopUpOption) => void;
}

export function WalletTopUpSelector({
  isOpen,
  onClose,
  onConfirmTopUp,
}: WalletTopUpSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<TopUpOption>(
    MOCK_TOPUP_OPTIONS.find((o) => o.isRecommended) ?? MOCK_TOPUP_OPTIONS[0],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-[#121212] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
              add_card
            </span>
            <h3 className="font-display text-title font-bold text-foreground">
              Add Money to Wallet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <p className="mb-4 text-body-sm text-muted">
          Select an amount to top up your GrabIt Wallet. Instant checkout & zero payment gateway fees.
        </p>

        {/* Preset Amount Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {MOCK_TOPUP_OPTIONS.map((opt) => {
            const isSelected = selectedOption.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`relative flex flex-col items-center justify-center rounded-xl border p-4 transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-glow-primary"
                    : "border-border bg-[#1e1f26] text-foreground hover:border-white/20"
                }`}
              >
                {opt.isRecommended && (
                  <span className="absolute -top-2.5 rounded-full bg-primary px-2 py-0.5 font-display text-[9px] font-bold uppercase tracking-wider text-on-primary">
                    Popular
                  </span>
                )}
                <span className="font-display text-title font-bold">
                  ₹{opt.amount}
                </span>
                {opt.bonusLabel && (
                  <span className="mt-1 font-display text-[11px] font-semibold text-success">
                    {opt.bonusLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 font-display text-body-sm font-bold text-muted hover:bg-surface-elevated hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmTopUp(selectedOption);
              onClose();
            }}
            className="flex-1 rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
          >
            Proceed (₹{selectedOption.amount})
          </button>
        </div>
      </div>
    </div>
  );
}
