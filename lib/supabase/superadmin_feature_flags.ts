import { recordSuperAdminAction } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type FlagCategory =
  | "Student"
  | "Vendor"
  | "Super Admin"
  | "Payments"
  | "Orders"
  | "Offers"
  | "Analytics"
  | "Experimental"
  | "Disputes"
  | "System";

export type FlagStatus = "ENABLED" | "DISABLED" | "SCHEDULED" | "ROLLOUT";
export type FlagEnvironment = "development" | "staging" | "production";
export type TargetScope = "ALL USERS" | "CAMPUS" | "VENDOR" | "USER" | "PERCENTAGE";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FeatureFlagItem {
  id: string;
  key: string;
  name: string;
  description: string;
  category: FlagCategory;
  status: FlagStatus;
  environment: FlagEnvironment;
  rolloutPercentage: number;
  riskLevel: RiskLevel;
  isHighImpact: boolean;
  targetScope: TargetScope;
  targetCampusIds: string[];
  targetVendorIds: string[];
  targetUserIds: string[];
  scheduleEnableAt?: string | null;
  scheduleDisableAt?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
  updatedByName?: string | null;
}

export interface FeatureFlagContext {
  userId?: string;
  campusId?: string;
  vendorId?: string;
  role?: string;
  environment?: FlagEnvironment;
}

export interface FlagOverviewStats {
  totalFlags: number;
  enabled: number;
  disabled: number;
  scheduled: number;
  gradualRollouts: number;
  recentlyChanged: number;
  productionFlags: number;
  experimentalFlags: number;
}

/**
 * Deterministic FNV-1a hash algorithm generating a sticky 0-99 percentage score from a seed string.
 * Guarantees a student/vendor/campus consistently remains included or excluded during gradual rollouts.
 */
export function getDeterministicPercentage(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash) % 100;
}

// In-memory fallback feature flags store for offline & mock execution
const inMemoryFeatureFlags: FeatureFlagItem[] = [
  {
    id: "flag_01",
    key: "student_rewards_v2",
    name: "Student Rewards Points V2",
    description: "Gamified reward points, tier badges, and transfer system for student app",
    category: "Student",
    status: "ENABLED",
    environment: "production",
    rolloutPercentage: 100,
    riskLevel: "LOW",
    isHighImpact: false,
    targetScope: "ALL USERS",
    targetCampusIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_02",
    key: "vendor_instant_payouts",
    name: "Vendor Instant Payout Engine",
    description: "Direct T+0 Cashfree automated payout transfers for verified canteen vendors",
    category: "Vendor",
    status: "ROLLOUT",
    environment: "production",
    rolloutPercentage: 25,
    riskLevel: "HIGH",
    isHighImpact: true,
    targetScope: "PERCENTAGE",
    targetCampusIds: [],
    targetVendorIds: ["CANTEEN-123", "CANTEEN-456"],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_03",
    key: "campus_geofencing_v2",
    name: "Campus Geofence GPS Detection",
    description: "Automatic GPS campus discovery and location verification at student checkout",
    category: "System",
    status: "ENABLED",
    environment: "production",
    rolloutPercentage: 100,
    riskLevel: "MEDIUM",
    isHighImpact: false,
    targetScope: "ALL USERS",
    targetCampusIds: ["cmp_axis_01"],
    targetVendorIds: [],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_04",
    key: "cashfree_upi_intent",
    name: "Cashfree Seamless UPI Intent",
    description: "Direct UPI Intent deep-linking for PhonePe, GPay, and Paytm at checkout",
    category: "Payments",
    status: "ROLLOUT",
    environment: "production",
    rolloutPercentage: 50,
    riskLevel: "HIGH",
    isHighImpact: true,
    targetScope: "PERCENTAGE",
    targetCampusIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_05",
    key: "order_pickup_otp_verify",
    name: "Order Pickup OTP Verification",
    description: "Mandatory 4-digit OTP fallback verification for canteen order pickup",
    category: "Orders",
    status: "ENABLED",
    environment: "production",
    rolloutPercentage: 100,
    riskLevel: "LOW",
    isHighImpact: false,
    targetScope: "ALL USERS",
    targetCampusIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 8).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_06",
    key: "dispute_auto_refunds",
    name: "Automatic Low-Value Refund Engine",
    description: "Automate wallet refund credits for missing items under ₹100",
    category: "Disputes",
    status: "DISABLED",
    environment: "production",
    rolloutPercentage: 0,
    riskLevel: "CRITICAL",
    isHighImpact: true,
    targetScope: "ALL USERS",
    targetCampusIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    id: "flag_07",
    key: "analytics_predictive_demand",
    name: "Predictive Kitchen Demand Engine",
    description: "AI ML demand forecasting widgets for vendor inventory management",
    category: "Analytics",
    status: "SCHEDULED",
    environment: "staging",
    rolloutPercentage: 10,
    riskLevel: "LOW",
    isHighImpact: false,
    targetScope: "PERCENTAGE",
    targetCampusIds: [],
    targetVendorIds: [],
    targetUserIds: [],
    scheduleEnableAt: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // Tomorrow
    scheduleDisableAt: new Date(Date.now() + 3600 * 1000 * 24 * 14).toISOString(), // 2 weeks
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
];

/**
 * Server-side Feature Flag Evaluator.
 * Deterministically evaluates feature flag status for any given request context.
 */
export async function evaluateFeatureFlag(
  flagKey: string,
  context: FeatureFlagContext = {}
): Promise<{ enabled: boolean; reason: string; flag?: FeatureFlagItem }> {
  const flags = await fetchFeatureFlags("ALL");
  const flag = flags.find((f) => f.key === flagKey);

  if (!flag) {
    return { enabled: false, reason: "Missing flag key defaults to disabled", flag: undefined };
  }

  // 1. Explicit Status Check
  if (flag.status === "DISABLED") {
    return { enabled: false, reason: "Flag is explicitly DISABLED", flag };
  }

  // 2. Environment Matching Check (defaulting to production if omitted)
  const currentEnv = context.environment || "production";
  if (flag.environment !== currentEnv && flag.environment !== "production") {
    return { enabled: false, reason: `Flag configured for '${flag.environment}' environment`, flag };
  }

  // 3. Timezone-Aware Scheduling Check
  if (flag.status === "SCHEDULED") {
    const now = new Date();
    if (flag.scheduleEnableAt && new Date(flag.scheduleEnableAt) > now) {
      return { enabled: false, reason: "Scheduled enable time has not been reached", flag };
    }
    if (flag.scheduleDisableAt && new Date(flag.scheduleDisableAt) <= now) {
      return { enabled: false, reason: "Scheduled disable time has passed", flag };
    }
  }

  // 4. Explicit User / Campus / Vendor Target Overrides
  if (context.userId && flag.targetUserIds && flag.targetUserIds.includes(context.userId)) {
    return { enabled: true, reason: `User ${context.userId} explicitly targeted`, flag };
  }

  if (context.campusId && flag.targetCampusIds && flag.targetCampusIds.includes(context.campusId)) {
    return { enabled: true, reason: `Campus ${context.campusId} explicitly targeted`, flag };
  }

  if (context.vendorId && flag.targetVendorIds && flag.targetVendorIds.includes(context.vendorId)) {
    return { enabled: true, reason: `Vendor ${context.vendorId} explicitly targeted`, flag };
  }

  // 5. 100% Enabled All Users
  if (flag.status === "ENABLED" && flag.targetScope === "ALL USERS") {
    return { enabled: true, reason: "Flag is 100% ENABLED for ALL USERS", flag };
  }

  // 6. Sticky Deterministic Gradual Percentage Rollout
  if (flag.status === "ROLLOUT" || flag.targetScope === "PERCENTAGE") {
    const seed = `${flagKey}:${context.userId || context.campusId || context.vendorId || "anonymous"}`;
    const hashScore = getDeterministicPercentage(seed);

    if (hashScore < flag.rolloutPercentage) {
      return {
        enabled: true,
        reason: `Included in ${flag.rolloutPercentage}% gradual rollout (score: ${hashScore}%)`,
        flag,
      };
    } else {
      return {
        enabled: false,
        reason: `Excluded from ${flag.rolloutPercentage}% gradual rollout (score: ${hashScore}%)`,
        flag,
      };
    }
  }

  return { enabled: false, reason: "Default safe fallback", flag };
}

/**
 * Fetch feature flags filtered by category, status, environment, or search text.
 */
export async function fetchFeatureFlags(
  category?: string,
  status?: string,
  environment?: string,
  search?: string
): Promise<FeatureFlagItem[]> {
  let dbFlags: FeatureFlagItem[] = [];

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("superadmin_feature_flags").select("*");

    if (category && category !== "ALL") query = query.eq("category", category);
    if (status && status !== "ALL") query = query.eq("status", status);
    if (environment && environment !== "ALL") query = query.eq("environment", environment);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      dbFlags = data.map((d: any) => ({
        id: d.id,
        key: d.key,
        name: d.name,
        description: d.description || "",
        category: d.category as FlagCategory,
        status: d.status as FlagStatus,
        environment: d.environment as FlagEnvironment,
        rolloutPercentage: d.rollout_percentage,
        riskLevel: d.risk_level as RiskLevel,
        isHighImpact: d.is_high_impact ?? false,
        targetScope: d.target_scope as TargetScope,
        targetCampusIds: d.target_campus_ids || [],
        targetVendorIds: d.target_vendor_ids || [],
        targetUserIds: d.target_user_ids || [],
        scheduleEnableAt: d.schedule_enable_at,
        scheduleDisableAt: d.schedule_disable_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
        updatedBy: d.updated_by,
        updatedByName: "Super Admin",
      }));
    }
  } catch {
    // DB fallback
  }

  let result = dbFlags.length > 0 ? dbFlags : [...inMemoryFeatureFlags];

  if (category && category !== "ALL") {
    result = result.filter((f) => f.category === category);
  }
  if (status && status !== "ALL") {
    result = result.filter((f) => f.status === status);
  }
  if (environment && environment !== "ALL") {
    result = result.filter((f) => f.environment === environment);
  }
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    result = result.filter(
      (f) =>
        f.key.toLowerCase().includes(s) ||
        f.name.toLowerCase().includes(s) ||
        f.description.toLowerCase().includes(s)
    );
  }

  return result;
}

/**
 * Fetch Feature Flag Overview Stats for KPI Cards.
 */
export async function fetchFeatureFlagOverviewStats(): Promise<FlagOverviewStats> {
  const flags = await fetchFeatureFlags("ALL");
  const enabled = flags.filter((f) => f.status === "ENABLED").length;
  const disabled = flags.filter((f) => f.status === "DISABLED").length;
  const scheduled = flags.filter((f) => f.status === "SCHEDULED").length;
  const gradualRollouts = flags.filter((f) => f.status === "ROLLOUT").length;
  const productionFlags = flags.filter((f) => f.environment === "production").length;
  const experimentalFlags = flags.filter((f) => f.category === "Experimental").length;

  const startOf7DaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentlyChanged = flags.filter((f) => new Date(f.updatedAt) >= startOf7DaysAgo).length;

  return {
    totalFlags: flags.length,
    enabled,
    disabled,
    scheduled,
    gradualRollouts,
    recentlyChanged,
    productionFlags,
    experimentalFlags,
  };
}

/**
 * Create a new Feature Flag with validation and audit logging.
 */
export async function createFeatureFlag({
  adminId,
  flag,
}: {
  adminId: string;
  flag: Omit<FeatureFlagItem, "id" | "createdAt" | "updatedAt" | "updatedBy">;
}): Promise<{ ok: boolean; error?: string; flagItem?: FeatureFlagItem }> {
  try {
    const key = flag.key.trim().toLowerCase();
    if (!key || !/^[a-z0-9_]+$/.test(key)) {
      return { ok: false, error: "Flag key must be lower_snake_case containing only alphanumeric characters and underscores." };
    }

    const existingFlags = await fetchFeatureFlags("ALL");
    if (existingFlags.some((f) => f.key === key)) {
      return { ok: false, error: `Feature flag key '${key}' already exists.` };
    }

    if (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
      return { ok: false, error: "Rollout percentage must be between 0 and 100." };
    }

    const now = new Date().toISOString();
    const newFlagItem: FeatureFlagItem = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key,
      name: flag.name.trim(),
      description: flag.description?.trim() || "",
      category: flag.category || "System",
      status: flag.status || "DISABLED",
      environment: flag.environment || "production",
      rolloutPercentage: flag.rolloutPercentage ?? 100,
      riskLevel: flag.riskLevel || "LOW",
      isHighImpact: flag.isHighImpact ?? false,
      targetScope: flag.targetScope || "ALL USERS",
      targetCampusIds: flag.targetCampusIds || [],
      targetVendorIds: flag.targetVendorIds || [],
      targetUserIds: flag.targetUserIds || [],
      scheduleEnableAt: flag.scheduleEnableAt || null,
      scheduleDisableAt: flag.scheduleDisableAt || null,
      createdAt: now,
      updatedAt: now,
      updatedBy: adminId,
      updatedByName: "Super Admin",
    };

    inMemoryFeatureFlags.unshift(newFlagItem);

    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("superadmin_feature_flags").insert({
        key,
        name: newFlagItem.name,
        description: newFlagItem.description,
        category: newFlagItem.category,
        status: newFlagItem.status,
        environment: newFlagItem.environment,
        rollout_percentage: newFlagItem.rolloutPercentage,
        risk_level: newFlagItem.riskLevel,
        is_high_impact: newFlagItem.isHighImpact,
        target_scope: newFlagItem.targetScope,
        target_campus_ids: newFlagItem.targetCampusIds,
        target_vendor_ids: newFlagItem.targetVendorIds,
        target_user_ids: newFlagItem.targetUserIds,
        schedule_enable_at: newFlagItem.scheduleEnableAt,
        schedule_disable_at: newFlagItem.scheduleDisableAt,
        created_at: now,
        updated_at: now,
        updated_by: adminId,
      });
    } catch {
      // Fallback
    }

    await recordSuperAdminAction({
      adminId,
      action: "feature_flag_created",
      module: "System",
      targetType: "SYSTEM",
      targetId: key,
      severity: newFlagItem.isHighImpact ? "HIGH" : "LOW",
      newState: { status: newFlagItem.status, rolloutPercentage: newFlagItem.rolloutPercentage },
      reason: `Created feature flag '${key}'`,
      metadata: { name: newFlagItem.name, category: newFlagItem.category },
    });

    return { ok: true, flagItem: newFlagItem };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to create feature flag." };
  }
}

/**
 * Update an existing Feature Flag with validation and audit trail.
 */
export async function updateFeatureFlag({
  adminId,
  flagKey,
  updates,
  reason,
}: {
  adminId: string;
  flagKey: string;
  updates: Partial<FeatureFlagItem>;
  reason?: string;
}): Promise<{ ok: boolean; error?: string; flagItem?: FeatureFlagItem }> {
  try {
    const flags = await fetchFeatureFlags("ALL");
    const existing = flags.find((f) => f.key === flagKey);

    if (!existing) {
      return { ok: false, error: `Feature flag '${flagKey}' not found.` };
    }

    if (existing.isHighImpact && !reason?.trim()) {
      return { ok: false, error: "A mandatory explanation reason is required when updating high-impact feature flags." };
    }

    if (updates.rolloutPercentage !== undefined && (updates.rolloutPercentage < 0 || updates.rolloutPercentage > 100)) {
      return { ok: false, error: "Rollout percentage must be between 0 and 100." };
    }

    const now = new Date().toISOString();
    const updatedFlag: FeatureFlagItem = {
      ...existing,
      ...updates,
      updatedAt: now,
      updatedBy: adminId,
      updatedByName: "Super Admin",
    };

    const idx = inMemoryFeatureFlags.findIndex((f) => f.key === flagKey);
    if (idx !== -1) {
      inMemoryFeatureFlags[idx] = updatedFlag;
    }

    try {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from("superadmin_feature_flags")
        .update({
          name: updatedFlag.name,
          description: updatedFlag.description,
          category: updatedFlag.category,
          status: updatedFlag.status,
          environment: updatedFlag.environment,
          rollout_percentage: updatedFlag.rolloutPercentage,
          risk_level: updatedFlag.riskLevel,
          is_high_impact: updatedFlag.isHighImpact,
          target_scope: updatedFlag.targetScope,
          target_campus_ids: updatedFlag.targetCampusIds,
          target_vendor_ids: updatedFlag.targetVendorIds,
          target_user_ids: updatedFlag.targetUserIds,
          schedule_enable_at: updatedFlag.scheduleEnableAt,
          schedule_disable_at: updatedFlag.scheduleDisableAt,
          updated_at: now,
          updated_by: adminId,
        })
        .eq("key", flagKey);
    } catch {
      // Fallback
    }

    let auditAction = "feature_flag_updated";
    if (updates.status === "ENABLED") auditAction = "feature_flag_enabled";
    if (updates.status === "DISABLED") auditAction = "feature_flag_disabled";
    if (updates.rolloutPercentage !== undefined) auditAction = "feature_flag_rollout_changed";

    await recordSuperAdminAction({
      adminId,
      action: auditAction,
      module: "System",
      targetType: "SYSTEM",
      targetId: flagKey,
      severity: existing.isHighImpact ? "HIGH" : "MEDIUM",
      previousState: { status: existing.status, rolloutPercentage: existing.rolloutPercentage },
      newState: { status: updatedFlag.status, rolloutPercentage: updatedFlag.rolloutPercentage },
      reason: reason ?? `Updated feature flag ${flagKey}`,
      metadata: { category: existing.category, environment: existing.environment },
    });

    return { ok: true, flagItem: updatedFlag };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to update feature flag." };
  }
}

/**
 * Emergency Kill Switch: Instantly disables feature flag across production and logs CRITICAL audit entry.
 */
export async function triggerEmergencyKillSwitch({
  adminId,
  flagKey,
  reason,
}: {
  adminId: string;
  flagKey: string;
  reason: string;
}): Promise<{ ok: boolean; error?: string; flagItem?: FeatureFlagItem }> {
  if (!reason?.trim()) {
    return { ok: false, error: "A reason explanation is mandatory when triggering an Emergency Kill Switch." };
  }

  const result = await updateFeatureFlag({
    adminId,
    flagKey,
    updates: { status: "DISABLED", rolloutPercentage: 0 },
    reason: `[EMERGENCY KILL SWITCH]: ${reason.trim()}`,
  });

  if (result.ok) {
    await recordSuperAdminAction({
      adminId,
      action: "feature_flag_kill_switch",
      module: "System",
      targetType: "SYSTEM",
      targetId: flagKey,
      severity: "CRITICAL",
      reason: `EMERGENCY KILL SWITCH: ${reason}`,
    });
  }

  return result;
}

/**
 * Rollback Feature Flag to a previous configuration snapshot.
 */
export async function rollbackFeatureFlag({
  adminId,
  flagKey,
  targetState,
  reason,
}: {
  adminId: string;
  flagKey: string;
  targetState: Partial<FeatureFlagItem>;
  reason: string;
}): Promise<{ ok: boolean; error?: string; flagItem?: FeatureFlagItem }> {
  if (!reason?.trim()) {
    return { ok: false, error: "A reason is mandatory when executing a feature flag rollback." };
  }

  return updateFeatureFlag({
    adminId,
    flagKey,
    updates: targetState,
    reason: `[ROLLBACK]: ${reason.trim()}`,
  });
}
