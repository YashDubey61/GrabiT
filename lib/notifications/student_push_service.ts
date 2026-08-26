import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isFcmV1Configured, sendFcmV1Message } from "@/lib/notifications/fcm_v1";

export interface SendStudentOrderPushParams {
  userId: string;
  orderId?: string;
  orderNumber?: string;
  type:
    | "ORDER_PLACED"
    | "ORDER_PREPARING"
    | "ORDER_READY"
    | "ORDER_PICKED_UP"
    | "ORDER_COMPLETED"
    | "ORDER_CANCELLED"
    | "ADMIN_MESSAGE"
    | "CAMPUS_ANNOUNCEMENT";
  title: string;
  body: string;
  actionUrl?: string;
}

export interface SendBatchPushParams {
  userIds: string[];
  type?: string;
  title: string;
  body: string;
  actionUrl?: string;
}

const ORDERS_CHANNEL_ID = "grabit_orders_channel_v1";

/**
 * Server-side push dispatcher for student order-status updates, via FCM
 * HTTP v1 (see lib/notifications/fcm_v1.ts).
 *
 * Completely failsafe: never throws, so an order-status update can never
 * fail because a push notification couldn't be delivered.
 */
export async function sendStudentOrderPushNotification(
  params: SendStudentOrderPushParams,
): Promise<{ success: boolean; dispatchedCount: number }> {
  try {
    if (!isFcmV1Configured()) {
      return { success: true, dispatchedCount: 0 };
    }

    const supabase = getSupabaseAdminClient();
    const { data: tokens, error } = await supabase
      .from("student_device_tokens")
      .select("id, token")
      .eq("user_id", params.userId)
      .eq("is_active", true)
      .order("last_active_at", { ascending: false });

    if (error || !tokens || tokens.length === 0) {
      return { success: true, dispatchedCount: 0 };
    }

    // Deduplicate in-memory by token string to guarantee no physical device receives duplicates
    const uniqueTokens = Array.from(new Map(tokens.map((t) => [t.token, t])).values());

    console.info(
      `[student-push] Dispatching order push: type=${params.type}, orderId=${params.orderId ?? "none"}, studentId=${params.userId.slice(0, 8)}..., activeTokens=${uniqueTokens.length}`,
    );

    const results = await Promise.allSettled(
      uniqueTokens.map(async ({ id, token }) => {
        const result = await sendFcmV1Message({
          token,
          title: params.title,
          body: params.body,
          channelId: ORDERS_CHANNEL_ID,
          data: {
            type: params.type,
            orderId: params.orderId || "",
            orderNumber: params.orderNumber || "",
            actionUrl: params.actionUrl || (params.orderId ? `/customer/orders/${params.orderId}` : "/customer/notifications"),
            title: params.title,
            body: params.body,
            timestamp: new Date().toISOString(),
          },
        });

        if (!result.ok) {
          if (result.tokenInvalid) {
            await supabase
              .from("student_device_tokens")
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq("id", id);
          } else {
            console.warn("[student-push] FCM send error:", result.error);
          }
          throw new Error(result.error);
        }
      }),
    );

    const dispatchedCount = results.filter((r) => r.status === "fulfilled").length;
    return { success: true, dispatchedCount };
  } catch (err) {
    console.warn("[student-push] Error dispatching push notification:", err);
    return { success: false, dispatchedCount: 0 };
  }
}

/**
 * Server-side batch dispatcher for student push notifications (e.g. Super Admin broadcasts).
 * Fans out FCM messages to all active device tokens of the targeted users.
 */
export async function sendStudentBatchPushNotification(
  params: SendBatchPushParams,
): Promise<{ success: boolean; totalTokens: number; dispatchedCount: number; failedCount: number }> {
  try {
    const uniqueUserIds = Array.from(new Set(params.userIds));
    if (!isFcmV1Configured() || uniqueUserIds.length === 0) {
      return { success: true, totalTokens: 0, dispatchedCount: 0, failedCount: 0 };
    }

    const supabase = getSupabaseAdminClient();
    const { data: tokens, error } = await supabase
      .from("student_device_tokens")
      .select("id, user_id, token")
      .in("user_id", uniqueUserIds)
      .eq("is_active", true)
      .order("last_active_at", { ascending: false });

    if (error || !tokens || tokens.length === 0) {
      return { success: true, totalTokens: 0, dispatchedCount: 0, failedCount: 0 };
    }

    // Deduplicate tokens array by token string so no device is messaged more than once in batch
    const uniqueTokens = Array.from(new Map(tokens.map((t) => [t.token, t])).values());

    console.info(
      `[student-push] Dispatching batch push: type=${params.type ?? "ADMIN_MESSAGE"}, uniqueUsers=${uniqueUserIds.length}, activeTokens=${uniqueTokens.length}`,
    );

    const results = await Promise.allSettled(
      uniqueTokens.map(async ({ id, token }) => {
        const result = await sendFcmV1Message({
          token,
          title: params.title,
          body: params.body,
          channelId: ORDERS_CHANNEL_ID,
          data: {
            type: params.type || "ADMIN_MESSAGE",
            actionUrl: params.actionUrl || "/customer/notifications",
            title: params.title,
            body: params.body,
            timestamp: new Date().toISOString(),
          },
        });

        if (!result.ok) {
          if (result.tokenInvalid) {
            await supabase
              .from("student_device_tokens")
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq("id", id);
          }
          throw new Error(result.error);
        }
      }),
    );

    const dispatchedCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;

    return {
      success: true,
      totalTokens: uniqueTokens.length,
      dispatchedCount,
      failedCount,
    };
  } catch (err) {
    console.warn("[student-push] Error dispatching batch push notifications:", err);
    return { success: false, totalTokens: 0, dispatchedCount: 0, failedCount: 0 };
  }
}
