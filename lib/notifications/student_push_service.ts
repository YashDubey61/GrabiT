import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface SendStudentOrderPushParams {
  userId: string;
  orderId: string;
  orderNumber: string;
  type: "ORDER_PREPARING" | "ORDER_READY" | "ORDER_PICKED_UP" | "ORDER_COMPLETED";
  title: string;
  body: string;
}

/**
 * Server-side push dispatcher for student order-status updates. Mirrors
 * lib/notifications/vendor_push_service.ts's dispatch mechanism (legacy
 * FCM HTTP send, same env var) applied to the student device registry
 * instead of the vendor one. Always called AFTER createStudentNotification
 * has already deduped the underlying event — this function does not
 * re-check idempotency itself, it only fans a single logical notification
 * out to the student's active devices.
 *
 * Completely failsafe: never throws, so an order-status update can never
 * fail because a push notification couldn't be delivered.
 */
export async function sendStudentOrderPushNotification(
  params: SendStudentOrderPushParams,
): Promise<{ success: boolean; dispatchedCount: number }> {
  try {
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (!fcmServerKey) {
      // Not configured — Firebase project not wired up yet. Never treat
      // this as an error; the in-app notification (student_notifications
      // row) is already the source of truth and unaffected.
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
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify({
            to: token,
            priority: "high",
            notification: {
              title: params.title,
              body: params.body,
              sound: "default",
              android_channel_id: "grabit_orders_channel_v1",
            },
            data: {
              type: params.type,
              orderId: params.orderId,
              orderNumber: params.orderNumber,
              title: params.title,
              body: params.body,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        const result = await res.json().catch(() => null);
        // FCM legacy API reports invalid/unregistered tokens inside a 200
        // response body, not via HTTP status — inspect it and deactivate
        // dead tokens so we stop retrying against them forever.
        const fcmError = result?.results?.[0]?.error as string | undefined;
        if (fcmError === "NotRegistered" || fcmError === "InvalidRegistration") {
          await supabase
            .from("student_device_tokens")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id);
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
