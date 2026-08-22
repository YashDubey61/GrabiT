"use client";

import { useEffect, useState } from "react";
import type {
  WorkflowRule,
  WorkflowTelemetrySummary,
} from "@/lib/workflows/workflow_engine";
import { trackProductEvent } from "@/lib/analytics/events";

export default function SuperAdminWorkflowsPage() {
  const [telemetry, setTelemetry] = useState<WorkflowTelemetrySummary | null>(null);
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/superadmin/workflows");
      if (res.ok) {
        const json: WorkflowTelemetrySummary = await res.json();
        setTelemetry(json);

        trackProductEvent({
          eventName: "workflow_executed",
          metadata: { totalRules: json.totalRules, successRate: json.successRatePercent },
        });
      }
    } catch (err) {
      console.error("Failed to load workflow telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkflows();
  }, []);

  const handleToggleRule = async (rule: WorkflowRule) => {
    if (actioningId) return; // double-click lock
    setActioningId(rule.id);
    try {
      const res = await fetch(`/api/superadmin/workflows/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ENABLED", enabled: !rule.enabled }),
      });

      if (res.ok) {
        const json = await res.json();
        showNotification(`Workflow rule "${rule.name}" ${json.enabled ? "enabled" : "disabled"}.`);
        fetchWorkflows();

        trackProductEvent({
          eventName: "workflow_rule_toggled",
          metadata: { ruleId: rule.id, enabled: json.enabled },
        });
      }
    } catch (err) {
      console.error("Failed to toggle workflow rule:", err);
    } finally {
      setActioningId(null);
    }
  };

  const handleRunNow = async (rule: WorkflowRule) => {
    if (actioningId) return; // double-click lock
    setActioningId(rule.id);
    try {
      const res = await fetch(`/api/superadmin/workflows/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_NOW" }),
      });

      if (res.ok) {
        showNotification(`Manual execution for "${rule.name}" completed.`);
        fetchWorkflows();

        trackProductEvent({
          eventName: "workflow_manual_run",
          metadata: { ruleId: rule.id },
        });
      }
    } catch (err) {
      console.error("Failed to trigger manual execution:", err);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 pb-24">
      {notification && (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-center text-body-sm font-semibold text-primary animate-fade-in">
          {notification}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase mb-1">
            <span className="material-symbols-outlined text-sm">account_tree</span>
            Automated Operations Engine
          </div>
          <h1 className="font-display text-title font-bold text-foreground sm:text-[28px]">
            Workflow Rules &amp; Scheduled Jobs
          </h1>
          <p className="text-body-sm text-faint">
            Convert operational conditions into controlled, auditable, and idempotent automated actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {telemetry && (
            <>
              <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                telemetry.healthStatus === "HEALTHY"
                  ? "bg-success-soft/80 text-success border-success/60"
                  : telemetry.healthStatus === "DEGRADED"
                  ? "bg-warning-soft/80 text-warning border-warning/60"
                  : "bg-danger-soft/80 text-danger border-danger/60"
              }`}>
                <span className="text-sm">●</span>
                {telemetry.healthStatus}
              </span>

              <span className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                telemetry.stalenessStatus === "FRESH"
                  ? "bg-info/20 text-info border-info/60"
                  : telemetry.stalenessStatus === "STALE"
                  ? "bg-warning-soft/80 text-warning border-warning/60"
                  : "bg-surface-elevated text-faint border-border"
              }`}>
                <span className="text-sm">●</span>
                CRON {telemetry.stalenessStatus}
              </span>
            </>
          )}

          <button
            onClick={fetchWorkflows}
            className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 w-fit"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh Telemetry
          </button>
        </div>
      </div>

      {isLoading || !telemetry ? (
        <div className="py-16 text-center text-muted space-y-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          <p className="text-xs">Loading workflow telemetry...</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
              <div className="text-xs font-medium text-muted">Total Active Rules</div>
              <div className="text-2xl font-bold text-white font-mono">{telemetry.enabledRules} / {telemetry.totalRules}</div>
              <div className="text-[11px] text-success">Configured operational rules</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
              <div className="text-xs font-medium text-muted">Total Executions</div>
              <div className="text-2xl font-bold text-primary font-mono">{telemetry.totalExecutions}</div>
              <div className="text-[11px] text-muted">Idempotent runs logged</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
              <div className="text-xs font-medium text-muted">Success Rate</div>
              <div className="text-2xl font-bold text-success font-mono">{telemetry.successRatePercent}%</div>
              <div className="text-[11px] text-success">Clean execution passes</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-1">
              <div className="text-xs font-medium text-muted">Failed Executions</div>
              <div className="text-2xl font-bold text-info font-mono">{telemetry.failedExecutions}</div>
              <div className="text-[11px] text-muted">Isolated handled errors</div>
            </div>
          </div>

          {/* Workflow Rules Table */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">settings_suggest</span>
                  Configured Workflow Rules
                </h2>
                <p className="text-xs text-muted">Rule triggers, cadences, action types, and status controls.</p>
              </div>
              <span className="text-xs font-mono text-muted">{telemetry.rules.length} Rules Engine Active</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted">
                <thead className="bg-black/40 text-muted uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Rule Name</th>
                    <th className="py-2.5 px-3">Cadence</th>
                    <th className="py-2.5 px-3">Event Trigger</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3 text-center">Severity</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {telemetry.rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        <button
                          onClick={() => setSelectedRule(rule)}
                          className="hover:text-primary transition-colors text-left"
                        >
                          {rule.name}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full border ${
                          rule.cadence === "HIGH"
                            ? "bg-info/15 text-info border-info/40"
                            : rule.cadence === "MEDIUM"
                            ? "bg-info/15 text-info border-info/40"
                            : "bg-surface-elevated text-muted border-border"
                        }`}>
                          {rule.cadence}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted font-mono text-[11px]">{rule.eventType}</td>
                      <td className="py-3 px-3 text-info font-mono text-[11px]">{rule.actionType}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                          rule.severity === "CRITICAL"
                            ? "bg-danger-soft/80 text-danger border-danger/60"
                            : rule.severity === "WARNING"
                            ? "bg-warning-soft/80 text-warning border-warning/60"
                            : "bg-info/20 text-info border-info/60"
                        }`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          disabled={actioningId === rule.id}
                          className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all ${
                            rule.enabled
                              ? "bg-success-soft/60 text-success border-success/40 hover:bg-success-soft/60"
                              : "bg-surface-elevated text-faint border-border hover:text-muted"
                          } ${actioningId === rule.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {actioningId === rule.id ? "SAVING..." : rule.enabled ? "ENABLED" : "DISABLED"}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleRunNow(rule)}
                          disabled={actioningId === rule.id}
                          className={`px-2.5 py-1 rounded-lg bg-primary/20 text-primary border border-primary/30 font-semibold hover:bg-primary/30 transition-all text-[11px] ${
                            actioningId === rule.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {actioningId === rule.id ? "Running..." : "Run Now"}
                        </button>
                        <button
                          onClick={() => setSelectedRule(rule)}
                          className="px-2.5 py-1 rounded-lg bg-black/40 border border-border text-muted hover:text-white transition-all text-[11px]"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Executions Audit Log */}
          <div className="p-6 rounded-2xl bg-surface-elevated border border-border space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-success">receipt_long</span>
              Executions Audit Log
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted">
                <thead className="bg-black/40 text-muted uppercase text-[10px] tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Execution Key</th>
                    <th className="py-2.5 px-3">Rule ID</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Duration (ms)</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {telemetry.recentExecutions.map((exec) => (
                    <tr key={exec.id} className="hover:bg-white/5 transition-colors font-mono text-[11px]">
                      <td className="py-2.5 px-3 text-white font-semibold">{exec.executionKey}</td>
                      <td className="py-2.5 px-3 text-muted">{exec.workflowRuleId}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          exec.status === "SUCCESS"
                            ? "bg-success-soft/60 text-success border-success/40"
                            : exec.status === "SKIPPED"
                            ? "bg-info/15 text-info border-info/40"
                            : "bg-danger-soft/60 text-danger border-danger/40"
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted">{exec.durationMs ?? 0} ms</td>
                      <td className="py-2.5 px-3 text-right text-muted">
                        {new Date(exec.triggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Workflow Rule Detail Modal */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 text-foreground">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Workflow Rule Specification</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedRule.name}</h3>
                <p className="text-xs text-muted">{selectedRule.description}</p>
              </div>
              <button
                onClick={() => setSelectedRule(null)}
                className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-muted font-semibold">Event Trigger &amp; Cadence</div>
                <div className="text-white font-mono">Trigger: {selectedRule.eventType}</div>
                <div className="text-info font-mono">Cadence: {selectedRule.cadence}</div>
                <div className="text-info font-mono">Action: {selectedRule.actionType}</div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-muted font-semibold">Condition Config (JSON)</div>
                <pre className="text-[11px] font-mono text-success overflow-x-auto p-2 bg-black rounded">
                  {JSON.stringify(selectedRule.conditionConfig, null, 2)}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-border space-y-1">
                <div className="text-muted font-semibold">Action Config (JSON)</div>
                <pre className="text-[11px] font-mono text-warning overflow-x-auto p-2 bg-black rounded">
                  {JSON.stringify(selectedRule.actionConfig, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
