"use client";

import { useState } from "react";
import type { VendorBankAccount } from "@/lib/supabase/vendor_payouts";

export interface VendorPayoutAccountCardProps {
  bankAccount: VendorBankAccount;
  onSaveBankAccount: (payload: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export function VendorPayoutAccountCard({
  bankAccount,
  onSaveBankAccount,
}: VendorPayoutAccountCardProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [holderName, setHolderName] = useState(bankAccount.accountHolderName);
  const [bankName, setBankName] = useState(bankAccount.bankName);
  const [accNum, setAccNum] = useState("");
  const [confirmAccNum, setConfirmAccNum] = useState("");
  const [ifsc, setIfsc] = useState(bankAccount.ifscCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenModal = () => {
    setHolderName(bankAccount.accountHolderName || "");
    setBankName(bankAccount.bankName || "");
    setAccNum("");
    setConfirmAccNum("");
    setIfsc(bankAccount.ifscCode || "");
    setErrorMsg(null);
    setIsOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanHolder = holderName.trim();
    const cleanBank = bankName.trim();
    const cleanAcc = accNum.trim();
    const cleanConfirm = confirmAccNum.trim();
    const cleanIfsc = ifsc.trim().toUpperCase();

    if (!cleanHolder || !cleanBank || !cleanAcc || !cleanConfirm || !cleanIfsc) {
      setErrorMsg("All fields (Account Holder, Bank Name, Account Number, Confirm Account Number, IFSC) are required.");
      return;
    }

    if (cleanAcc !== cleanConfirm) {
      setErrorMsg("Account numbers do not match. Please re-enter and confirm.");
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanIfsc)) {
      setErrorMsg("Invalid IFSC format. Must be 11 characters starting with 4 letters, then '0', then 6 alphanumeric characters (e.g. HDFC0001234).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveBankAccount({
        accountHolderName: cleanHolder,
        bankName: cleanBank,
        accountNumber: cleanAcc,
        ifscCode: cleanIfsc,
      });

      if (!res.ok) {
        setErrorMsg(res.error || "Failed to save bank account details.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsOpenModal(false);
      setAccNum("");
      setConfirmAccNum("");
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Bank Payout Account
            </h3>
            <p className="text-caption text-muted">
              Designated bank account for Cashfree settlement payouts
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 font-display text-caption font-bold text-primary hover:bg-primary hover:text-on-primary transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            {bankAccount.isConfigured ? "Edit Account" : "Setup Account"}
          </button>
        </div>

        {bankAccount.isConfigured ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <span className="text-caption text-faint block">Account Holder</span>
              <span className="font-display text-body-sm font-bold text-foreground">
                {bankAccount.accountHolderName}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <span className="text-caption text-faint block">Bank Name</span>
              <span className="font-display text-body-sm font-bold text-foreground">
                {bankAccount.bankName}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <span className="text-caption text-faint block">Account Number</span>
              <span className="font-mono text-body-sm font-bold text-primary">
                {bankAccount.maskedAccountNumber}
              </span>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/50 p-3 flex items-center justify-between">
              <div>
                <span className="text-caption text-faint block">IFSC Code</span>
                <span className="font-mono text-body-sm font-bold text-foreground">
                  {bankAccount.ifscCode}
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 font-display text-[10px] font-extrabold uppercase">
                Verified
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-400 text-[24px]">account_balance</span>
              <div>
                <span className="font-display text-body-sm font-bold text-foreground block">
                  Bank Account Pending Configuration
                </span>
                <span className="text-caption text-muted">
                  Add your bank details to enable automated 6 PM daily payouts.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="rounded-xl bg-primary px-4 py-2 font-display text-caption font-extrabold text-on-primary shadow-glow-primary shrink-0"
            >
              Add Bank Account
            </button>
          </div>
        )}
      </div>

      {/* Configure Bank Account Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface-elevated p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-title font-bold text-foreground">
                Configure Bank Account
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                disabled={isSubmitting}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-caption font-semibold text-danger animate-fade-in">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="e.g. Campus Foods Private Limited"
                  className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank / ICICI Bank"
                  className="w-full rounded-xl border border-border bg-background p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Account Number
                </label>
                <input
                  type="password"
                  required
                  value={accNum}
                  onChange={(e) => setAccNum(e.target.value)}
                  placeholder="Enter full bank account number"
                  className="w-full rounded-xl border border-border bg-background p-3 text-body-sm font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  Confirm Account Number
                </label>
                <input
                  type="password"
                  required
                  value={confirmAccNum}
                  onChange={(e) => setConfirmAccNum(e.target.value)}
                  placeholder="Re-enter bank account number"
                  className="w-full rounded-xl border border-border bg-background p-3 text-body-sm font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-display text-caption font-bold text-muted">
                  IFSC Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full rounded-xl border border-border bg-background p-3 text-body-sm font-mono text-foreground uppercase focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-border bg-background py-3 font-display text-body-sm font-bold text-muted hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Bank Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
