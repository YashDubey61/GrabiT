"use client";

import { useCallback, useEffect, useState } from "react";

interface PaymentRow {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
}

function statusTone(status: string) {
  if (status === "success") return "border-success/30 bg-success/5 text-success";
  if (status === "failed") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (status === "refunded") return "border-warning/30 bg-warning/5 text-warning";
  return "border-border bg-surface text-muted";
}

export default function CashfreePaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState({ success: 0, pending: 0, failed: 0, refunded: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/cashfree-payments");
      const data = await res.json();
      if (data.ok) {
        setRows(data.recent);
        setSummary(data.summary);
      }
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
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">Cashfree Payments</h1>
          <p className="mt-1 text-body-sm text-muted">Customer payment gateway activity — money collected from students via Cashfree PG.</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
            <p className="text-label font-bold uppercase text-muted">Success</p>
            <p className="mt-1 font-display text-heading-sm font-900 text-success">{summary.success}</p>
          </div>
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
            <p className="text-label font-bold uppercase text-muted">Pending</p>
            <p className="mt-1 font-display text-heading-sm font-900 text-warning">{summary.pending}</p>
          </div>
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
            <p className="text-label font-bold uppercase text-muted">Failed</p>
            <p className="mt-1 font-display text-heading-sm font-900 text-destructive">{summary.failed}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-5">
            <p className="text-label font-bold uppercase text-muted">Refunded</p>
            <p className="mt-1 font-display text-heading-sm font-900 text-foreground">{summary.refunded}</p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
          <table className="w-full text-left text-body">
            <thead>
              <tr className="border-b border-border text-label font-bold text-muted uppercase">
                <th className="p-3">Cashfree Order</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-semibold">
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted">No Cashfree payments yet.</td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50">
                  <td className="p-3 font-mono text-caption text-muted">{r.cashfree_order_id ?? "—"}</td>
                  <td className="p-3 text-right font-mono">₹{Number(r.amount).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${statusTone(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-caption text-muted">{r.paid_at ? new Date(r.paid_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
