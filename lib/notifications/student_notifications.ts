import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type StudentNotificationType =
  | "ORDER_PLACED"
  | "ORDER_PREPARING"
  | "ORDER_READY"
  | "ORDER_PICKED_UP"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "WALLET_TOPUP"
  | "WALLET_LOW_BALANCE"
  | "GOLD_ACTIVATED"
  | "GOLD_EXPIRING"
  | "RECOMMENDATION_AVAILABLE"
  | "CAMPUS_ANNOUNCEMENT"
  | "POINTS_EARNED"
  | "POINTS_REDEEMED"
  | "POINTS_RECEIVED"
  | "POINTS_SENT"
  | "FOOD_GIFT_RECEIVED"
  | "REWARD_GIFT_RECEIVED"
  | "LEADERBOARD_MILESTONE"
  | "GIFT_BONUS_EARNED"
  | "REWARD_CODE_USED";

export interface StudentNotificationItem {
  id: string;
  userId: string;
  type: StudentNotificationType;
  title: string;
  message: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "URGENT";
  category: "ORDERS" | "PAYMENTS" | "WALLET" | "GOLD" | "RECOMMENDATIONS" | "GENERAL" | "REWARDS";
  relatedOrderId?: string | null;
  relatedMenuItemId?: string | null;
  relatedSubscriptionId?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
  dedupeKey?: string | null;
}

export interface StudentNotificationPreferences {
  userId: string;
  orderUpdatesEnabled: boolean;
  paymentUpdatesEnabled: boolean;
  walletUpdatesEnabled: boolean;
  goldUpdatesEnabled: boolean;
  recommendationUpdatesEnabled: boolean;
  marketingEnabled: boolean;
}

export interface CreateStudentNotificationParams {
  userId: string;
  type: StudentNotificationType;
  title: string;
  message: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "URGENT";
  category: "ORDERS" | "PAYMENTS" | "WALLET" | "GOLD" | "RECOMMENDATIONS" | "GENERAL" | "REWARDS";
  relatedOrderId?: string | null;
  relatedMenuItemId?: string | null;
  relatedSubscriptionId?: string | null;
  actionUrl?: string | null;
  dedupeKey?: string | null;
}

/**
 * Server-side helper to safely dispatch a student notification.
 * Non-blocking & fail-safe: wraps inserts in try/catch to guarantee notification failures NEVER disrupt core flows.
 */
export async function createStudentNotification(
  params: CreateStudentNotificationParams,
): Promise<{ success: boolean; id?: string }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Check deduplication key if provided
    if (params.dedupeKey) {
      const { data: existing } = await supabase
        .from("student_notifications")
        .select("id")
        .eq("dedupe_key", params.dedupeKey)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: true, id: existing[0].id };
      }
    }

    // 2. Check student preferences
    const { data: prefs } = await supabase
      .from("student_notification_preferences")
      .select("*")
      .eq("user_id", params.userId)
      .single();

    if (prefs) {
      if (params.category === "ORDERS" && !prefs.order_updates_enabled) return { success: false };
      if (params.category === "PAYMENTS" && !prefs.payment_updates_enabled) return { success: false };
      if (params.category === "WALLET" && !prefs.wallet_updates_enabled) return { success: false };
      if (params.category === "GOLD" && !prefs.gold_updates_enabled) return { success: false };
      if (params.category === "RECOMMENDATIONS" && !prefs.recommendation_updates_enabled) return { success: false };
    }

    // 3. Enforce anti-spam daily cap (max 1 non-transactional notification per day)
    if (params.category === "RECOMMENDATIONS" || params.category === "GENERAL") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("student_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", params.userId)
        .in("category", ["RECOMMENDATIONS", "GENERAL"])
        .gte("created_at", todayStart.toISOString());

      if (count && count >= 1) {
        return { success: false };
      }
    }

    // 4. Insert Notification
    const { data: inserted, error } = await supabase
      .from("student_notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        severity: params.severity ?? "INFO",
        category: params.category,
        related_order_id: params.relatedOrderId ?? null,
        related_menu_item_id: params.relatedMenuItemId ?? null,
        related_subscription_id: params.relatedSubscriptionId ?? null,
        action_url: params.actionUrl ?? null,
        dedupe_key: params.dedupeKey ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Could not insert student notification (safe warning):", error.message);
      return { success: false };
    }

    return { success: true, id: inserted.id };
  } catch (err) {
    console.warn("Error dispatched in createStudentNotification (handled gracefully):", err);
    return { success: false };
  }
}

/**
 * Fetches authenticated student notifications & unread count.
 */
export async function getStudentNotifications(): Promise<{
  notifications: StudentNotificationItem[];
  unreadCount: number;
}> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data } = await supabase
    .from("student_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rawList = data ?? [];
  let unreadCount = 0;

  const notifications: StudentNotificationItem[] = rawList.map((n) => {
    if (!n.read_at) unreadCount++;
    return {
      id: n.id,
      userId: n.user_id,
      type: n.type as StudentNotificationType,
      title: n.title,
      message: n.message,
      severity: (n.severity as "INFO" | "SUCCESS" | "WARNING" | "URGENT") || "INFO",
      category: (n.category as "ORDERS" | "PAYMENTS" | "WALLET" | "GOLD" | "RECOMMENDATIONS" | "GENERAL" | "REWARDS") || "GENERAL",
      relatedOrderId: n.related_order_id,
      relatedMenuItemId: n.related_menu_item_id,
      relatedSubscriptionId: n.related_subscription_id,
      actionUrl: n.action_url,
      readAt: n.read_at,
      createdAt: n.created_at,
      dedupeKey: n.dedupe_key,
    };
  });

  return { notifications, unreadCount };
}
