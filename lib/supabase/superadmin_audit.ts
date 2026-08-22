import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuditModule =
  | "Users"
  | "Vendors"
  | "Risk"
  | "Disputes"
  | "Finance"
  | "Payments"
  | "Orders"
  | "Security"
  | "Incidents"
  | "System";

export type AuditSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AuditTargetType =
  | "USER"
  | "VENDOR"
  | "APPLICATION"
  | "CASE"
  | "DISPUTE"
  | "ORDER"
  | "PAYMENT"
  | "SYSTEM";

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorAdminId: string;
  actorName: string;
  actorEmail?: string;
  actorRole: string;
  action: string;
  module: AuditModule;
  targetType: AuditTargetType;
  targetId: string;
  severity: AuditSeverity;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditOverviewStats {
  totalEvents: number;
  todayEvents: number;
  adminActions: number;
  securityEvents: number;
  financialActions: number;
  vendorActions: number;
  userActions: number;
  criticalEvents: number;
}

// In-memory fallback store for offline / mock testing
const inMemoryAuditLogs: AuditLogEntry[] = [
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K0",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    actorAdminId: "admin_super_01",
    actorName: "Super Admin",
    actorEmail: "admin@grabit.in",
    actorRole: "admin",
    action: "user_role_changed",
    module: "Users",
    targetType: "USER",
    targetId: "USR_882194",
    severity: "HIGH",
    previousState: { role: "student", status: "active" },
    newState: { role: "admin", status: "active" },
    reason: "Promoted to Operations Lead per SLA escalation request",
    metadata: { ticketId: "TCK_9912", authMethod: "MFA_TOTP" },
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K1",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    actorAdminId: "admin_super_01",
    actorName: "Super Admin",
    actorEmail: "admin@grabit.in",
    actorRole: "admin",
    action: "refund_processed",
    module: "Disputes",
    targetType: "DISPUTE",
    targetId: "DISP-8921",
    severity: "HIGH",
    previousState: { refund_status: "REQUESTED", status: "UNDER_REVIEW" },
    newState: { refund_status: "COMPLETED", status: "RESOLVED", refund_amount: 350.0 },
    reason: "Processed refund of ₹350.00: Items missing from canteen order",
    metadata: { orderId: "ORD-99201", refundAmount: 350.0, method: "WALLET" },
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K2",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hrs ago
    actorAdminId: "admin_ops_02",
    actorName: "Risk Lead",
    actorEmail: "risk@grabit.in",
    actorRole: "admin",
    action: "risk_case_resolved",
    module: "Risk",
    targetType: "CASE",
    targetId: "CASE-4401",
    severity: "MEDIUM",
    previousState: { status: "INVESTIGATING", risk_score: 85 },
    newState: { status: "RESOLVED", resolution: "False positive verified with merchant" },
    reason: "Verified identity via vendor phone call & GST proof",
    metadata: { riskScore: 85, entityType: "vendor" },
    ipAddress: "10.0.4.12",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  },
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K3",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hrs ago
    actorAdminId: "admin_super_01",
    actorName: "Super Admin",
    actorEmail: "admin@grabit.in",
    actorRole: "admin",
    action: "vendor_suspended",
    module: "Vendors",
    targetType: "VENDOR",
    targetId: "CANTEEN-123",
    severity: "HIGH",
    previousState: { vendor_status: "active" },
    newState: { vendor_status: "suspended", suspension_reason: "Repeated health safety violations" },
    reason: "Failed random food quality inspection",
    metadata: { canteenName: "Axis Canteen 3", inspectionScore: 42 },
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K4",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hrs ago
    actorAdminId: "admin_super_01",
    actorName: "Super Admin",
    actorEmail: "admin@grabit.in",
    actorRole: "admin",
    action: "application_approved",
    module: "Vendors",
    targetType: "APPLICATION",
    targetId: "APP-5510",
    severity: "LOW",
    previousState: { application_status: "pending", kyc_status: "submitted" },
    newState: { application_status: "approved", kyc_status: "verified" },
    reason: "FSSAI license and bank documents verified successfully",
    metadata: { vendorName: "Campus Bistro", campusId: "cmp_axis_01" },
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: "aud_01H9A1B2C3D4E5F6G7H8J9K5",
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hrs ago
    actorAdminId: "admin_sec_03",
    actorName: "Security Audit Bot",
    actorEmail: "sec-bot@grabit.in",
    actorRole: "admin",
    action: "credential_reset",
    module: "Security",
    targetType: "USER",
    targetId: "USR_10029",
    severity: "CRITICAL",
    previousState: { mfa_enabled: false },
    newState: { mfa_enabled: true, password_reset_required: true },
    reason: "Automated credential reset triggered due to suspicious login location",
    metadata: { originCity: "Reykjavik", expectedCity: "Bengaluru" },
    ipAddress: "185.220.101.4",
    userAgent: "SecurityBot/2.0",
  },
];

/**
 * Mask sensitive metadata and secrets before displaying or exporting.
 * NEVER display passwords, auth tokens, API keys, service keys, full bank accounts, payment secrets.
 */
export function maskSensitiveData<T>(data: T): T {
  if (!data) return data;
  if (typeof data !== "object") return data;

  const SENSITIVE_KEYS = [
    "password",
    "pass",
    "token",
    "auth_token",
    "authtoken",
    "api_key",
    "apikey",
    "secret",
    "service_role_key",
    "account_number",
    "bank_account",
    "card_number",
    "cvv",
    "session_secret",
    "private_key",
    "access_token",
    "refresh_token",
  ];

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item)) as unknown as T;
  }

  const maskedObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      maskedObj[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      maskedObj[key] = maskSensitiveData(value);
    } else {
      maskedObj[key] = value;
    }
  }

  return maskedObj as T;
}

/**
 * Determine default severity based on action and module if not specified.
 */
export function determineSeverity(action: string, module: AuditModule, explicitSeverity?: AuditSeverity): AuditSeverity {
  if (explicitSeverity) return explicitSeverity;

  const act = action.toLowerCase();

  if (act.includes("critical") || act.includes("security_alert") || act.includes("credential_reset")) {
    return "CRITICAL";
  }
  if (
    act.includes("role_changed") ||
    act.includes("status_changed") ||
    act.includes("suspended") ||
    act.includes("deactivated") ||
    act.includes("refund_processed")
  ) {
    return "HIGH";
  }
  if (
    act.includes("rejected") ||
    act.includes("refund_approved") ||
    act.includes("refund_rejected") ||
    act.includes("risk_case_resolved")
  ) {
    return "MEDIUM";
  }
  if (act.includes("approved") || act.includes("verified") || act.includes("created")) {
    return "LOW";
  }
  return "INFO";
}

/**
 * Infer module from action string if omitted.
 */
export function inferModule(action: string): AuditModule {
  const act = action.toLowerCase();
  if (act.includes("user") || act.includes("role") || act.includes("account_status")) return "Users";
  if (act.includes("vendor") || act.includes("application") || act.includes("kyc") || act.includes("store")) return "Vendors";
  if (act.includes("risk") || act.includes("case")) return "Risk";
  if (act.includes("dispute") || act.includes("refund")) return "Disputes";
  if (act.includes("settlement") || act.includes("payout") || act.includes("reconciliation")) return "Finance";
  if (act.includes("payment") || act.includes("cashfree") || act.includes("wallet")) return "Payments";
  if (act.includes("order")) return "Orders";
  if (act.includes("security") || act.includes("credential") || act.includes("token")) return "Security";
  return "System";
}

/**
 * Infer target type from action and module.
 */
export function inferTargetType(action: string, module: AuditModule): AuditTargetType {
  const act = action.toLowerCase();
  if (act.includes("user") || module === "Users") return "USER";
  if (act.includes("application")) return "APPLICATION";
  if (act.includes("vendor") || act.includes("store") || module === "Vendors") return "VENDOR";
  if (act.includes("risk") || act.includes("case") || module === "Risk") return "CASE";
  if (act.includes("dispute") || act.includes("refund") || module === "Disputes") return "DISPUTE";
  if (act.includes("order") || module === "Orders") return "ORDER";
  if (act.includes("payment") || act.includes("payout") || module === "Payments" || module === "Finance") return "PAYMENT";
  return "SYSTEM";
}

/**
 * Records a Super Admin action into the centralized superadmin_audit_logs table.
 * Append-only, non-blocking side effect.
 */
export async function recordSuperAdminAction(entry: {
  adminId: string;
  action: string;
  module?: AuditModule;
  targetType?: AuditTargetType;
  targetId?: string;
  vendorId?: string; // backwards compatibility
  severity?: AuditSeverity;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const finalModule = entry.module || inferModule(entry.action);
  const finalTargetType = entry.targetType || inferTargetType(entry.action, finalModule);
  const finalTargetId = entry.targetId || entry.vendorId || "N/A";
  const finalSeverity = determineSeverity(entry.action, finalModule, entry.severity);
  const maskedMetadata = maskSensitiveData(entry.metadata ?? {});
  const maskedPrev = maskSensitiveData(entry.previousState ?? null);
  const maskedNext = maskSensitiveData(entry.newState ?? null);

  const newLogEntry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    actorAdminId: entry.adminId,
    actorName: "Super Admin",
    actorEmail: "admin@grabit.in",
    actorRole: "admin",
    action: entry.action,
    module: finalModule,
    targetType: finalTargetType,
    targetId: finalTargetId,
    severity: finalSeverity,
    previousState: maskedPrev,
    newState: maskedNext,
    reason: entry.reason ?? null,
    metadata: maskedMetadata,
    ipAddress: entry.ipAddress ?? "127.0.0.1",
    userAgent: entry.userAgent ?? "GRABIT SuperAdmin Console",
  };

  // 1. Add to in-memory fallback store
  inMemoryAuditLogs.unshift(newLogEntry);

  // 2. Persist to database table superadmin_audit_logs
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("superadmin_audit_logs").insert({
      actor_admin_id: entry.adminId,
      action: entry.action,
      module: finalModule,
      target_type: finalTargetType,
      target_id: finalTargetId,
      severity: finalSeverity,
      previous_state: maskedPrev,
      new_state: maskedNext,
      reason: entry.reason ?? null,
      metadata: maskedMetadata,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch {
    // Non-blocking side effect
  }
}

/**
 * Fetch live Audit Overview Stats for KPI Cards.
 */
export async function fetchAuditOverviewStats(): Promise<AuditOverviewStats> {
  let dbLogs: AuditLogEntry[] = [];

  try {
    const supabase = getSupabaseAdminClient();
    const { data } = await supabase
      .from("superadmin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      dbLogs = data.map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        actorAdminId: d.actor_admin_id,
        actorName: d.actor_name || "Super Admin",
        actorEmail: d.actor_email || "admin@grabit.in",
        actorRole: d.actor_role || "admin",
        action: d.action,
        module: d.module as AuditModule,
        targetType: d.target_type as AuditTargetType,
        targetId: d.target_id,
        severity: d.severity as AuditSeverity,
        previousState: d.previous_state,
        newState: d.new_state,
        reason: d.reason,
        metadata: d.metadata,
        ipAddress: d.ip_address,
        userAgent: d.user_agent,
      }));
    }
  } catch {
    // Fallback to in-memory store
  }

  const allLogs = dbLogs.length > 0 ? dbLogs : inMemoryAuditLogs;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayEvents = allLogs.filter((log) => new Date(log.createdAt) >= startOfToday).length;
  const adminActions = allLogs.filter((log) => log.actorRole === "admin").length;
  const securityEvents = allLogs.filter((log) => log.module === "Security").length;
  const financialActions = allLogs.filter((log) => log.module === "Finance" || log.module === "Payments" || log.action.includes("refund")).length;
  const vendorActions = allLogs.filter((log) => log.module === "Vendors").length;
  const userActions = allLogs.filter((log) => log.module === "Users").length;
  const criticalEvents = allLogs.filter((log) => log.severity === "CRITICAL" || log.severity === "HIGH").length;

  return {
    totalEvents: allLogs.length,
    todayEvents,
    adminActions,
    securityEvents,
    financialActions,
    vendorActions,
    userActions,
    criticalEvents,
  };
}

export interface FetchAuditLogsFilters {
  search?: string;
  module?: AuditModule | "ALL";
  action?: string | "ALL";
  severity?: AuditSeverity | "ALL";
  actorId?: string | "ALL";
  dateRange?: "today" | "yesterday" | "7d" | "30d" | "custom" | "ALL";
  startDate?: string;
  endDate?: string;
  targetId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch paginated & filtered audit log directory.
 */
export async function fetchAuditLogs(filters: FetchAuditLogsFilters = {}): Promise<{
  events: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 50));
  const offset = (page - 1) * pageSize;

  let dbLogs: AuditLogEntry[] = [];
  let dbTotal = 0;

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("superadmin_audit_logs").select("*", { count: "exact" });

    if (filters.module && filters.module !== "ALL") {
      query = query.eq("module", filters.module);
    }
    if (filters.severity && filters.severity !== "ALL") {
      query = query.eq("severity", filters.severity);
    }
    if (filters.action && filters.action !== "ALL") {
      query = query.eq("action", filters.action);
    }
    if (filters.actorId && filters.actorId !== "ALL") {
      query = query.eq("actor_admin_id", filters.actorId);
    }
    if (filters.targetId) {
      query = query.eq("target_id", filters.targetId);
    }

    if (filters.dateRange && filters.dateRange !== "ALL") {
      const now = new Date();
      if (filters.dateRange === "today") {
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte("created_at", start);
      } else if (filters.dateRange === "yesterday") {
        const start = new Date(now.setDate(now.getDate() - 1));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
      } else if (filters.dateRange === "7d") {
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", start);
      } else if (filters.dateRange === "30d") {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte("created_at", start);
      } else if (filters.dateRange === "custom" && filters.startDate) {
        query = query.gte("created_at", filters.startDate);
        if (filters.endDate) {
          query = query.lte("created_at", filters.endDate);
        }
      }
    }

    if (filters.search?.trim()) {
      const s = filters.search.trim();
      query = query.or(
        `action.ilike.%${s}%,target_id.ilike.%${s}%,reason.ilike.%${s}%,actor_name.ilike.%${s}%`
      );
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (!error && data) {
      dbTotal = count || data.length;
      dbLogs = data.map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        actorAdminId: d.actor_admin_id,
        actorName: d.actor_name || "Super Admin",
        actorEmail: d.actor_email || "admin@grabit.in",
        actorRole: d.actor_role || "admin",
        action: d.action,
        module: d.module as AuditModule,
        targetType: d.target_type as AuditTargetType,
        targetId: d.target_id,
        severity: d.severity as AuditSeverity,
        previousState: maskSensitiveData(d.previous_state),
        newState: maskSensitiveData(d.new_state),
        reason: d.reason,
        metadata: maskSensitiveData(d.metadata),
        ipAddress: d.ip_address,
        userAgent: d.user_agent,
      }));
    }
  } catch {
    // Use fallback
  }

  if (dbLogs.length > 0) {
    return { events: dbLogs, totalCount: dbTotal, page, pageSize };
  }

  // Filter in-memory logs
  let filtered = [...inMemoryAuditLogs];

  if (filters.module && filters.module !== "ALL") {
    filtered = filtered.filter((item) => item.module === filters.module);
  }
  if (filters.severity && filters.severity !== "ALL") {
    filtered = filtered.filter((item) => item.severity === filters.severity);
  }
  if (filters.action && filters.action !== "ALL") {
    filtered = filtered.filter((item) => item.action === filters.action);
  }
  if (filters.actorId && filters.actorId !== "ALL") {
    filtered = filtered.filter((item) => item.actorAdminId === filters.actorId);
  }
  if (filters.targetId) {
    filtered = filtered.filter((item) => item.targetId === filters.targetId);
  }
  if (filters.search?.trim()) {
    const s = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.action.toLowerCase().includes(s) ||
        item.targetId.toLowerCase().includes(s) ||
        (item.reason && item.reason.toLowerCase().includes(s)) ||
        item.actorName.toLowerCase().includes(s) ||
        item.actorAdminId.toLowerCase().includes(s)
    );
  }

  const paginated = filtered.slice(offset, offset + pageSize);
  return {
    events: paginated,
    totalCount: filtered.length,
    page,
    pageSize,
  };
}

/**
 * Fetch entity activity timeline for a specific entity ID (User, Vendor, Order, Case, Dispute).
 */
export async function fetchEntityTimeline(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  const result = await fetchAuditLogs({ targetId: entityId, pageSize: 100 });
  if (result.events.length > 0) {
    return result.events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Search in-memory
  const matching = inMemoryAuditLogs.filter(
    (item) =>
      item.targetId === entityId ||
      (item.metadata && (item.metadata.orderId === entityId || item.metadata.canteenId === entityId))
  );

  return matching.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
