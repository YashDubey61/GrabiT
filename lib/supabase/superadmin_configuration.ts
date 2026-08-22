import { recordSuperAdminAction } from "./superadmin_audit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type ConfigCategory =
  | "GENERAL"
  | "ORDERS"
  | "VENDOR"
  | "OFFERS"
  | "PAYMENTS"
  | "REFUNDS"
  | "NOTIFICATIONS";

export type ValueType = "integer" | "decimal" | "boolean" | "string" | "enum" | "json";

export interface PlatformConfigItem {
  key: string;
  value: any;
  category: ConfigCategory;
  description: string;
  valueType: ValueType;
  isActive: boolean;
  isHighImpact: boolean;
  impactWarning?: string | null;
  usedByModules?: string[];
  updatedAt: string;
  updatedBy?: string | null;
  updatedByName?: string | null;
}

export interface ConfigOverviewStats {
  activeConfigs: number;
  recentlyUpdated: number;
  pendingChanges: number;
  categoriesCount: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// In-memory fallback configuration dataset for demonstration & testing
const inMemoryConfigs: PlatformConfigItem[] = [
  // GENERAL
  {
    key: "general_platform_name",
    value: "GRABIT Campus Canteen OS",
    category: "GENERAL",
    description: "Official platform brand name displayed across student and vendor applications",
    valueType: "string",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Student App", "Vendor OS", "Super Admin"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "general_default_timezone",
    value: "Asia/Kolkata",
    category: "GENERAL",
    description: "Default system timezone for settlements, orders, and timestamps",
    valueType: "string",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Settlements", "Workflows", "Incidents"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "general_default_currency",
    value: "INR",
    category: "GENERAL",
    description: "Default ISO currency code for all financial transactions",
    valueType: "string",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Payments", "Payouts", "Wallet"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "general_maintenance_mode",
    value: false,
    category: "GENERAL",
    description: "Platform-wide maintenance mode toggle to block new order placement",
    valueType: "boolean",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Enabling maintenance mode prevents students from placing new canteen orders across all campuses.",
    usedByModules: ["Checkout", "Student App"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // ORDERS
  {
    key: "orders_min_order_value",
    value: 0.0,
    category: "ORDERS",
    description: "Minimum order total required for student checkout (₹)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Checkout", "Student Orders"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "orders_max_order_value",
    value: 5000.0,
    category: "ORDERS",
    description: "Maximum allowed single order transaction total (₹)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Restricts high-value single order placements to mitigate risk.",
    usedByModules: ["Checkout", "Fraud & Risk"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "orders_timeout_minutes",
    value: 15,
    category: "ORDERS",
    description: "Unpaid or unaccepted order expiration timeout in minutes",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Vendor Orders", "Order Lifecycle"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "orders_default_prep_time",
    value: 15,
    category: "ORDERS",
    description: "Default food preparation estimate shown to students (minutes)",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Live Tracking", "Vendor OS"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "orders_cancellation_window_mins",
    value: 2,
    category: "ORDERS",
    description: "Student order cancellation grace period after placement (minutes)",
    valueType: "integer",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Changing cancellation window impacts student cancellation refund rights and vendor prep workflows.",
    usedByModules: ["Student Orders", "Refund Logic", "Vendor OS"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "orders_max_active_orders_per_vendor",
    value: 50,
    category: "ORDERS",
    description: "Maximum concurrent active orders allowed per canteen kitchen",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Vendor Queue", "Order Placement"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // VENDOR
  {
    key: "vendor_default_commission_percent",
    value: 7.0,
    category: "VENDOR",
    description: "Default platform commission rate applied to vendor gross revenue (%)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Vendor earnings and daily settlement calculations will change for future transactions.",
    usedByModules: ["Vendor Settlements", "Vendor Payouts", "Financial Ledger"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "vendor_activation_auto_approve",
    value: false,
    category: "VENDOR",
    description: "Automatically approve new vendor onboarding applications without manual KYC review",
    valueType: "boolean",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Bypassing manual KYC review increases risk of unverified vendors onboarding.",
    usedByModules: ["Vendor Approvals", "KYC Center"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "vendor_default_operating_status",
    value: "active",
    category: "VENDOR",
    description: "Default operational status assigned to approved vendor canteens",
    valueType: "enum",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Vendor Oversight", "Campus Discovery"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 100).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "vendor_settlement_schedule_time",
    value: "18:00 IST",
    category: "VENDOR",
    description: "Daily vendor settlement cut-off time (e.g. 18:00 IST)",
    valueType: "string",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Modifies automated daily 6 PM IST settlement batch trigger window.",
    usedByModules: ["Vendor Settlements", "Telegram Bot", "Payouts"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // OFFERS
  {
    key: "offers_max_discount_percent",
    value: 50.0,
    category: "OFFERS",
    description: "Maximum promotional discount percentage allowed per coupon code (%)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Controls maximum discount cap on checkout promotions.",
    usedByModules: ["Promo Codes", "Checkout"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "offers_max_discount_amount",
    value: 100.0,
    category: "OFFERS",
    description: "Maximum monetary discount cap per promotional order (₹)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Controls maximum rupee discount cap on checkout promotions.",
    usedByModules: ["Promo Codes", "Checkout"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "offers_coupon_usage_limit_per_user",
    value: 5,
    category: "OFFERS",
    description: "Maximum lifetime redemptions per promo code per student",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Promo Codes", "Rewards Engine"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 30).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "offers_min_order_for_coupon",
    value: 99.0,
    category: "OFFERS",
    description: "Minimum cart total required to apply promo codes (₹)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Checkout", "Promo Codes"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 40).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // PAYMENTS
  {
    key: "payments_timeout_seconds",
    value: 300,
    category: "PAYMENTS",
    description: "Online payment gateway session expiration timeout (seconds)",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Cashfree Payments", "Razorpay"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 16).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "payments_allowed_methods",
    value: ["upi", "wallet", "razorpay", "cashfree"],
    category: "PAYMENTS",
    description: "Allowed payment gateway and wallet transaction methods",
    valueType: "json",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Disabling payment methods impacts student payment options at checkout.",
    usedByModules: ["Checkout", "Payments Center"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 25).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "payments_retry_limit",
    value: 3,
    category: "PAYMENTS",
    description: "Maximum payment verification retry attempts before marking failed",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Payment Reconciler", "Cashfree Webhooks"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // REFUNDS
  {
    key: "refunds_max_refund_window_days",
    value: 7,
    category: "REFUNDS",
    description: "Maximum timeframe after order completion to file a dispute & refund (days)",
    valueType: "integer",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Determines dispute eligibility window for past student orders.",
    usedByModules: ["Dispute Center", "Refund Engine"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "refunds_approval_required_above",
    value: 500.0,
    category: "REFUNDS",
    description: "Refund amounts above this threshold require manual Super Admin approval (₹)",
    valueType: "decimal",
    isActive: true,
    isHighImpact: true,
    impactWarning: "Controls automatic vs manual approval escalation threshold for refunds.",
    usedByModules: ["Dispute Center", "Financial Approvals"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 15).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "refunds_allow_partial_refunds",
    value: true,
    category: "REFUNDS",
    description: "Allow processing partial item refunds for incomplete order fulfillment",
    valueType: "boolean",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Dispute Center", "Wallet Refunds"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 60).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },

  // NOTIFICATIONS
  {
    key: "notifications_order_alerts_enabled",
    value: true,
    category: "NOTIFICATIONS",
    description: "Enable real-time push and web notifications for order status transitions",
    valueType: "boolean",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Student Notifications", "Vendor Notifications"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 22).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "notifications_vendor_sms_enabled",
    value: true,
    category: "NOTIFICATIONS",
    description: "Enable SMS alerts to vendors for urgent order cancellations",
    valueType: "boolean",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Operational Notifications", "Vendor OS"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 35).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "notifications_student_push_enabled",
    value: true,
    category: "NOTIFICATIONS",
    description: "Enable student mobile push notifications for food ready alerts",
    valueType: "boolean",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Student App", "Push Engine"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 45).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
  {
    key: "notifications_retry_limit",
    value: 3,
    category: "NOTIFICATIONS",
    description: "Maximum push notification delivery retries on gateway failure",
    valueType: "integer",
    isActive: true,
    isHighImpact: false,
    usedByModules: ["Notification Service"],
    updatedAt: new Date(Date.now() - 3600 * 1000 * 90).toISOString(),
    updatedBy: "admin_super_01",
    updatedByName: "Super Admin",
  },
];

/**
 * Server-side validation of configuration values based on valueType and business rules.
 */
export function validateConfigValue(
  key: string,
  newValue: any,
  valueType: ValueType
): { valid: boolean; error?: string; parsedValue?: any } {
  // Security Guard: Prohibit modifying keys containing secret keywords or authorization rules
  const forbiddenKeywords = ["secret", "token", "password", "service_role", "api_key", "jwt", "auth_key"];
  const lowerKey = key.toLowerCase();
  if (forbiddenKeywords.some((f) => lowerKey.includes(f))) {
    return { valid: false, error: "Security Guard: API keys and secrets cannot be modified via Platform Configuration." };
  }

  if (newValue === undefined || newValue === null) {
    return { valid: false, error: "Configuration value cannot be null or undefined." };
  }

  let parsed = newValue;

  if (valueType === "integer") {
    parsed = typeof newValue === "number" ? newValue : parseInt(String(newValue), 10);
    if (!Number.isInteger(parsed) || isNaN(parsed)) {
      return { valid: false, error: `Invalid integer value for setting '${key}'.` };
    }
    // Business rules: negative prep times or timeouts are invalid
    if (key.includes("prep_time") || key.includes("timeout") || key.includes("window") || key.includes("limit")) {
      if (parsed < 0) {
        return { valid: false, error: `Setting '${key}' must be a non-negative integer.` };
      }
    }
  } else if (valueType === "decimal") {
    parsed = typeof newValue === "number" ? newValue : parseFloat(String(newValue));
    if (!Number.isFinite(parsed) || isNaN(parsed)) {
      return { valid: false, error: `Invalid decimal number for setting '${key}'.` };
    }
    // Business rules: Commission percentage must be between 0 and 100
    if (key.includes("commission") || key.includes("percent")) {
      if (parsed < 0 || parsed > 100) {
        return { valid: false, error: "Commission percentage must be between 0% and 100%." };
      }
    }
    if (key.includes("min_order") || key.includes("max_discount_amount") || key.includes("threshold")) {
      if (parsed < 0) {
        return { valid: false, error: "Rupee amount settings must be non-negative." };
      }
    }
  } else if (valueType === "boolean") {
    if (typeof newValue === "boolean") {
      parsed = newValue;
    } else if (String(newValue).toLowerCase() === "true") {
      parsed = true;
    } else if (String(newValue).toLowerCase() === "false") {
      parsed = false;
    } else {
      return { valid: false, error: `Invalid boolean value for setting '${key}'. Expected true or false.` };
    }
  } else if (valueType === "enum") {
    if (key === "vendor_default_operating_status") {
      if (!["active", "paused", "closed"].includes(String(newValue))) {
        return { valid: false, error: "Invalid enum value for operating status. Allowed: 'active', 'paused', 'closed'." };
      }
    }
  } else if (valueType === "json") {
    if (typeof newValue === "string") {
      try {
        parsed = JSON.parse(newValue);
      } catch {
        return { valid: false, error: `Invalid JSON payload format for setting '${key}'.` };
      }
    }
  }

  return { valid: true, parsedValue: parsed };
}

/**
 * Fetch platform configuration items by category, search filter, or high-impact flag.
 */
export async function fetchPlatformConfigurations(
  category?: string,
  search?: string,
  isHighImpactOnly?: boolean
): Promise<PlatformConfigItem[]> {
  let dbItems: PlatformConfigItem[] = [];

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase.from("platform_settings").select("*");

    if (category && category !== "ALL") {
      query = query.eq("category", category);
    }
    if (isHighImpactOnly) {
      query = query.eq("is_high_impact", true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      dbItems = data.map((d: any) => ({
        key: d.key,
        value: d.value,
        category: d.category as ConfigCategory,
        description: d.description || "",
        valueType: (d.value_type || "json") as ValueType,
        isActive: d.is_active ?? true,
        isHighImpact: d.is_high_impact ?? false,
        impactWarning: d.impact_warning,
        usedByModules: d.used_by_modules || [],
        updatedAt: d.updated_at,
        updatedBy: d.updated_by,
        updatedByName: "Super Admin",
      }));
    }
  } catch {
    // DB fallback
  }

  let result = dbItems.length > 0 ? dbItems : [...inMemoryConfigs];

  if (category && category !== "ALL") {
    result = result.filter((item) => item.category === category);
  }
  if (isHighImpactOnly) {
    result = result.filter((item) => item.isHighImpact);
  }
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.key.toLowerCase().includes(s) ||
        item.description.toLowerCase().includes(s) ||
        item.category.toLowerCase().includes(s)
    );
  }

  return result;
}

/**
 * Fetch Overview KPI Stats for Platform Configuration Center.
 */
export async function fetchConfigurationOverviewStats(): Promise<ConfigOverviewStats> {
  const configs = await fetchPlatformConfigurations("ALL");
  const activeConfigs = configs.filter((c) => c.isActive).length;
  const categoriesCount = new Set(configs.map((c) => c.category)).size;

  const sortedByDate = [...configs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const lastUpdatedItem = sortedByDate[0];
  const startOf7DaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const recentlyUpdated = configs.filter((c) => new Date(c.updatedAt) >= startOf7DaysAgo).length;

  return {
    activeConfigs: activeConfigs || configs.length,
    recentlyUpdated,
    pendingChanges: 0,
    categoriesCount,
    lastUpdatedBy: lastUpdatedItem?.updatedByName || "Super Admin",
    lastUpdatedAt: lastUpdatedItem?.updatedAt || new Date().toISOString(),
  };
}

/**
 * Server-authoritative Platform Configuration Update with Audit Trail.
 */
export async function updatePlatformConfiguration({
  adminId,
  configKey,
  newValue,
  reason,
  isRollback = false,
}: {
  adminId: string;
  configKey: string;
  newValue: any;
  reason?: string;
  isRollback?: boolean;
}): Promise<{ ok: boolean; error?: string; configItem?: PlatformConfigItem }> {
  try {
    const allConfigs = await fetchPlatformConfigurations("ALL");
    const existing = allConfigs.find((c) => c.key === configKey);

    if (!existing) {
      return { ok: false, error: `Configuration key '${configKey}' not found.` };
    }

    // High Impact check requires mandatory reason
    if (existing.isHighImpact && !reason?.trim()) {
      return { ok: false, error: "A mandatory explanation reason is required for high-impact configuration changes." };
    }

    // Server-side type & range validation
    const valResult = validateConfigValue(configKey, newValue, existing.valueType);
    if (!valResult.valid) {
      return { ok: false, error: valResult.error };
    }

    const validatedVal = valResult.parsedValue;
    const previousVal = existing.value;
    const now = new Date().toISOString();

    // 1. Update in-memory fallback dataset
    const memIdx = inMemoryConfigs.findIndex((c) => c.key === configKey);
    if (memIdx !== -1) {
      inMemoryConfigs[memIdx] = {
        ...inMemoryConfigs[memIdx],
        value: validatedVal,
        updatedAt: now,
        updatedBy: adminId,
        updatedByName: "Super Admin",
      };
    }

    // 2. Update database table platform_settings
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("platform_settings").upsert({
        key: configKey,
        value: validatedVal,
        category: existing.category,
        description: existing.description,
        value_type: existing.valueType,
        is_active: true,
        is_high_impact: existing.isHighImpact,
        impact_warning: existing.impactWarning ?? null,
        used_by_modules: existing.usedByModules ?? [],
        updated_at: now,
        updated_by: adminId,
      });
    } catch {
      // Non-blocking side effect
    }

    // 3. Write to centralized superadmin_audit_logs table
    await recordSuperAdminAction({
      adminId,
      action: isRollback ? "platform_config_rollback" : "platform_config_updated",
      module: "System",
      targetType: "SYSTEM",
      targetId: configKey,
      severity: existing.isHighImpact ? "HIGH" : "MEDIUM",
      previousState: { value: previousVal },
      newState: { value: validatedVal },
      reason: reason ?? (isRollback ? `Restored previous configuration for ${configKey}` : `Updated ${configKey}`),
      metadata: {
        category: existing.category,
        isHighImpact: existing.isHighImpact,
        valueType: existing.valueType,
      },
    });

    return {
      ok: true,
      configItem: {
        ...existing,
        value: validatedVal,
        updatedAt: now,
        updatedBy: adminId,
        updatedByName: "Super Admin",
      },
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to update configuration." };
  }
}

/**
 * Execute configuration rollback to a previous version from audit logs.
 * NEVER modifies or deletes past audit events — records a new platform_config_rollback audit event.
 */
export async function rollbackPlatformConfiguration({
  adminId,
  configKey,
  targetValue,
  reason,
}: {
  adminId: string;
  configKey: string;
  targetValue: any;
  reason: string;
}): Promise<{ ok: boolean; error?: string; configItem?: PlatformConfigItem }> {
  if (!reason?.trim()) {
    return { ok: false, error: "A reason is mandatory when executing a configuration rollback." };
  }

  return updatePlatformConfiguration({
    adminId,
    configKey,
    newValue: targetValue,
    reason: `[ROLLBACK]: ${reason.trim()}`,
    isRollback: true,
  });
}
