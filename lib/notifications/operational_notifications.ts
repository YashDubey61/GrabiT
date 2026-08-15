import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";

export type VendorOperationalNotificationType =
  | "NEW_ORDER"
  | "ORDER_AGING"
  | "ORDER_SLA_BREACH"
  | "ORDER_READY_PENDING_HANDOVER"
  | "HIGH_PENDING_BACKLOG"
  | "MENU_ITEM_OUT_OF_STOCK"
  | "POPULAR_ITEM_OUT_OF_STOCK"
  | "LOW_MENU_AVAILABILITY"
  | "PAYMENT_ISSUE"
  | "PAYOUT_SETTLED"
  | "PAYOUT_PENDING"
  | "SALES_SPIKE"
  | "SALES_DROP"
  | "PEAK_HOUR_APPROACHING"
  | "VENDOR_PERFORMANCE_WARNING"
  | "VENDOR_PERFORMANCE_IMPROVED";

export type AdminOperationalNotificationType =
  | "PLATFORM_PAYMENT_FAILURE"
  | "WEBHOOK_FAILURE"
  | "HIGH_ORDER_BACKLOG"
  | "VENDOR_SLA_BREACH"
  | "CAMPUS_OPERATIONAL_RISK"
  | "WALLET_ANOMALY"
  | "RECONCILIATION_FAILURE"
  | "VENDOR_PERFORMANCE_RISK"
  | "GMV_DROP"
  | "GMV_SPIKE"
  | "GOLD_REVENUE_CHANGE"
  | "SYSTEM_HEALTH_WARNING"
  | "NEW_VENDOR_APPROVAL"
  | "CAMPUS_STATUS_CHANGE";

export type OperationalNotificationType =
  | VendorOperationalNotificationType
  | AdminOperationalNotificationType;

export interface OperationalNotificationItem {
  id: string;
  recipientType: "vendor" | "admin";
  recipientUserId?: string | null;
  canteenId?: string | null;
  campusId?: string | null;
  type: OperationalNotificationType;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  actionUrl?: string | null;
  relatedOrderId?: string | null;
  relatedMenuItemId?: string | null;
  relatedCanteenId?: string | null;
  dedupeKey?: string | null;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export interface CreateOperationalNotificationParams {
  recipientType: "vendor" | "admin";
  recipientUserId?: string | null;
  canteenId?: string | null;
  campusId?: string | null;
  type: OperationalNotificationType;
  severity: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  actionUrl?: string | null;
  relatedOrderId?: string | null;
  relatedMenuItemId?: string | null;
  relatedCanteenId?: string | null;
  dedupeKey?: string | null;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

/**
 * Server-side service helper to create operational notifications.
 * Non-blocking & fail-safe: wraps inserts in try/catch to guarantee core operations NEVER fail.
 */
export async function createOperationalNotification(
  params: CreateOperationalNotificationParams,
): Promise<{ success: boolean; id?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Deduplication Key Check
    if (params.dedupeKey) {
      const { data: existing } = await supabase
        .from("operational_notifications")
        .select("id, status")
        .eq("dedupe_key", params.dedupeKey)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, id: existing[0].id };
      }
    }

    // 2. Anti-Noise Hourly Limit for Vendors (Max 5 non-critical alerts/hour)
    if (params.recipientType === "vendor" && params.canteenId && params.severity !== "CRITICAL") {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("operational_notifications")
        .select("id", { count: "exact", head: true })
        .eq("canteen_id", params.canteenId)
        .gte("created_at", oneHourAgo);

      if (count && count >= 5) {
        return { success: false };
      }
    }

    // 3. Insert Operational Notification
    const { data: inserted, error } = await supabase
      .from("operational_notifications")
      .insert({
        recipient_type: params.recipientType,
        recipient_user_id: params.recipientUserId ?? null,
        canteen_id: params.canteenId ?? null,
        campus_id: params.campusId ?? null,
        type: params.type,
        severity: params.severity,
        title: params.title,
        message: params.message,
        action_url: params.actionUrl ?? null,
        related_order_id: params.relatedOrderId ?? null,
        related_menu_item_id: params.relatedMenuItemId ?? null,
        related_canteen_id: params.relatedCanteenId ?? null,
        dedupe_key: params.dedupeKey ?? null,
        status: "OPEN",
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Could not insert operational notification (safe warning):", error.message);
      return { success: false };
    }

    return { success: true, id: inserted.id };
  } catch (err) {
    console.warn("Error in createOperationalNotification (handled gracefully):", err);
    return { success: false };
  }
}

/**
 * Automatically resolves open operational alerts matching a dedupeKey prefix or exact key when conditions normalize.
 */
export async function autoResolveOperationalNotification(dedupeKey: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("operational_notifications")
      .update({
        status: "RESOLVED",
        resolved_at: new Date().toISOString(),
      })
      .eq("dedupe_key", dedupeKey)
      .eq("status", "OPEN");

    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches vendor operational notifications for the authorized canteen.
 */
export async function getVendorOperationalNotifications(): Promise<{
  notifications: OperationalNotificationItem[];
  openCount: number;
}> {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return { notifications: [], openCount: 0 };
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("operational_notifications")
    .select("*")
    .eq("recipient_type", "vendor")
    .eq("canteen_id", vendorCtx.canteenId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rawList = data ?? [];
  let openCount = 0;

  const notifications: OperationalNotificationItem[] = rawList.map((n) => {
    if (n.status === "OPEN") openCount++;
    return {
      id: n.id,
      recipientType: n.recipient_type as "vendor" | "admin",
      recipientUserId: n.recipient_user_id,
      canteenId: n.canteen_id,
      campusId: n.campus_id,
      type: n.type as OperationalNotificationType,
      severity: (n.severity as "INFO" | "WARNING" | "CRITICAL") || "INFO",
      title: n.title,
      message: n.message,
      actionUrl: n.action_url,
      relatedOrderId: n.related_order_id,
      relatedMenuItemId: n.related_menu_item_id,
      relatedCanteenId: n.related_canteen_id,
      dedupeKey: n.dedupe_key,
      status: (n.status as "OPEN" | "ACKNOWLEDGED" | "RESOLVED") || "OPEN",
      acknowledgedAt: n.acknowledged_at,
      acknowledgedBy: n.acknowledged_by,
      resolvedAt: n.resolved_at,
      resolvedBy: n.resolved_by,
      createdAt: n.created_at,
      expiresAt: n.expires_at,
    };
  });

  return { notifications, openCount };
}

/**
 * Acknowledges an operational notification (Vendor or Super Admin).
 */
export async function acknowledgeOperationalNotification(
  notificationId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const vendorCtx = await getAuthenticatedVendorContext();
  const adminCtx = await getAuthenticatedSuperAdminContext();

  const userId = vendorCtx?.userId || adminCtx?.user?.id;
  if (!userId) return false;

  let query = supabase.from("operational_notifications").update({
    status: "ACKNOWLEDGED",
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId,
  }).eq("id", notificationId);

  if (vendorCtx) {
    query = query.eq("canteen_id", vendorCtx.canteenId);
  }

  const { error } = await query;
  return !error;
}

/**
 * Resolves an operational notification.
 */
export async function resolveOperationalNotification(
  notificationId: string,
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const vendorCtx = await getAuthenticatedVendorContext();
  const adminCtx = await getAuthenticatedSuperAdminContext();

  const userId = vendorCtx?.userId || adminCtx?.user?.id;
  if (!userId) return false;

  let query = supabase.from("operational_notifications").update({
    status: "RESOLVED",
    resolved_at: new Date().toISOString(),
    resolved_by: userId,
  }).eq("id", notificationId);

  if (vendorCtx) {
    query = query.eq("canteen_id", vendorCtx.canteenId);
  }

  const { error } = await query;
  return !error;
}
