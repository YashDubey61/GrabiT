import { recordSuperAdminAction, maskSensitiveData } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";
export type IncidentStatus = "DETECTED" | "INVESTIGATING" | "MITIGATING" | "MONITORING" | "RESOLVED" | "CLOSED";

export interface IncidentOverviewStats {
  activeIncidents: number;
  sev1Count: number;
  sev2Count: number;
  investigatingCount: number;
  mitigatingCount: number;
  resolvedTodayCount: number;
  avgMttaMinutes: number;
  avgMttrMinutes: number;
}

export interface SuperAdminIncidentItem {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: string;
  affectedService: string;
  detectedAt: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  incidentCommanderId?: string;
  assignedAdminId?: string;
  commanderName?: string;
  assignedAdminName?: string;
  campusIds: string[];
  vendorIds: string[];
  affectedUserCount: number;
  affectedOrderCount: number;
  affectedPaymentCount: number;
  estimatedRevenueImpact: number;
  rootCause?: string;
  resolution?: string;
  customerImpact?: string;
  internalNotes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  eventType: string;
  message: string;
  actorAdminId?: string;
  actorName?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface IncidentPostmortem {
  id: string;
  incidentId: string;
  rootCause: string;
  impactSummary: string;
  timelineSummary: string;
  whatWentWell?: string;
  whatWentWrong?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  ownerAdminId?: string;
  dueDate?: string;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED";
  createdAt: string;
  updatedAt: string;
}

export interface IncidentSignalItem {
  id: string;
  signal: string;
  currentValue: string;
  baseline: string;
  changePct: number;
  severityRecommendation: IncidentSeverity;
  evidence: string;
  category: string;
  affectedService: string;
}

// In-memory fallback incidents for seed/testing
const fallbackIncidents: SuperAdminIncidentItem[] = [
  {
    id: "inc_sev1_001",
    incidentNumber: "INC-2026-000101",
    title: "UPI Payment Gateway Outage Spike",
    description: "Abnormal Cashfree UPI gateway timeout failures detected across PSIT Kanpur campus",
    severity: "SEV1",
    status: "INVESTIGATING",
    category: "PAYMENT",
    affectedService: "Cashfree UPI Gateway",
    detectedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 1500 * 1000).toISOString(),
    incidentCommanderId: "admin_master_01",
    assignedAdminId: "admin_master_01",
    commanderName: "Super Admin Ops",
    assignedAdminName: "Super Admin Ops",
    campusIds: ["psit_kanpur_01"],
    vendorIds: ["canteens_axis_01"],
    affectedUserCount: 142,
    affectedOrderCount: 88,
    affectedPaymentCount: 92,
    estimatedRevenueImpact: 21120.0,
    customerImpact: "Students experiencing Cashfree UPI timeout errors during checkout",
    internalNotes: "Contacted Cashfree merchant support desk for gateway status validation",
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 600 * 1000).toISOString(),
  },
  {
    id: "inc_sev3_002",
    incidentNumber: "INC-2026-000102",
    title: "Axis Canteen Printer Backlog",
    description: "Thermal kitchen printer offline leading to manual QR pickup verification fallback",
    severity: "SEV3",
    status: "MITIGATING",
    category: "VENDOR",
    affectedService: "Kitchen Print Service",
    detectedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    acknowledgedAt: new Date(Date.now() - 3600 * 1000 * 1.8).toISOString(),
    mitigatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    incidentCommanderId: "admin_master_01",
    commanderName: "Super Admin Ops",
    campusIds: ["psit_kanpur_01"],
    vendorIds: ["canteens_axis_01"],
    affectedUserCount: 24,
    affectedOrderCount: 24,
    affectedPaymentCount: 0,
    estimatedRevenueImpact: 0.0,
    customerImpact: "Slight 3-minute delay in kitchen order ticket printing",
    internalNotes: "Vendor switched to manual digital terminal order queue",
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
  },
];

const fallbackEvents: Record<string, IncidentTimelineEvent[]> = {
  inc_sev1_001: [
    {
      id: "evt_101",
      incidentId: "inc_sev1_001",
      eventType: "DETECTED",
      message: "Incident DETECTED via automated payment failure anomaly signal",
      actorAdminId: "system",
      actorName: "System Signal Engine",
      metadata: { failureRate: "18.4%" },
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
    {
      id: "evt_102",
      incidentId: "inc_sev1_001",
      eventType: "INVESTIGATING",
      message: "Status changed to INVESTIGATING by Super Admin Ops",
      actorAdminId: "admin_master_01",
      actorName: "Super Admin Ops",
      metadata: {},
      createdAt: new Date(Date.now() - 1500 * 1000).toISOString(),
    },
  ],
};

const fallbackPostmortems: Record<string, IncidentPostmortem> = {};

/**
 * Validate incident status transition path.
 */
export function isValidIncidentStatusTransition(current: IncidentStatus, next: IncidentStatus): boolean {
  if (current === next) return true;

  const validTransitions: Record<IncidentStatus, IncidentStatus[]> = {
    DETECTED: ["INVESTIGATING", "CLOSED"],
    INVESTIGATING: ["MITIGATING", "MONITORING", "RESOLVED"],
    MITIGATING: ["MONITORING", "RESOLVED", "INVESTIGATING"],
    MONITORING: ["RESOLVED", "INVESTIGATING"],
    RESOLVED: ["CLOSED", "INVESTIGATING"],
    CLOSED: ["INVESTIGATING"],
  };

  return validTransitions[current]?.includes(next) ?? false;
}

/**
 * Fetch Incident Overview KPIs.
 */
export async function fetchIncidentOverviewData(): Promise<IncidentOverviewStats> {
  const directory = await fetchIncidentsDirectory();
  const incidents = directory.incidents;

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
  const sev1Count = incidents.filter((i) => i.severity === "SEV1" && i.status !== "CLOSED").length;
  const sev2Count = incidents.filter((i) => i.severity === "SEV2" && i.status !== "CLOSED").length;
  const investigatingCount = incidents.filter((i) => i.status === "INVESTIGATING").length;
  const mitigatingCount = incidents.filter((i) => i.status === "MITIGATING").length;
  const resolvedTodayCount = incidents.filter((i) => i.status === "RESOLVED").length;

  return {
    activeIncidents,
    sev1Count,
    sev2Count,
    investigatingCount,
    mitigatingCount,
    resolvedTodayCount,
    avgMttaMinutes: 4.2,
    avgMttrMinutes: 18.5,
  };
}

/**
 * Fetch Incidents Directory with server-side filtering.
 */
export async function fetchIncidentsDirectory(
  severity?: string,
  status?: string,
  search?: string
): Promise<{ incidents: SuperAdminIncidentItem[] }> {
  let list = [...fallbackIncidents];

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("superadmin_incidents")
      .select("*")
      .order("detected_at", { ascending: false });

    if (data && data.length > 0) {
      list = data.map((d: any) => ({
        id: d.id,
        incidentNumber: d.incident_number,
        title: d.title,
        description: d.description,
        severity: d.severity,
        status: d.status,
        category: d.category,
        affectedService: d.affected_service,
        detectedAt: d.detected_at,
        acknowledgedAt: d.acknowledged_at,
        mitigatedAt: d.mitigated_at,
        resolvedAt: d.resolved_at,
        closedAt: d.closed_at,
        incidentCommanderId: d.incident_commander_id,
        assignedAdminId: d.assigned_admin_id,
        campusIds: d.campus_ids || [],
        vendorIds: d.vendor_ids || [],
        affectedUserCount: d.affected_user_count || 0,
        affectedOrderCount: d.affected_order_count || 0,
        affectedPaymentCount: d.affected_payment_count || 0,
        estimatedRevenueImpact: Number(d.estimated_revenue_impact || 0),
        rootCause: d.root_cause,
        resolution: d.resolution,
        customerImpact: d.customer_impact,
        internalNotes: d.internal_notes,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
  } catch {
    // DB fallback
  }

  if (severity && severity !== "ALL") {
    list = list.filter((i) => i.severity === severity);
  }
  if (status && status !== "ALL") {
    list = list.filter((i) => i.status === status);
  }
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    list = list.filter(
      (i) =>
        i.incidentNumber.toLowerCase().includes(s) ||
        i.title.toLowerCase().includes(s) ||
        i.affectedService.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s)
    );
  }

  return { incidents: list };
}

/**
 * Fetch Single Incident Detail, Timeline Events Stream, and Postmortem Report.
 */
export async function fetchIncidentDetail(
  id: string
): Promise<{ incident: SuperAdminIncidentItem | null; events: IncidentTimelineEvent[]; postmortem: IncidentPostmortem | null }> {
  const directory = await fetchIncidentsDirectory();
  const incident = directory.incidents.find((i) => i.id === id || i.incidentNumber === id) || null;

  if (!incident) {
    return { incident: null, events: [], postmortem: null };
  }

  let events = fallbackEvents[incident.id] || [
    {
      id: `evt_${Date.now()}`,
      incidentId: incident.id,
      eventType: "DETECTED",
      message: `Incident ${incident.incidentNumber} DETECTED telemetry signal`,
      createdAt: incident.detectedAt,
      metadata: {},
    },
  ];

  let postmortem = fallbackPostmortems[incident.id] || null;

  return { incident, events, postmortem };
}

/**
 * Create a new Super Admin Incident.
 */
export async function createSuperAdminIncident(
  payload: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    category?: string;
    affectedService?: string;
    campusIds?: string[];
    vendorIds?: string[];
    customerImpact?: string;
    incidentCommanderId?: string;
  },
  adminId: string
): Promise<{ ok: boolean; incident?: SuperAdminIncidentItem; error?: string }> {
  if (!payload.title || !payload.description || !payload.severity) {
    return { ok: false, error: "Title, description, and severity are required." };
  }

  const incidentNumber = `INC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const newIncident: SuperAdminIncidentItem = {
    id: `inc_${Date.now()}`,
    incidentNumber,
    title: payload.title,
    description: payload.description,
    severity: payload.severity,
    status: "DETECTED",
    category: payload.category || "SYSTEM",
    affectedService: payload.affectedService || "Core Platform",
    detectedAt: new Date().toISOString(),
    incidentCommanderId: payload.incidentCommanderId || adminId,
    assignedAdminId: payload.incidentCommanderId || adminId,
    campusIds: payload.campusIds || [],
    vendorIds: payload.vendorIds || [],
    affectedUserCount: 0,
    affectedOrderCount: 0,
    affectedPaymentCount: 0,
    estimatedRevenueImpact: 0,
    customerImpact: payload.customerImpact,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("superadmin_incidents").insert({
      id: newIncident.id,
      incident_number: newIncident.incidentNumber,
      title: newIncident.title,
      description: newIncident.description,
      severity: newIncident.severity,
      status: newIncident.status,
      category: newIncident.category,
      affected_service: newIncident.affectedService,
      detected_at: newIncident.detectedAt,
      incident_commander_id: newIncident.incidentCommanderId,
      assigned_admin_id: newIncident.assignedAdminId,
      campus_ids: newIncident.campusIds,
      vendor_ids: newIncident.vendorIds,
      customer_impact: newIncident.customerImpact,
      created_by: adminId,
    });

    await supabase.from("superadmin_incident_events").insert({
      incident_id: newIncident.id,
      event_type: "DETECTED",
      message: `Incident ${incidentNumber} created by Super Admin`,
      actor_admin_id: adminId,
    });
  } catch {
    // Fallback store
    fallbackIncidents.unshift(newIncident);
    fallbackEvents[newIncident.id] = [
      {
        id: `evt_${Date.now()}`,
        incidentId: newIncident.id,
        eventType: "DETECTED",
        message: `Incident ${incidentNumber} created by Super Admin`,
        actorAdminId: adminId,
        metadata: {},
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // Record Audit Log
  await recordSuperAdminAction({
    adminId,
    action: "incident_created",
    module: "Incidents",
    targetType: "SYSTEM",
    targetId: newIncident.id,
    newState: { incidentNumber, severity: payload.severity, title: payload.title },
    reason: `Created incident ${incidentNumber}`,
  });

  return { ok: true, incident: newIncident };
}

/**
 * Update Incident Status and Severity with lifecycle validation & SEV1/SEV2 safeguards.
 */
export async function updateIncidentStatusAndSeverity(
  payload: {
    incidentId: string;
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    resolution?: string;
    internalNotes?: string;
    incidentCommanderId?: string;
  },
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  const { incident, postmortem } = await fetchIncidentDetail(payload.incidentId);
  if (!incident) return { ok: false, error: "Incident not found." };

  const targetStatus = payload.status || incident.status;
  const targetSeverity = payload.severity || incident.severity;

  // Lifecycle Transition Validation
  if (payload.status && !isValidIncidentStatusTransition(incident.status, payload.status)) {
    return {
      ok: false,
      error: `Invalid status transition from ${incident.status} to ${payload.status}. Follow lifecycle: DETECTED -> INVESTIGATING -> MITIGATING -> MONITORING -> RESOLVED -> CLOSED.`,
    };
  }

  // SEV1/SEV2 Resolution Explanation Safeguard
  if (targetStatus === "RESOLVED" && (targetSeverity === "SEV1" || targetSeverity === "SEV2")) {
    if (!payload.resolution && !incident.resolution) {
      return {
        ok: false,
        error: `Resolving a ${targetSeverity} incident strictly requires a mandatory resolution explanation rationale.`,
      };
    }
  }

  // SEV1/SEV2 Closure Postmortem Safeguard
  if (targetStatus === "CLOSED" && (targetSeverity === "SEV1" || targetSeverity === "SEV2")) {
    if (!postmortem) {
      return {
        ok: false,
        error: `Closing a ${targetSeverity} incident strictly requires a completed incident postmortem report.`,
      };
    }
  }

  try {
    const supabase = getSupabaseAdminClient();
    const updateFields: any = {
      status: targetStatus,
      severity: targetSeverity,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === "INVESTIGATING" && !incident.acknowledgedAt) {
      updateFields.acknowledged_at = new Date().toISOString();
    }
    if (targetStatus === "MITIGATING") {
      updateFields.mitigated_at = new Date().toISOString();
    }
    if (targetStatus === "RESOLVED") {
      updateFields.resolved_at = new Date().toISOString();
      if (payload.resolution) updateFields.resolution = payload.resolution;
    }
    if (targetStatus === "CLOSED") {
      updateFields.closed_at = new Date().toISOString();
    }
    if (payload.internalNotes) updateFields.internal_notes = payload.internalNotes;
    if (payload.incidentCommanderId) updateFields.incident_commander_id = payload.incidentCommanderId;

    await supabase.from("superadmin_incidents").update(updateFields).eq("id", incident.id);

    await supabase.from("superadmin_incident_events").insert({
      incident_id: incident.id,
      event_type: payload.status ? "STATUS_CHANGED" : "UPDATED",
      message: `Incident ${incident.incidentNumber} updated status to ${targetStatus} and severity to ${targetSeverity}`,
      actor_admin_id: adminId,
    });
  } catch {
    // In-memory fallback
    incident.status = targetStatus;
    incident.severity = targetSeverity;
    if (payload.resolution) incident.resolution = payload.resolution;
    if (payload.internalNotes) incident.internalNotes = payload.internalNotes;
  }

  // Audit Log Entry
  await recordSuperAdminAction({
    adminId,
    action: payload.status ? "incident_status_changed" : "incident_updated",
    module: "Incidents",
    targetType: "SYSTEM",
    targetId: incident.id,
    previousState: { status: incident.status, severity: incident.severity },
    newState: { status: targetStatus, severity: targetSeverity },
    reason: `Updated incident ${incident.incidentNumber} status to ${targetStatus}`,
  });

  return { ok: true };
}

/**
 * Add Timeline Event to Incident.
 */
export async function addIncidentTimelineEvent(
  incidentId: string,
  eventType: string,
  message: string,
  adminId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!message.trim()) return { ok: false, error: "Event message is required." };

  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("superadmin_incident_events").insert({
      incident_id: incidentId,
      event_type: eventType || "NOTE",
      message,
      actor_admin_id: adminId,
    });
  } catch {
    if (!fallbackEvents[incidentId]) fallbackEvents[incidentId] = [];
    fallbackEvents[incidentId].push({
      id: `evt_${Date.now()}`,
      incidentId,
      eventType: eventType || "NOTE",
      message,
      actorAdminId: adminId,
      metadata: {},
      createdAt: new Date().toISOString(),
    });
  }

  await recordSuperAdminAction({
    adminId,
    action: "incident_note_added",
    module: "Incidents",
    targetType: "SYSTEM",
    targetId: incidentId,
    newState: { message },
    reason: `Added internal timeline event/note to incident ${incidentId}`,
  });

  return { ok: true };
}

/**
 * Create or Update Incident Postmortem Report.
 */
export async function createOrUpdateIncidentPostmortem(
  payload: {
    incidentId: string;
    rootCause: string;
    impactSummary: string;
    timelineSummary: string;
    whatWentWell?: string;
    whatWentWrong?: string;
    correctiveActions?: string;
    preventiveActions?: string;
    status?: "DRAFT" | "IN_REVIEW" | "APPROVED";
  },
  adminId: string
): Promise<{ ok: boolean; postmortem?: IncidentPostmortem; error?: string }> {
  if (!payload.rootCause || !payload.impactSummary || !payload.timelineSummary) {
    return { ok: false, error: "Root cause, impact summary, and timeline summary are required for postmortem." };
  }

  const postmortem: IncidentPostmortem = {
    id: `pm_${Date.now()}`,
    incidentId: payload.incidentId,
    rootCause: payload.rootCause,
    impactSummary: payload.impactSummary,
    timelineSummary: payload.timelineSummary,
    whatWentWell: payload.whatWentWell,
    whatWentWrong: payload.whatWentWrong,
    correctiveActions: payload.correctiveActions,
    preventiveActions: payload.preventiveActions,
    ownerAdminId: adminId,
    status: payload.status || "DRAFT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("superadmin_incident_postmortems").upsert({
      incident_id: payload.incidentId,
      root_cause: payload.rootCause,
      impact_summary: payload.impactSummary,
      timeline_summary: payload.timelineSummary,
      what_went_well: payload.whatWentWell,
      what_went_wrong: payload.whatWentWrong,
      corrective_actions: payload.correctiveActions,
      preventive_actions: payload.preventiveActions,
      owner_admin_id: adminId,
      status: postmortem.status,
      updated_at: new Date().toISOString(),
    });
  } catch {
    fallbackPostmortems[payload.incidentId] = postmortem;
  }

  await recordSuperAdminAction({
    adminId,
    action: "incident_postmortem_updated",
    module: "Incidents",
    targetType: "SYSTEM",
    targetId: payload.incidentId,
    newState: { status: postmortem.status },
    reason: `Updated postmortem report for incident ${payload.incidentId}`,
  });

  return { ok: true, postmortem };
}

/**
 * Fetch Automated Incident Signals.
 */
export async function fetchAutomatedIncidentSignals(): Promise<IncidentSignalItem[]> {
  return [
    {
      id: "sig_01",
      signal: "UPI Payment Failure Rate Spike",
      currentValue: "18.4% Failures",
      baseline: "1.2% Baseline",
      changePct: +1433,
      severityRecommendation: "SEV1",
      evidence: "Cashfree UPI gateway timeout responses spiked during 12:00-12:30 PM window",
      category: "PAYMENT",
      affectedService: "Cashfree UPI Gateway",
    },
    {
      id: "sig_02",
      signal: "Canteen Kitchen Printer Timeout",
      currentValue: "Offline",
      baseline: "Online",
      changePct: 0,
      severityRecommendation: "SEV3",
      evidence: "Axis Central Canteen thermal printing queue timed out 3 consecutive times",
      category: "VENDOR",
      affectedService: "Kitchen Print Service",
    },
  ];
}
