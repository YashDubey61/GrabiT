"use client";

import { useCallback, useEffect, useState } from "react";
import { openCashfreeCheckout } from "@/lib/payments/cashfree_client";

interface LedgerSummary {
  totalPaymentsReceived: number;
  refunds: number;
  grabitCommission: number;
  vendorPayoutLiability: number;
  vendorPayouts: number;
  adjustments: number;
  ledgerBalance: number;
}

interface AdjustmentRow {
  id: string;
  transaction_type: string;
  direction: "CREDIT" | "DEBIT";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  cashfree_order_id: string | null;
  notes: string | null;
  created_at: string;
}

interface WalletTopupRow {
  id: string;
  studentName: string;
  topupAmount: number;
  bonusAmount: number;
  totalWalletCredit: number;
  cashfreePaymentId: string | null;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
}

function WalletTopupsSection() {
  const [topups, setTopups] = useState<WalletTopupRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin/wallet-topups")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setTopups(data.topups);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-heading-sm font-800 text-foreground">Student Wallet Top-Ups</h2>
      <p className="text-caption text-muted">
        The 10% bonus applies only to individual top-ups of ₹500 or more — never cumulative activity.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-border text-label font-bold text-muted uppercase">
              <th className="p-3">Student</th>
              <th className="p-3 text-right">Top-up</th>
              <th className="p-3 text-right">Bonus</th>
              <th className="p-3 text-right">Wallet Credit</th>
              <th className="p-3">Cashfree Payment ID</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-semibold">
            {!isLoading && topups.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted">No wallet top-ups yet.</td>
              </tr>
            )}
            {topups.map((t) => (
              <tr key={t.id} className="hover:bg-surface/50">
                <td className="p-3">{t.studentName}</td>
                <td className="p-3 text-right font-mono">₹{t.topupAmount.toLocaleString()}</td>
                <td className={`p-3 text-right font-mono ${t.bonusAmount > 0 ? "text-success" : "text-muted"}`}>
                  {t.bonusAmount > 0 ? `+ ₹${t.bonusAmount.toLocaleString()}` : "—"}
                </td>
                <td className="p-3 text-right font-mono">₹{t.totalWalletCredit.toLocaleString()}</td>
                <td className="p-3 font-mono text-caption text-muted">{t.cashfreePaymentId ?? "—"}</td>
                <td className="p-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusBadge(t.status)}`}>{t.status}</span>
                </td>
                <td className="p-3 text-caption text-muted">{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusBadge(status: AdjustmentRow["status"]) {
  if (status === "SUCCESS") return "border-success/30 bg-success/5 text-success";
  if (status === "FAILED") return "border-destructive/40 bg-destructive/10 text-destructive";
  return "border-warning/30 bg-warning/5 text-warning";
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" | "default" }) {
  const color = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="text-label font-bold uppercase text-muted">{label}</p>
      <p className={`mt-1 font-display text-heading-sm font-900 ${color}`}>₹{value.toLocaleString()}</p>
    </div>
  );
}

export default function FinancialLedgerPage() {
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/wallet?days=30");
      const data = await res.json();
      if (data.ok) {
        setLedger(data.ledger);
        setAdjustments(data.adjustmentHistory);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleAddAdjustment = async () => {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/wallet/add-funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Couldn't start adjustment.");
        setIsSubmitting(false);
        return;
      }
      await openCashfreeCheckout(data.paymentSessionId, data.paymentMode === "PRODUCTION" ? "production" : "sandbox");
      setShowAddFunds(false);
      setAmount("");
      await load();
    } catch {
      setError("Something went wrong opening checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">GRABIT Financial Ledger</h1>
          <p className="mt-1 text-body-sm text-muted">
            Internal accounting derived from real Cashfree payments and vendor settlements — an accounting record, not a live payout account.
            For the actual Cashfree Payouts balance, see{" "}
            <a href="/superadmin/cashfree-payouts" className="text-primary underline">
              Cashfree Payouts
            </a>
            .
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Total Payments Received" value={ledger?.totalPaymentsReceived ?? 0} tone="success" />
          <Metric label="GRABIT Commission" value={ledger?.grabitCommission ?? 0} />
          <Metric label="Vendor Payout Liability" value={ledger?.vendorPayoutLiability ?? 0} tone="danger" />
          <Metric label="Vendor Payouts (30d)" value={ledger?.vendorPayouts ?? 0} />
          <Metric label="Refunds (30d)" value={ledger?.refunds ?? 0} tone="danger" />
          <Metric label="Adjustments (30d)" value={ledger?.adjustments ?? 0} />
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="text-label font-bold uppercase text-muted">Ledger Balance</p>
          {isLoading ? (
            <div className="mt-2 h-9 w-40 animate-pulse rounded-lg bg-surface" />
          ) : (
            <p className="mt-1 font-display text-heading-lg font-900 text-foreground">₹{(ledger?.ledgerBalance ?? 0).toLocaleString()}</p>
          )}
          <p className="mt-1 text-caption text-muted">Received − Refunded − Vendor Payouts + Adjustments (accounting figure, not a bank balance).</p>
          <button
            type="button"
            onClick={() => setShowAddFunds(true)}
            className="mt-4 rounded-xl bg-primary px-4 py-2.5 font-display text-caption font-bold text-on-primary"
          >
            Record Adjustment (via Cashfree PG)
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Adjustment History</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
            <table className="w-full text-left text-body">
              <thead>
                <tr className="border-b border-border text-label font-bold text-muted uppercase">
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted">No adjustments recorded yet.</td>
                  </tr>
                )}
                {adjustments.map((row) => (
                  <tr key={row.id} className="hover:bg-surface/50">
                    <td className="p-3">{row.transaction_type}</td>
                    <td className={`p-3 text-right font-mono ${row.direction === "CREDIT" ? "text-success" : "text-danger"}`}>
                      {row.direction === "CREDIT" ? "+" : "−"}₹{row.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusBadge(row.status)}`}>{row.status}</span>
                    </td>
                    <td className="p-3 font-mono text-caption text-muted">{row.cashfree_order_id ?? "—"}</td>
                    <td className="p-3 text-caption text-muted">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <WalletTopupsSection />
      </div>

      {showAddFunds && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-5">
            <h3 className="font-display text-body font-800 text-foreground">Record Adjustment</h3>
            <p className="mt-1 text-caption text-muted">
              Pays via Cashfree PG and records a verified credit to the GRABIT Financial Ledger. This does NOT fund Cashfree Payouts.
            </p>
            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Amount (₹)</label>
              <input
                type="number"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
              {error && <p className="mt-2 text-caption text-destructive">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFunds(false);
                    setError(null);
                  }}
                  className="flex-1 rounded-xl border border-border-subtle py-2.5 font-display text-caption font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAddAdjustment}
                  className="flex-1 rounded-xl bg-primary py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                >
                  {isSubmitting ? "Opening…" : "Pay & Record"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
