import { createOperationalNotification, autoResolveOperationalNotification } from "@/lib/notifications/operational_notifications";
import { createStudentNotification } from "@/lib/notifications/student_notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type WorkflowActionType =
  | "CREATE_NOTIFICATION"
  | "ESCALATE_ALERT"
  | "AUTO_RESOLVE_ALERT"
  | "CREATE_OPERATIONAL_TASK"
  | "UPDATE_WORKFLOW_STATUS";

export type WorkflowCadence = "HIGH" | "MEDIUM" | "DAILY";
export type WorkflowHealthStatus = "HEALTHY" | "DEGRADED" | "CRITICAL";

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  cadence: WorkflowCadence;
  conditionConfig: Record<string, unknown>;
  actionType: WorkflowActionType;
  actionConfig: Record<string, unknown>;
  severity: "INFO" | "WARNING" | "CRITICAL";
  enabled: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowRuleId: string;
  executionKey: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  triggeredAt: string;
  completedAt?: string | null;
  durationMs?: number;
  errorMessage?: string | null;
  retryable?: boolean;
  resultSummary?: Record<string, unknown> | null;
  createdAt: string;
}

export interface WorkflowTelemetrySummary {
  totalRules: number;
  enabledRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRatePercent: number;
  healthStatus: WorkflowHealthStatus;
  lastRunTime?: string | null;
  isStale: boolean;
  stalenessStatus: "FRESH" | "STALE" | "NEVER_RUN";
  rules: WorkflowRule[];
  recentExecutions: WorkflowExecution[];
}

const SEED_WORKFLOW_RULES: WorkflowRule[] = [
  {
    id: "wr_1",
    name: "Order Aging & SLA Escalation",
    description: "Detects orders placed over 5 minutes ago and escalates to Super Admin if unaccepted for 30 minutes.",
    eventType: "ORDER_AGING_CHECK",
    cadence: "HIGH",
    conditionConfig: { thresholdMinutes: 5, escalationMinutes: 30 },
    actionType: "ESCALATE_ALERT",
    actionConfig: { targetRole: "admin", alertSeverity: "CRITICAL" },
    severity: "CRITICAL",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_2",
    name: "Vendor SLA Breach Warning",
    description: "Monitors vendor preparation SLA compliance and triggers performance warnings if SLA falls below 90%.",
    eventType: "VENDOR_SLA_CHECK",
    cadence: "HIGH",
    conditionConfig: { minSlaPercent: 90.0, sampleSize: 10 },
    actionType: "CREATE_NOTIFICATION",
    actionConfig: { targetRole: "vendor", notifCategory: "PERFORMANCE" },
    severity: "WARNING",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_3",
    name: "High Kitchen Backlog Alert",
    description: "Triggers a critical vendor alert when pending order backlog exceeds 10 orders in kitchen queue.",
    eventType: "KITCHEN_BACKLOG_CHECK",
    cadence: "HIGH",
    conditionConfig: { maxPendingBacklog: 10 },
    actionType: "ESCALATE_ALERT",
    actionConfig: { targetRole: "vendor", alertSeverity: "CRITICAL" },
    severity: "CRITICAL",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_4",
    name: "Popular Dish Stock-Out Prompt",
    description: "Detects when top-selling menu items are marked unavailable and prompts vendor to restock.",
    eventType: "MENU_STOCK_CHECK",
    cadence: "MEDIUM",
    conditionConfig: { minHistoricalOrders: 20 },
    actionType: "CREATE_NOTIFICATION",
    actionConfig: { targetRole: "vendor", notifCategory: "MENU" },
    severity: "WARNING",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_5",
    name: "GrabIt Gold Expiration Reminder",
    description: "Sends student reminders 7d, 3d, and 1d prior to GrabIt Gold subscription renewal date.",
    eventType: "GOLD_EXPIRATION_CHECK",
    cadence: "DAILY",
    conditionConfig: { reminderDays: [7, 3, 1] },
    actionType: "CREATE_NOTIFICATION",
    actionConfig: { targetRole: "student", notifCategory: "GOLD" },
    severity: "INFO",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_6",
    name: "Student Low Wallet Balance Alert",
    description: "Notifies student when wallet balance drops below ₹100 (capped at 1 notification per day).",
    eventType: "WALLET_BALANCE_CHECK",
    cadence: "MEDIUM",
    conditionConfig: { minBalanceRupees: 100, dailyCap: 1 },
    actionType: "CREATE_NOTIFICATION",
    actionConfig: { targetRole: "student", notifCategory: "WALLET" },
    severity: "INFO",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_7",
    name: "Razorpay Payment Failure Spike Detection",
    description: "Alerts Super Admin if payment failure rate exceeds 15% in a rolling 1-hour window.",
    eventType: "PAYMENT_HEALTH_CHECK",
    cadence: "HIGH",
    conditionConfig: { maxFailureRatePercent: 15.0 },
    actionType: "ESCALATE_ALERT",
    actionConfig: { targetRole: "admin", alertSeverity: "CRITICAL" },
    severity: "CRITICAL",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_8",
    name: "Webhook Anomaly Monitoring",
    description: "Monitors Razorpay webhook execution failures and signature verification anomalies.",
    eventType: "WEBHOOK_HEALTH_CHECK",
    cadence: "DAILY",
    conditionConfig: { maxWebhookFailures: 3 },
    actionType: "ESCALATE_ALERT",
    actionConfig: { targetRole: "admin", alertSeverity: "CRITICAL" },
    severity: "CRITICAL",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_9",
    name: "Financial Reconciliation Integrity Audit",
    description: "Runs read-only ledger reconciliation and flags order/payment/wallet mismatches to Super Admin.",
    eventType: "RECONCILIATION_CHECK",
    cadence: "DAILY",
    conditionConfig: { auditStrictness: "HIGH" },
    actionType: "ESCALATE_ALERT",
    actionConfig: { targetRole: "admin", alertSeverity: "CRITICAL" },
    severity: "CRITICAL",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wr_10",
    name: "Vendor Payout Settlement Dispatch",
    description: "Notifies vendor when daily bank settlement payout status updates to settled or failed.",
    eventType: "PAYOUT_CHECK",
    cadence: "MEDIUM",
    conditionConfig: { notifySettled: true },
    actionType: "CREATE_NOTIFICATION",
    actionConfig: { targetRole: "vendor", notifCategory: "PAYOUTS" },
    severity: "INFO",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Fetches all workflow rules from Supabase (or fallback seed rules if database is empty).
 */
export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("workflow_rules")
      .select("*")
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      return SEED_WORKFLOW_RULES;
    }

    return data.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      eventType: r.event_type,
      cadence: (r.condition_config?.cadence as WorkflowCadence) || "HIGH",
      conditionConfig: (r.condition_config as Record<string, unknown>) || {},
      actionType: r.action_type as WorkflowActionType,
      actionConfig: (r.action_config as Record<string, unknown>) || {},
      severity: (r.severity as "INFO" | "WARNING" | "CRITICAL") || "INFO",
      enabled: r.enabled ?? true,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.warn("Could not fetch workflow rules (fallback to seeds):", err);
    return SEED_WORKFLOW_RULES;
  }
}

/**
 * Executes a single workflow rule idempotently.
 * Checks uniqueness on (workflow_rule_id, execution_key) to prevent duplicate runs.
 * Fail-safe wrapper: isolates errors so failures NEVER crash the calling route.
 */
export async function executeWorkflowRule(
  rule: WorkflowRule,
  executionKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any> = {},
): Promise<{ success: boolean; status: "SUCCESS" | "FAILED" | "SKIPPED"; message?: string; durationMs: number }> {
  const supabase = getSupabaseAdminClient();
  const startTime = Date.now();
  const triggeredAtStr = new Date(startTime).toISOString();

  if (!rule.enabled) {
    return { success: true, status: "SKIPPED", message: "Rule is disabled.", durationMs: 0 };
  }

  try {
    // 1. Check Idempotency Key in workflow_executions
    const { data: existing } = await supabase
      .from("workflow_executions")
      .select("id, status")
      .eq("workflow_rule_id", rule.id)
      .eq("execution_key", executionKey)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: true, status: "SKIPPED", message: "Execution key already executed.", durationMs: Date.now() - startTime };
    }

    // 2. Perform Action based on rule.actionType
    let resultSummary: Record<string, unknown> = { payloadReceived: true };

    if (rule.actionType === "CREATE_NOTIFICATION") {
      if (rule.actionConfig.targetRole === "vendor" && payload.canteenId) {
        await createOperationalNotification({
          recipientType: "vendor",
          canteenId: payload.canteenId,
          type: "NEW_ORDER",
          severity: rule.severity,
          title: `[Workflow] ${rule.name}`,
          message: payload.message || rule.description,
          actionUrl: "/vendor",
          dedupeKey: executionKey,
        });
      } else if (rule.actionConfig.targetRole === "student" && payload.userId) {
        await createStudentNotification({
          userId: payload.userId,
          type: "CAMPUS_ANNOUNCEMENT",
          title: rule.name,
          message: payload.message || rule.description,
          severity: rule.severity === "CRITICAL" ? "URGENT" : rule.severity,
          category: (rule.actionConfig.notifCategory as "ORDERS" | "PAYMENTS" | "WALLET" | "GOLD" | "RECOMMENDATIONS" | "GENERAL") || "GENERAL",
          dedupeKey: executionKey,
        });
      }
      resultSummary = { actionDispatched: "CREATE_NOTIFICATION" };
    } else if (rule.actionType === "ESCALATE_ALERT") {
      await createOperationalNotification({
        recipientType: "admin",
        type: "SYSTEM_HEALTH_WARNING",
        severity: rule.severity,
        title: `[Escalation] ${rule.name}`,
        message: payload.message || rule.description,
        actionUrl: "/superadmin/operations",
        dedupeKey: executionKey,
      });
      resultSummary = { actionDispatched: "ESCALATE_ALERT" };
    } else if (rule.actionType === "AUTO_RESOLVE_ALERT") {
      if (payload.dedupeKey) {
        await autoResolveOperationalNotification(payload.dedupeKey);
      }
      resultSummary = { actionDispatched: "AUTO_RESOLVE_ALERT" };
    }

    // 3. Automatically Create or Update Operational Incident for CRITICAL/WARNING Workflows
    if (rule.severity === "CRITICAL" || rule.severity === "WARNING") {
      try {
        const { createOrUpdateIncident } = await import("@/lib/incidents/incident_service");
        const categoryMap: Record<string, "ORDER" | "VENDOR" | "DELIVERY" | "PAYMENT" | "RECONCILIATION" | "WEBHOOK" | "SYSTEM" | "WORKFLOW" | "SLA" | "SECURITY"> = {
          ORDER_AGING_CHECK: "SLA",
          VENDOR_SLA_CHECK: "VENDOR",
          KITCHEN_BACKLOG_CHECK: "SLA",
          MENU_STOCK_CHECK: "VENDOR",
          PAYMENT_HEALTH_CHECK: "PAYMENT",
          WEBHOOK_HEALTH_CHECK: "WEBHOOK",
          RECONCILIATION_CHECK: "RECONCILIATION",
        };

        await createOrUpdateIncident({
          title: rule.name,
          description: payload.message || rule.description,
          sourceType: "WORKFLOW",
          sourceId: rule.id,
          severity: rule.severity,
          category: categoryMap[rule.eventType] || "WORKFLOW",
          dedupeKey: `inc-${rule.eventType}:${new Date().toISOString().split("T")[0]}`,
        });
      } catch (incErr) {
        console.warn("Non-critical incident creation error:", incErr);
      }
    }

    const durationMs = Date.now() - startTime;

    // 3. Log Successful Execution
    await supabase.from("workflow_executions").insert({
      workflow_rule_id: rule.id,
      execution_key: executionKey,
      status: "SUCCESS",
      triggered_at: triggeredAtStr,
      completed_at: new Date().toISOString(),
      result_summary: { ...resultSummary, durationMs, retryable: false },
    });

    return { success: true, status: "SUCCESS", durationMs };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : "Unknown execution error";
    const isRetryable = errorMsg.includes("timeout") || errorMsg.includes("connection") || errorMsg.includes("network");

    console.warn(`Workflow rule execution error (${rule.name}):`, errorMsg);

    try {
      await supabase.from("workflow_executions").insert({
        workflow_rule_id: rule.id,
        execution_key: executionKey,
        status: "FAILED",
        triggered_at: triggeredAtStr,
        completed_at: new Date().toISOString(),
        error_message: errorMsg,
        result_summary: { durationMs, retryable: isRetryable },
      });
    } catch {
      // ignore insert failure
    }

    return { success: false, status: "FAILED", message: errorMsg, durationMs };
  }
}

/**
 * Runs scheduled workflow jobs filtered by optional cadence ("HIGH" | "MEDIUM" | "DAILY" | "ALL").
 * Protected backend operation executed via Vercel Cron or Super Admin "Run Now".
 */
export async function runScheduledJobs(
  cadenceFilter: "HIGH" | "MEDIUM" | "DAILY" | "ALL" = "ALL",
): Promise<WorkflowTelemetrySummary> {
  const allRules = await getWorkflowRules();
  const filteredRules =
    cadenceFilter === "ALL"
      ? allRules
      : allRules.filter((r) => r.cadence === cadenceFilter);

  const todayStr = new Date().toISOString().split("T")[0];
  let successfulExecutions = 0;
  let failedExecutions = 0;
  const recentExecutions: WorkflowExecution[] = [];

  for (const rule of filteredRules) {
    const executionKey = `cron:${rule.eventType}:${todayStr}`;
    const result = await executeWorkflowRule(rule, executionKey, {
      message: `Automated ${rule.name} scheduled check executed for ${todayStr}.`,
    });

    if (result.status === "SUCCESS" || result.status === "SKIPPED") {
      successfulExecutions++;
    } else {
      failedExecutions++;
    }

    recentExecutions.push({
      id: `exec_${rule.id}_${Date.now()}`,
      workflowRuleId: rule.id,
      executionKey,
      status: result.status,
      triggeredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      errorMessage: result.message ?? null,
      retryable: result.status === "FAILED",
      resultSummary: { ruleName: rule.name, cadence: rule.cadence },
      createdAt: new Date().toISOString(),
    });
  }

  const enabledRulesCount = allRules.filter((r) => r.enabled).length;
  const totalExecutions = filteredRules.length;
  const successRatePercent = totalExecutions > 0 ? Number(((successfulExecutions / totalExecutions) * 100).toFixed(1)) : 100;

  const lastRunTime = recentExecutions.length > 0 ? recentExecutions[0].triggeredAt : null;
  const isStale = false; // Fresh execution run
  const stalenessStatus = lastRunTime ? "FRESH" : "NEVER_RUN";

  let healthStatus: WorkflowHealthStatus = "HEALTHY";
  if (failedExecutions > 0 || successRatePercent < 90) {
    healthStatus = "DEGRADED";
  }
  if (failedExecutions >= 3 || successRatePercent < 80) {
    healthStatus = "CRITICAL";
  }

  return {
    totalRules: allRules.length,
    enabledRules: enabledRulesCount,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    successRatePercent,
    healthStatus,
    lastRunTime,
    isStale,
    stalenessStatus,
    rules: allRules,
    recentExecutions,
  };
}
