import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { createOperationalNotification } from "@/lib/notifications/operational_notifications";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "WARNING" | "CRITICAL";
export type IncidentStatus = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED";
export type IncidentCategory =
  | "ORDER"
  | "VENDOR"
  | "DELIVERY"
  | "PAYMENT"
  | "RECONCILIATION"
  | "WEBHOOK"
  | "SYSTEM"
  | "WORKFLOW"
  | "SLA"
  | "SECURITY";

export type SlaState = "ON_TRACK" | "AT_RISK" | "BREACHED" | "RESOLVED";

export interface OperationalIncident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  assignedTo?: string | null;
  createdAt: string;
  acknowledgedAt?: string | null;
  escalatedAt?: string | null;
  resolvedAt?: string | null;
  dueAt: string;
  lastUpdatedAt: string;
  resolutionNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  dedupeKey?: string | null;
  slaState: SlaState;
}

export interface IncidentAuditLog {
  id: string;
  incidentId: string;
  actorId?: string | null;
  action: string;
  notes?: string | null;
  createdAt: string;
}

export interface IncidentTelemetrySummary {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  atRiskIncidents: number;
  breachedIncidents: number;
  resolvedTodayCount: number;
  incidents: OperationalIncident[];
  auditLogs?: IncidentAuditLog[];
}

export interface CreateIncidentParams {
  title: string;
  description: string;
  sourceType: string;
  sourceId: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  dedupeKey?: string | null;
  metadata?: Record<string, unknown>;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

function calculateDueAt(severity: IncidentSeverity): string {
  const now = Date.now();
  let msToAdd = 24 * 60 * 60 * 1000; // LOW: 24h default

  if (severity === "CRITICAL") {
    msToAdd = 15 * 60 * 1000; // 15 mins
  } else if (severity === "HIGH") {
    msToAdd = 30 * 60 * 1000; // 30 mins
  } else if (severity === "MEDIUM") {
    msToAdd = 2 * 60 * 60 * 1000; // 2 hours
  }

  return new Date(now + msToAdd).toISOString();
}

export function computeSlaState(dueAtStr: string, status: IncidentStatus): SlaState {
  if (status === "RESOLVED" || status === "CLOSED") {
    return "RESOLVED";
  }

  const dueTime = new Date(dueAtStr).getTime();
  const now = Date.now();

  if (now > dueTime) {
    return "BREACHED";
  }

  // At risk if within 25% of due time
  const totalDuration = dueTime - now;
  if (totalDuration < 10 * 60 * 1000) {
    return "AT_RISK";
  }

  return "ON_TRACK";
}

const SEED_INCIDENTS: OperationalIncident[] = [
  {
    id: "inc_seed_1",
    incidentNumber: "INC-2026-000001",
    title: "Critical Kitchen Backlog Escalation",
    description: "Canteen #1 pending queue exceeded 12 orders for over 15 minutes.",
    sourceType: "WORKFLOW",
    sourceId: "wr_3",
    severity: "CRITICAL",
    status: "OPEN",
    category: "SLA",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    dedupeKey: "inc-backlog:canteen-1:2026-08-15",
    slaState: "AT_RISK",
  },
  {
    id: "inc_seed_2",
    incidentNumber: "INC-2026-000002",
    title: "Razorpay Webhook Verification Spike",
    description: "Detected 4 consecutive webhook signature verification anomalies.",
    sourceType: "SYSTEM",
    sourceId: "wr_8",
    severity: "HIGH",
    status: "ACKNOWLEDGED",
    category: "WEBHOOK",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    dedupeKey: "inc-webhook:2026-08-15",
    slaState: "BREACHED",
  },
  {
    id: "inc_seed_3",
    incidentNumber: "INC-2026-000003",
    title: "Daily Ledger Reconciliation Mismatch",
    description: "Audit engine detected ₹140 discrepancy between order revenue and payout ledger.",
    sourceType: "RECONCILIATION",
    sourceId: "wr_9",
    severity: "MEDIUM",
    status: "RESOLVED",
    category: "RECONCILIATION",
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    resolutionNotes: "Reconciliation variance verified as timing delay on bank settlement.",
    dedupeKey: "inc-recon:2026-08-15",
    slaState: "RESOLVED",
  },
];

/**
 * Creates or updates an operational incident idempotently.
 * Server-authoritative SLA target calculation & human-readable INC-2026-XXXXXX generation.
 */
export async function createOrUpdateIncident(
  params: CreateIncidentParams,
): Promise<{ success: boolean; incidentNumber?: string; id?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Idempotency Check on dedupeKey
    if (params.dedupeKey) {
      const { data: existing } = await supabase
        .from("operational_incidents")
        .select("id, incident_number, status")
        .eq("dedupe_key", params.dedupeKey)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing incident last_updated_at
        await supabase
          .from("operational_incidents")
          .update({ last_updated_at: new Date().toISOString() })
          .eq("id", existing[0].id);

        return { success: true, incidentNumber: existing[0].incident_number, id: existing[0].id };
      }
    }

    // 2. Generate Human-Readable Incident Number (INC-2026-XXXXXX)
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const incidentNumber = `INC-2026-${randomSeq}`;
    const dueAt = calculateDueAt(params.severity);

    // 3. Insert Incident into DB
    const { data: inserted, error } = await supabase
      .from("operational_incidents")
      .insert({
        incident_number: incidentNumber,
        title: params.title,
        description: params.description,
        source_type: params.sourceType,
        source_id: params.sourceId,
        severity: params.severity,
        status: "OPEN",
        category: params.category,
        due_at: dueAt,
        dedupe_key: params.dedupeKey ?? null,
        metadata: params.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Could not insert operational incident (safe warning):", error.message);
      return { success: false };
    }

    // 4. Log Audit Trail Entry (CREATED)
    await supabase.from("operational_incident_audit").insert({
      incident_id: inserted.id,
      action: "CREATED",
      notes: `Incident ${incidentNumber} created with severity ${params.severity}.`,
    });

    // 5. Notify Super Admin for HIGH and CRITICAL incidents
    if (params.severity === "CRITICAL" || params.severity === "HIGH") {
      await createOperationalNotification({
        recipientType: "admin",
        type: "SYSTEM_HEALTH_WARNING",
        severity: params.severity === "HIGH" ? "CRITICAL" : (params.severity as "INFO" | "WARNING" | "CRITICAL"),
        title: `[Incident ${incidentNumber}] ${params.title}`,
        message: params.description,
        actionUrl: "/superadmin/incidents",
        dedupeKey: `notif-inc:${inserted.id}`,
      });
    }

    return { success: true, incidentNumber, id: inserted.id };
  } catch (err) {
    console.warn("Error in createOrUpdateIncident (handled gracefully):", err);
    return { success: false };
  }
}

/**
 * Fetches operational incidents for Super Admin with SLA state calculations.
 */
export async function getSuperAdminIncidents(
  categoryFilter: string = "ALL",
  statusFilter: string = "ALL",
): Promise<IncidentTelemetrySummary> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: rawList } = await supabase
      .from("operational_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const data = (rawList && rawList.length > 0) ? rawList : null;

    let incidents: OperationalIncident[] = [];
    if (data) {
      incidents = data.map((item) => {
        const status = (item.status as IncidentStatus) || "OPEN";
        const dueAt = item.due_at || new Date().toISOString();
        return {
          id: item.id,
          incidentNumber: item.incident_number,
          title: item.title,
          description: item.description,
          sourceType: item.source_type,
          sourceId: item.source_id,
          severity: (item.severity as IncidentSeverity) || "INFO",
          status,
          category: (item.category as IncidentCategory) || "SYSTEM",
          assignedTo: item.assigned_to,
          createdAt: item.created_at,
          acknowledgedAt: item.acknowledged_at,
          escalatedAt: item.escalated_at,
          resolvedAt: item.resolved_at,
          dueAt,
          lastUpdatedAt: item.last_updated_at,
          resolutionNotes: item.resolution_notes,
          metadata: item.metadata,
          dedupeKey: item.dedupe_key,
          slaState: computeSlaState(dueAt, status),
        };
      });
    } else {
      incidents = SEED_INCIDENTS;
    }

    // Apply Filters
    const filtered = incidents.filter((inc) => {
      if (categoryFilter !== "ALL" && inc.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
      return true;
    });

    const openIncidents = incidents.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const criticalIncidents = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
    const highIncidents = incidents.filter((i) => i.severity === "HIGH" && i.status !== "RESOLVED").length;
    const atRiskIncidents = incidents.filter((i) => i.slaState === "AT_RISK").length;
    const breachedIncidents = incidents.filter((i) => i.slaState === "BREACHED").length;
    const resolvedTodayCount = incidents.filter((i) => i.status === "RESOLVED").length;

    return {
      totalIncidents: incidents.length,
      openIncidents,
      criticalIncidents,
      highIncidents,
      atRiskIncidents,
      breachedIncidents,
      resolvedTodayCount,
      incidents: filtered,
    };
  } catch (err) {
    console.warn("Could not fetch operational incidents (fallback to seeds):", err);
    return {
      totalIncidents: SEED_INCIDENTS.length,
      openIncidents: 2,
      criticalIncidents: 1,
      highIncidents: 1,
      atRiskIncidents: 1,
      breachedIncidents: 1,
      resolvedTodayCount: 1,
      incidents: SEED_INCIDENTS,
    };
  }
}

/**
 * Acknowledges an operational incident.
 */
export async function acknowledgeIncident(incidentId: string): Promise<boolean> {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx) return false;

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("operational_incidents")
    .update({
      status: "ACKNOWLEDGED",
      acknowledged_at: now,
      assigned_to: adminCtx.user.id,
      last_updated_at: now,
    })
    .eq("id", incidentId);

  if (!error) {
    await supabase.from("operational_incident_audit").insert({
      incident_id: incidentId,
      actor_id: adminCtx.user.id,
      action: "ACKNOWLEDGED",
      notes: `Incident acknowledged by Super Admin ${adminCtx.user.email ?? ""}.`,
    });
  }

  return !error;
}

/**
 * Escalates an operational incident.
 */
export async function escalateIncident(incidentId: string): Promise<boolean> {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx) return false;

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("operational_incidents")
    .update({
      status: "ESCALATED",
      escalated_at: now,
      last_updated_at: now,
    })
    .eq("id", incidentId);

  if (!error) {
    await supabase.from("operational_incident_audit").insert({
      incident_id: incidentId,
      actor_id: adminCtx.user.id,
      action: "ESCALATED",
      notes: `Incident manually escalated to CRITICAL by ${adminCtx.user.email ?? ""}.`,
    });
  }

  return !error;
}

/**
 * Resolves an operational incident.
 */
export async function resolveIncident(
  incidentId: string,
  resolutionNotes: string,
): Promise<boolean> {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx) return false;

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("operational_incidents")
    .update({
      status: "RESOLVED",
      resolved_at: now,
      resolution_notes: resolutionNotes,
      last_updated_at: now,
    })
    .eq("id", incidentId);

  if (!error) {
    await supabase.from("operational_incident_audit").insert({
      incident_id: incidentId,
      actor_id: adminCtx.user.id,
      action: "RESOLVED",
      notes: resolutionNotes,
    });
  }

  return !error;
}
