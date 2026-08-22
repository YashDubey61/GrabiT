import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ServiceName =
  | "STUDENT_API"
  | "VENDOR_API"
  | "SUPERADMIN_API"
  | "PAYMENT_API"
  | "WEBHOOK_API"
  | "INTERNAL_CRON"
  | "WORKFLOW_ENGINE"
  | "SLA_ENGINE"
  | "DATABASE";

export type EventType =
  | "API_REQUEST"
  | "API_ERROR"
  | "DATABASE_QUERY"
  | "DATABASE_ERROR"
  | "CRON_EXECUTION"
  | "WORKFLOW_EXECUTION"
  | "WEBHOOK_PROCESSING"
  | "HEALTH_CHECK"
  | "SLO_BREACH";

export type EventStatus = "SUCCESS" | "FAILED" | "DEGRADED" | "TIMEOUT";
export type EventSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface HealthEventParams {
  serviceName: ServiceName;
  eventType: EventType;
  status: EventStatus;
  severity?: EventSeverity;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Sanitizes metadata to strictly strip authorization headers, cookies, credentials,
 * payment secrets, and student PII before writing telemetry.
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {};

  const safe: Record<string, unknown> = {};
  const forbiddenKeys = [
    "authorization",
    "cookie",
    "password",
    "token",
    "secret",
    "key",
    "email",
    "phone",
    "address",
    "signature",
    "service_role",
  ];

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      safe[key] = "[REDACTED_PRIVACY]";
    } else if (typeof value === "object" && value !== null) {
      safe[key] = "[OBJECT]";
    } else {
      safe[key] = value;
    }
  }

  return safe;
}

/**
 * Non-blocking, fail-safe health event recording helper.
 * Wrapped in try/catch so metric logging failures NEVER break user applications.
 */
export async function recordHealthEvent(params: HealthEventParams): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const cleanMeta = sanitizeMetadata(params.metadata);

    const { error } = await supabase.from("system_health_events").insert({
      service_name: params.serviceName,
      event_type: params.eventType,
      status: params.status,
      severity: params.severity || "INFO",
      duration_ms: params.durationMs ?? 0,
      metadata: cleanMeta,
    });

    if (error) {
      console.warn("Telemetry insert warning (safe fallback):", error.message);
    }

    return !error;
  } catch (err) {
    console.warn("Non-critical observability recording failure:", err);
    return false;
  }
}

export async function recordApiMetric(
  serviceName: ServiceName,
  route: string,
  method: string,
  statusCode: number,
  durationMs: number,
): Promise<void> {
  const isError = statusCode >= 400;
  const status: EventStatus = statusCode >= 500 ? "FAILED" : statusCode >= 400 ? "DEGRADED" : "SUCCESS";
  const severity: EventSeverity = statusCode >= 500 ? "CRITICAL" : isError ? "WARNING" : "INFO";

  await recordHealthEvent({
    serviceName,
    eventType: isError ? "API_ERROR" : "API_REQUEST",
    status,
    severity,
    durationMs,
    metadata: { route, method, statusCode },
  });
}

export async function recordDatabaseMetric(
  queryCategory: string,
  status: EventStatus,
  durationMs: number,
): Promise<void> {
  await recordHealthEvent({
    serviceName: "DATABASE",
    eventType: status === "FAILED" ? "DATABASE_ERROR" : "DATABASE_QUERY",
    status,
    severity: status === "FAILED" ? "CRITICAL" : durationMs > 1000 ? "WARNING" : "INFO",
    durationMs,
    metadata: { queryCategory },
  });
}

export async function recordCronMetric(
  jobName: string,
  status: EventStatus,
  durationMs: number,
): Promise<void> {
  await recordHealthEvent({
    serviceName: "INTERNAL_CRON",
    eventType: "CRON_EXECUTION",
    status,
    severity: status === "FAILED" ? "CRITICAL" : "INFO",
    durationMs,
    metadata: { jobName },
  });
}

export async function recordWorkflowMetric(
  ruleId: string,
  status: EventStatus,
  durationMs: number,
): Promise<void> {
  await recordHealthEvent({
    serviceName: "WORKFLOW_ENGINE",
    eventType: "WORKFLOW_EXECUTION",
    status,
    severity: status === "FAILED" ? "WARNING" : "INFO",
    durationMs,
    metadata: { ruleId },
  });
}

export async function recordWebhookMetric(
  eventType: string,
  status: EventStatus,
  durationMs: number,
): Promise<void> {
  await recordHealthEvent({
    serviceName: "WEBHOOK_API",
    eventType: "WEBHOOK_PROCESSING",
    status,
    severity: status === "FAILED" ? "CRITICAL" : "INFO",
    durationMs,
    metadata: { webhookEventType: eventType },
  });
}
