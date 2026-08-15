import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getSuperAdminOperationsMetrics } from "./superadmin_operations";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface PersistentOperationalAlert {
  id: string;
  alert_key: string;
  category: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

/**
 * Evaluates operational conditions, deduplicates against open alerts, and auto-resolves cleared conditions.
 */
export async function syncAndDeduplicateOperationalAlerts(): Promise<PersistentOperationalAlert[]> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch live metrics & computed alerts
  const opsData = await getSuperAdminOperationsMetrics("today");
  const computedAlerts = opsData.alerts;

  // 2. Fetch existing OPEN or ACKNOWLEDGED persistent alerts from database
  const { data: existingDbAlerts } = await supabase
    .from("operational_alerts")
    .select("*")
    .in("status", ["OPEN", "ACKNOWLEDGED"]);

  const activeDbAlertMap = new Map<string, PersistentOperationalAlert>(
    (existingDbAlerts ?? []).map((a) => [a.alert_key, a as PersistentOperationalAlert]),
  );

  const activeComputedKeys = new Set<string>();

  // 3. Deduplication Loop: Insert new alerts only if no active alert exists for alert_key
  for (const cAlert of computedAlerts) {
    const alertKey = cAlert.id;
    activeComputedKeys.add(alertKey);

    if (!activeDbAlertMap.has(alertKey)) {
      await supabase.from("operational_alerts").insert({
        alert_key: alertKey,
        category: cAlert.category,
        severity: cAlert.severity,
        title: cAlert.title,
        description: cAlert.description,
        status: "OPEN",
        metadata: { source: "auto_evaluator" },
      });
    }
  }

  // 4. Auto-Resolution Loop: Auto-resolve OPEN alerts whose conditions are no longer active
  for (const [existingKey, existingAlert] of activeDbAlertMap.entries()) {
    if (!activeComputedKeys.has(existingKey) && existingAlert.status === "OPEN") {
      await supabase
        .from("operational_alerts")
        .update({
          status: "RESOLVED",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", existingAlert.id);
    }
  }

  // 5. Return current full list of persistent operational alerts
  const { data: allAlerts } = await supabase
    .from("operational_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!allAlerts || allAlerts.length === 0) {
    // Return fallback in-memory alert list if table not populated
    return computedAlerts.map((ca, idx) => ({
      id: ca.id,
      alert_key: ca.id,
      category: ca.category,
      severity: ca.severity,
      title: ca.title,
      description: ca.description,
      status: "OPEN",
      created_at: new Date(Date.now() - idx * 60000).toISOString(),
    }));
  }

  return allAlerts as PersistentOperationalAlert[];
}

/**
 * Fetch persistent operational alerts with optional status and severity filters.
 */
export async function getOperationalAlerts(
  statusFilter?: AlertStatus,
  severityFilter?: AlertSeverity,
): Promise<PersistentOperationalAlert[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("operational_alerts")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (severityFilter) {
    query = query.eq("severity", severityFilter);
  }

  const { data: alerts } = await query.limit(50);

  if (!alerts || alerts.length === 0) {
    // Sync and return alerts if table query is empty
    return syncAndDeduplicateOperationalAlerts();
  }

  return alerts as PersistentOperationalAlert[];
}

/**
 * Super Admin Acknowledges an Operational Alert.
 * Sets status = 'ACKNOWLEDGED', acknowledged_at = NOW(), acknowledged_by = adminUserId.
 */
export async function acknowledgeOperationalAlert(
  alertId: string,
  adminUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("operational_alerts")
      .update({
        status: "ACKNOWLEDGED",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: adminUserId,
      })
      .eq("id", alertId);

    if (error) {
      console.error("Acknowledge alert database error:", error);
      return { ok: false, error: "Failed to acknowledge alert." };
    }

    return { ok: true };
  } catch (err) {
    console.error("Acknowledge alert error:", err);
    return { ok: false, error: "Internal server error acknowledging alert." };
  }
}

/**
 * Super Admin Resolves an Operational Alert.
 * Sets status = 'RESOLVED', resolved_at = NOW(), resolved_by = adminUserId.
 */
export async function resolveOperationalAlert(
  alertId: string,
  adminUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("operational_alerts")
      .update({
        status: "RESOLVED",
        resolved_at: new Date().toISOString(),
        resolved_by: adminUserId,
      })
      .eq("id", alertId);

    if (error) {
      console.error("Resolve alert database error:", error);
      return { ok: false, error: "Failed to resolve alert." };
    }

    return { ok: true };
  } catch (err) {
    console.error("Resolve alert error:", err);
    return { ok: false, error: "Internal server error resolving alert." };
  }
}
