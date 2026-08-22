"use client";

import { useEffect, useState, useCallback } from "react";
import type { RewardsAnalyticsResponse, RewardsAnalyticsRange } from "@/lib/rewards/analytics-types";

const RANGE_LABELS: Record<RewardsAnalyticsRange, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  month: "This Month",
  year: "This Year",
};
const RANGES: RewardsAnalyticsRange[] = ["today", "7d", "30d", "90d", "month", "year"];

function fmtNum(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}
function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(1)}%`;
}
function fmtPts(n: number | null | undefined) {
  return `${fmtNum(n)} pts`;
}

function marginConsumedPercent(data: RewardsAnalyticsResponse): number | null {
  const { rewardCostGrabit, avgContributionProfitPerOrder, ordersCount } = data.kpis;
  const totalContribution = avgContributionProfitPerOrder * ordersCount;
  if (totalContribution <= 0) return null;
  return (rewardCostGrabit / totalContribution) * 100;
}

function marginBand(pct: number | null, thresholds: { watch: number; high: number; critical: number }) {
  if (pct === null) return { label: "Unknown", tone: "muted" as const };
  if (pct > thresholds.critical) return { label: "Critical", tone: "critical" as const };
  if (pct > thresholds.high) return { label: "High", tone: "high" as const };
  if (pct > thresholds.watch) return { label: "Watch", tone: "watch" as const };
  return { label: "Healthy", tone: "healthy" as const };
}

function toneClasses(tone: "healthy" | "watch" | "high" | "critical" | "muted") {
  switch (tone) {
    case "critical":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "high":
      return "border-warning/40 bg-warning/10 text-warning";
    case "watch":
      return "border-warning/30 bg-warning/5 text-warning";
    case "healthy":
      return "border-success/30 bg-success/5 text-success";
    default:
      return "border-border bg-surface-elevated text-muted";
  }
}

function KpiCard({
  label,
  value,
  sub,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  tooltip?: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-surface-elevated p-5">
      <p className="flex items-center gap-1 text-label font-bold uppercase text-muted">
        {label}
        {tooltip && (
          <span className="material-symbols-outlined cursor-help text-[14px] text-faint" title={tooltip}>
            info
          </span>
        )}
      </p>
      <p className="mt-1 font-display text-heading-lg font-900 text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-caption text-muted">{sub}</p>}
    </div>
  );
}

function SimpleBarRow({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-caption text-muted">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-sunken">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right font-mono text-caption font-bold text-foreground">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

interface SettlementRow {
  id: string;
  studentName: string;
  rewardName: string;
  vendorName: string;
  code: string;
  maskedCode: string;
  orderNumber: string | null;
  pointsSpent: number;
  fundingType: string;
  grabitCost: number;
  vendorCost: number;
  codeStatus: string;
  redeemedAt: string | null;
  settlementStatus: "PENDING" | "SETTLED" | null;
  settlementAmount: number | null;
  settlementReference: string | null;
  settledAt: string | null;
}

function SettlementSection() {
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settling, setSettling] = useState<SettlementRow | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/rewards-settlements");
      const data = await res.json();
      if (data.ok) setRows(data.redemptions);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const openSettle = (row: SettlementRow) => {
    setSettling(row);
    setAmount(String(row.fundingType === "VENDOR" ? row.vendorCost : row.grabitCost));
    setReference("");
    setNotes("");
    setSubmitError(null);
  };

  const submitSettle = async () => {
    if (!settling) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/superadmin/rewards-settlements/${settling.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementAmount: Number(amount), reference, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? "Couldn't record settlement.");
        return;
      }
      setSettling(null);
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-display text-heading-sm font-800 text-foreground">Reward Redemptions / Settlement</h2>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
        <table className="w-full text-left text-body">
          <thead>
            <tr className="border-b border-border text-label font-bold text-muted uppercase">
              <th className="p-3">Student</th>
              <th className="p-3">Reward</th>
              <th className="p-3">Vendor</th>
              <th className="p-3">Code</th>
              <th className="p-3">Order</th>
              <th className="p-3 text-right">Points</th>
              <th className="p-3 text-right">Reward Value</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Settlement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-semibold">
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-muted">No fulfilled redemptions yet.</td>
              </tr>
            )}
            {rows.map((r) => {
              const settlementAmt = r.fundingType === "VENDOR" ? r.vendorCost : r.grabitCost;
              return (
                <tr key={r.id} className="hover:bg-surface/50">
                  <td className="p-3 text-caption">{r.studentName}</td>
                  <td className="p-3">{r.rewardName}</td>
                  <td className="p-3 text-caption text-muted">{r.vendorName}</td>
                  <td className="p-3 font-mono text-caption" title={r.code ?? undefined}>{r.code ?? r.maskedCode}</td>
                  <td className="p-3 font-mono text-caption text-muted">{r.orderNumber ?? "—"}</td>
                  <td className="p-3 text-right font-mono">{r.pointsSpent}</td>
                  <td className="p-3 text-right font-mono">₹{settlementAmt.toLocaleString()}</td>
                  <td className="p-3 text-caption">{r.codeStatus === "USED" ? "Used" : r.codeStatus}</td>
                  <td className="p-3 text-caption text-muted">
                    {r.redeemedAt ? new Date(r.redeemedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="p-3">
                    {r.settlementStatus === "SETTLED" ? (
                      <span className="rounded-full border border-success/30 bg-success/5 px-2 py-0.5 text-[10px] font-extrabold uppercase text-success">
                        Paid
                      </span>
                    ) : r.codeStatus === "USED" ? (
                      <button
                        type="button"
                        onClick={() => openSettle(r)}
                        className="rounded-lg border border-primary/40 px-2 py-1 text-[11px] font-bold text-primary"
                      >
                        Mark Payment Completed
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {settling && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-5">
            <h3 className="font-display text-body font-800 text-foreground">{settling.rewardName}</h3>
            <p className="mt-1 text-caption text-muted">{settling.vendorName} · {settling.maskedCode}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Settlement Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Payment Reference (optional)</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-muted">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {submitError && <p className="text-caption text-destructive">{submitError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettling(null)}
                  className="flex-1 rounded-xl border border-border-subtle py-2.5 font-display text-caption font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitSettle}
                  className="flex-1 rounded-xl bg-primary py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                >
                  {isSubmitting ? "Saving…" : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function RewardsAnalyticsPage() {
  const [range, setRange] = useState<RewardsAnalyticsRange>("30d");
  const [canteenId, setCanteenId] = useState<string>("");
  const [data, setData] = useState<RewardsAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ range });
      if (canteenId) params.set("canteenId", canteenId);
      const res = await fetch(`/api/superadmin/rewards-analytics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Failed to load analytics.");
        setData(null);
        return;
      }
      setData(json.data);
    } catch {
      setError("Network error loading analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [range, canteenId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows: (string | number)[][] = [
      ["Rewards Cost & ROI Analytics", `${data.rangeStart} to ${data.rangeEnd}`],
      [],
      ["KPI", "Value"],
      ["Orders", data.kpis.ordersCount],
      ["Points Issued", data.kpis.pointsIssued],
      ["Points Redeemed", data.kpis.pointsRedeemed],
      ["Outstanding Points", data.kpis.outstandingPoints],
      ["Reward Cost (GRABIT)", data.kpis.rewardCostGrabit],
      ["Reward Cost (Vendor)", data.kpis.rewardCostVendor],
      ["Reward-Driven Repeat Orders", data.kpis.repeatOrdersWithReward],
      ["Estimated Reward ROI %", data.kpis.estimatedRoiPercent ?? ""],
      [],
      ["Reward", "Funding Type", "Redemptions", "Points Used", "GRABIT Cost", "Vendor Cost"],
      ...data.costBreakdown.map((r) => [r.reward_name, r.funding_type, r.redemptions, r.points_used, r.grabit_cost, r.vendor_cost]),
    ];
    downloadCsv(rows, `rewards-analytics-${range}.csv`);
  };

  if (isLoading && !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-8 text-muted">
        <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
        <span className="ml-2">Loading rewards analytics…</span>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-8">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          {error ?? "No data available."}
        </div>
      </main>
    );
  }

  const marginPct = marginConsumedPercent(data);
  const band = marginBand(marginPct, data.marginThresholds);
  const maxTimeseries = Math.max(1, ...data.timeseries.map((t) => Math.max(t.points_issued, t.points_redeemed)));

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header + filters */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">
              Rewards Cost &amp; ROI Analytics
            </h1>
            <p className="mt-1 text-body-sm text-muted">
              Are we spending ₹1 in rewards to generate more than ₹1 of incremental contribution?
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={canteenId}
              onChange={(e) => setCanteenId(e.target.value)}
              className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-label font-bold text-foreground"
            >
              <option value="">All Vendors</option>
              {data.canteens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1 rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-label font-bold text-foreground hover:border-primary"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap rounded-xl bg-surface-elevated p-1 text-label font-bold border border-border">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                range === r ? "bg-primary text-background shadow" : "text-muted hover:text-foreground"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* Low-margin warning */}
        {marginPct !== null && band.tone !== "healthy" && (
          <div className={`rounded-2xl border p-4 ${toneClasses(band.tone)}`}>
            <p className="font-display text-body font-800">
              {band.label} margin consumption: rewards are consuming {fmtPct(marginPct)} of contribution profit in this period.
            </p>
          </div>
        )}

        {/* Executive KPIs */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Executive KPIs</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Orders" value={fmtNum(data.kpis.ordersCount)} />
            <KpiCard label="Points Issued" value={fmtPts(data.kpis.pointsIssued)} tooltip="EARN transactions only — transfers and gift bonuses excluded to avoid double-counting." />
            <KpiCard label="Points Redeemed" value={fmtPts(data.kpis.pointsRedeemed)} />
            <KpiCard label="Outstanding Points" value={fmtPts(data.kpis.outstandingPoints)} tooltip="Current real ledger balance across all students — not issued minus redeemed for this period." />
            <KpiCard label="Reward Cost (GRABIT)" value={`₹${fmtNum(data.kpis.rewardCostGrabit)}`} tooltip="Actual redeemed-reward cost for GRABIT-funded and shared-funded redemptions." />
            <KpiCard label="Reward Cost (Vendor)" value={`₹${fmtNum(data.kpis.rewardCostVendor)}`} />
            <KpiCard
              label="Reward-Driven Repeat Orders"
              value={fmtNum(data.kpis.repeatOrdersWithReward)}
              sub={`of ${fmtNum(data.kpis.repeatOrdersWithReward + data.kpis.repeatOrdersWithoutReward)} eligible orders`}
              tooltip={`Attribution model: a completed order counts as reward-driven if the student had a reward interaction (redemption or gift receipt) within ${data.kpis.attributionWindowDays} days before that order. This does not prove causation.`}
            />
            <KpiCard
              label="Reward ROI"
              value={data.kpis.estimatedRoiPercent === null ? "N/A" : fmtPct(data.kpis.estimatedRoiPercent)}
              sub="Estimated Reward ROI"
              tooltip="Formula: (Incremental Contribution − GRABIT Reward Cost) / GRABIT Reward Cost. Contribution is derived from vendor commission rate, not verified true profit — labeled Estimated, not actual profit ROI."
            />
          </div>
        </section>

        {/* Redemption Code Lifecycle */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Redemption Code Lifecycle</h2>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Generated" value={fmtNum(data.lifecycle.generated)} tooltip="Codes issued to students." />
            <KpiCard label="Used" value={fmtNum(data.lifecycle.used)} tooltip="Codes a vendor confirmed as fulfilled." />
            <KpiCard label="Settlement Pending" value={fmtNum(data.lifecycle.settlementPending)} />
            <KpiCard label="Settled" value={fmtNum(data.lifecycle.settled)} />
            <KpiCard label="Expired" value={fmtNum(data.lifecycle.expired)} />
            <KpiCard label="Settled Amount" value={`₹${fmtNum(data.lifecycle.settledAmount)}`} />
          </div>
        </section>

        {/* Points Economy */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Points Economy</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Earned" value={fmtPts(data.kpis.pointsIssued)} />
            <KpiCard label="Transferred" value={fmtPts(data.kpis.pointsTransferred)} tooltip="Sent between students — not newly issued points." />
            <KpiCard label="Received" value={fmtPts(data.kpis.pointsReceived)} />
            <KpiCard label="Redeemed" value={fmtPts(data.kpis.pointsRedeemed)} />
            <KpiCard label="Gift Bonus Issued" value={fmtPts(data.kpis.giftBonusPoints)} />
            <KpiCard
              label="Avg / Order"
              value={data.kpis.ordersCount > 0 ? fmtPts(Math.round(data.kpis.pointsIssued / data.kpis.ordersCount)) : "—"}
            />
            <KpiCard
              label="Redemption Rate"
              value={data.kpis.pointsIssued > 0 ? fmtPct((data.kpis.pointsRedeemed / data.kpis.pointsIssued) * 100) : "—"}
            />
            <KpiCard label="Outstanding" value={fmtPts(data.kpis.outstandingPoints)} />
          </div>
        </section>

        {/* Time series */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Points Issued vs Redeemed (Daily)</h2>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            {data.timeseries.length === 0 ? (
              <p className="text-caption text-muted">No activity in this period.</p>
            ) : (
              <div className="space-y-2">
                {data.timeseries.map((t) => (
                  <div key={t.day} className="grid grid-cols-[80px_1fr_1fr] items-center gap-3">
                    <span className="text-[11px] text-muted">{t.day}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-sunken">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (t.points_issued / maxTimeseries) * 100)}%` }} />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-sunken">
                      <div className="h-full rounded-full bg-warning" style={{ width: `${Math.max(2, (t.points_redeemed / maxTimeseries) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 pt-2 text-[11px] text-muted">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Issued</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Redeemed</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Reward Cost Breakdown */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Reward Cost Breakdown</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
            <table className="w-full text-left text-body">
              <thead>
                <tr className="border-b border-border text-label font-bold text-muted uppercase">
                  <th className="p-3">Reward</th>
                  <th className="p-3">Funding</th>
                  <th className="p-3 text-right">Redemptions</th>
                  <th className="p-3 text-right">Points Used</th>
                  <th className="p-3 text-right">GRABIT Cost</th>
                  <th className="p-3 text-right">Vendor Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {data.costBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted">No redemptions in this period.</td>
                  </tr>
                )}
                {data.costBreakdown.map((r) => (
                  <tr key={r.reward_id} className="hover:bg-surface/50">
                    <td className="p-3">{r.reward_name}</td>
                    <td className="p-3 text-caption text-muted">{r.funding_type}</td>
                    <td className="p-3 text-right font-mono">{r.redemptions}</td>
                    <td className="p-3 text-right font-mono">{r.points_used.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">₹{r.grabit_cost.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">₹{r.vendor_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <SettlementSection />

        {/* Engagement Funnel */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Reward Engagement Funnel</h2>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <SimpleBarRow label="Earned" value={data.kpis.usersEarned} max={Math.max(1, data.kpis.usersEarned)} colorClass="bg-primary" />
            <div className="h-2" />
            <SimpleBarRow label="Viewed" value={data.kpis.usersViewed} max={Math.max(1, data.kpis.usersEarned)} colorClass="bg-primary/70" />
            <div className="h-2" />
            <SimpleBarRow label="Redeemed" value={data.kpis.usersRedeemed} max={Math.max(1, data.kpis.usersEarned)} colorClass="bg-warning" />
            <div className="h-2" />
            <SimpleBarRow label="Repeat" value={data.kpis.repeatPurchasers} max={Math.max(1, data.kpis.usersEarned)} colorClass="bg-success" />
          </div>
        </section>

        {/* Gifting & Social Impact */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Gifting &amp; Social Impact</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Points Sent" value={fmtPts(data.gifting.pointsSent)} />
            <KpiCard label="Senders / Recipients" value={`${data.gifting.senders} / ${data.gifting.recipients}`} />
            <KpiCard label="Food Gifts" value={fmtNum(data.gifting.foodGifts)} />
            <KpiCard label="Reward Gifts" value={fmtNum(data.gifting.rewardGifts)} />
            <KpiCard label="Gift Bonus Points" value={fmtPts(data.gifting.giftBonusPoints)} />
            <KpiCard
              label="Gift → Order Conversion"
              value={
                data.gifting.foodGifts + data.gifting.rewardGifts > 0
                  ? fmtPct((data.gifting.recipientsWhoOrdered / (data.gifting.foodGifts + data.gifting.rewardGifts)) * 100)
                  : "—"
              }
              tooltip={`Recipients who placed a completed order within ${data.gifting.attributionWindowDays} days of receiving a gift.`}
            />
          </div>
        </section>

        {/* Vendor Performance */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Vendor Performance</h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
            <table className="w-full text-left text-body">
              <thead>
                <tr className="border-b border-border text-label font-bold text-muted uppercase">
                  <th className="p-3">Vendor</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Points Issued</th>
                  <th className="p-3 text-right">Redemptions</th>
                  <th className="p-3 text-right">GRABIT Cost</th>
                  <th className="p-3 text-right">Vendor Cost</th>
                  <th className="p-3 text-right">Repeat Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {data.vendorPerformance.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted">No vendor activity in this period.</td>
                  </tr>
                )}
                {data.vendorPerformance.map((v) => (
                  <tr key={v.canteen_id} className="hover:bg-surface/50">
                    <td className="p-3">{v.canteen_name}</td>
                    <td className="p-3 text-right font-mono">{v.orders}</td>
                    <td className="p-3 text-right font-mono">{v.points_issued.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{v.redemptions}</td>
                    <td className="p-3 text-right font-mono">₹{v.grabit_cost.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">₹{v.vendor_cost.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{v.repeat_orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Points Liability */}
        <section className="space-y-3">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Points Liability</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Outstanding Points" value={fmtPts(data.liability.outstandingPoints)} />
            <KpiCard label="Gifted / Unredeemed (Est.)" value={fmtPts(data.liability.giftedUnredeemedEstimate)} tooltip="Estimated — no separate gifted-vs-earned sub-ledger exists." />
            <KpiCard label="Leaderboard Reward Cost" value={`₹${fmtNum(data.leaderboardEconomics.top10RewardCost)}`} />
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-6">
            <p className="mb-3 text-label font-bold uppercase text-muted">Unredeemed Points Aging</p>
            <div className="space-y-2">
              <SimpleBarRow label="0–7d" value={data.liability.aging.days0to7} max={Math.max(1, data.liability.aging.days0to7, data.liability.aging.days8to30, data.liability.aging.days31to90, data.liability.aging.days90plus)} colorClass="bg-success" />
              <SimpleBarRow label="8–30d" value={data.liability.aging.days8to30} max={Math.max(1, data.liability.aging.days0to7, data.liability.aging.days8to30, data.liability.aging.days31to90, data.liability.aging.days90plus)} colorClass="bg-primary" />
              <SimpleBarRow label="31–90d" value={data.liability.aging.days31to90} max={Math.max(1, data.liability.aging.days0to7, data.liability.aging.days8to30, data.liability.aging.days31to90, data.liability.aging.days90plus)} colorClass="bg-warning" />
              <SimpleBarRow label="90d+" value={data.liability.aging.days90plus} max={Math.max(1, data.liability.aging.days0to7, data.liability.aging.days8to30, data.liability.aging.days31to90, data.liability.aging.days90plus)} colorClass="bg-destructive" />
            </div>
          </div>
        </section>

        {/* Leaderboard Economics */}
        <section className="space-y-3 pb-8">
          <h2 className="font-display text-heading-sm font-800 text-foreground">Leaderboard Economics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Top 10 Points Earned" value={fmtPts(data.leaderboardEconomics.top10Points)} tooltip="EARN-only, excludes transfers." />
            <KpiCard label="Top 10 Avg Orders" value={data.leaderboardEconomics.top10AvgOrders.toFixed(1)} />
            <KpiCard label="Top 10 Repeat Rate" value={fmtPct(data.leaderboardEconomics.top10RepeatRate)} />
            <KpiCard label="Rest Avg Orders" value={data.leaderboardEconomics.restAvgOrders.toFixed(1)} />
          </div>
        </section>
      </div>
    </main>
  );
}
