import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isFcmV1Configured, sendFcmV1Message } from "@/lib/notifications/fcm_v1";

export interface SendStudentOrderPushParams {
  userId: string;
  orderId: string;
  orderNumber: string;
  type: "ORDER_PREPARING" | "ORDER_READY" | "ORDER_PICKED_UP" | "ORDER_COMPLETED";
  title: string;
  body: string;
}

const ORDERS_CHANNEL_ID = "grabit_orders_channel_v1";

/**
 * Server-side push dispatcher for student order-status updates, via FCM
 * HTTP v1 (see lib/notifications/fcm_v1.ts) — not the deprecated legacy
 * FCM server-key API. Always called AFTER createStudentNotification has
 * already deduped the underlying event — this function does not re-check
 * idempotency itself, it only fans a single logical notification out to
 * the student's active devices.
 *
 * Completely failsafe: never throws, so an order-status update can never
 * fail because a push notification couldn't be delivered. The
 * student_notifications row created earlier is the source of truth
 * regardless of whether this succeeds.
 */
export async function sendStudentOrderPushNotification(
  params: SendStudentOrderPushParams,
): Promise<{ success: boolean; dispatchedCount: number }> {
  try {
    if (!isFcmV1Configured()) {
      // FCM_SERVICE_ACCOUNT_JSON not set — Firebase Android transport not
      // wired up yet. Never treat this as an error.
      return { success: true, dispatchedCount: 0 };
    }

    const supabase = getSupabaseAdminClient();
    const { data: tokens, error } = await supabase
      .from("student_device_tokens")
      .select("id, token")
      .eq("user_id", params.userId)
      .eq("is_active", true);

    if (error || !tokens || tokens.length === 0) {
      return { success: true, dispatchedCount: 0 };
    }

    const results = await Promise.allSettled(
      tokens.map(async ({ id, token }) => {
        const result = await sendFcmV1Message({
          token,
          title: params.title,
          body: params.body,
          channelId: ORDERS_CHANNEL_ID,
          data: {
            type: params.type,
            orderId: params.orderId,
            orderNumber: params.orderNumber,
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
