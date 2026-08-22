"use client";

import { useCallback, useEffect, useState } from "react";

interface PayoutsStatus {
  configured: boolean;
  connectionStatus: "NOT_CONFIGURED" | "CONNECTED" | "ERROR";
  availableBalance?: number;
  fundSource?: string | null;
  syncedAt?: string;
  error?: string;
}

export default function CashfreePayoutsPage() {
  const [status, setStatus] = useState<PayoutsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/cashfree-payouts");
      const data = await res.json();
      if (data.ok) setStatus(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">Cashfree Payouts</h1>
          <p className="mt-1 text-body-sm text-muted">
            The actual Cashfree Payouts infrastructure used to send money to vendors. This is a real, external account balance — never the GRABIT Financial Ledger.
          </p>
        </div>

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-surface-elevated" />
        ) : status?.connectionStatus === "NOT_CONFIGURED" ? (
          <section className="rounded-2xl border border-warning/40 bg-warning/5 p-6">
            <p className="font-display text-body font-800 text-warning">Cashfree Payouts: NOT CONFIGURED</p>
            <p className="mt-2 text-caption text-muted">
              No CASHFREE_PAYOUTS_CLIENT_ID / CASHFREE_PAYOUTS_CLIENT_SECRET are set on the server. No balance is shown because none can be
              honestly reported — this is not a ₹0 balance, it is an unconnected account. Vendor payouts via Cashfree cannot be initiated until
              this is configured. The manual settlement flow (Telegram + bank transfer reference) continues to work normally.
            </p>
          </section>
        ) : status?.connectionStatus === "ERROR" ? (
          <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
            <p className="font-display text-body font-800 text-destructive">Cashfree Payouts: CONNECTION ERROR</p>
            <p className="mt-2 text-caption text-muted">{status.error}</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
              <p className="text-label font-bold uppercase text-muted">API Connection Status</p>
              <p className="mt-1 font-display text-body font-800 text-success">CONNECTED</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <p className="text-label font-bold uppercase text-muted">Available Payout Balance</p>
              <p className="mt-1 font-display text-heading-sm font-900 text-foreground">₹{(status?.availableBalance ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <p className="text-label font-bold uppercase text-muted">Fund Source</p>
              <p className="mt-1 font-display text-body font-800 text-foreground">{status?.fundSource ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-elevated p-6">
              <p className="text-label font-bold uppercase text-muted">Last Synchronized</p>
              <p className="mt-1 font-display text-body font-800 text-foreground">{status?.syncedAt ? new Date(status.syncedAt).toLocaleString() : "—"}</p>
            </div>
          </section>
        )}

        <button type="button" onClick={load} className="rounded-xl border border-border-subtle px-4 py-2 font-display text-caption font-bold text-muted hover:text-foreground">
          Refresh Status
        </button>
      </div>
    </main>
  );
}
