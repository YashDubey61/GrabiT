import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface SendVendorOrderNotificationParams {
  orderId: string;
  orderNumber: string;
  canteenId: string;
  itemCount: number;
  totalAmount: number;
  slot?: string;
}

/**
 * Server-side push notification dispatcher for incoming vendor orders.
 * Dispatches high-priority Android notifications to registered vendor devices.
 * Completely failsafe: catches all errors so payment & order creation flows NEVER fail.
 */
export async function sendVendorNewOrderPushNotification(
  params: SendVendorOrderNotificationParams
): Promise<{ success: boolean; dispatchedCount: number }> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Fetch active push tokens for this canteen
    const { data: tokens, error } = await supabase
      .from("vendor_device_tokens")
      .select("token")
      .eq("canteen_id", params.canteenId)
      .eq("is_active", true);

    if (error || !tokens || tokens.length === 0) {
      return { success: true, dispatchedCount: 0 };
    }

    const tokenList = tokens.map((t) => t.token).filter(Boolean);
    if (tokenList.length === 0) {
      return { success: true, dispatchedCount: 0 };
    }

    const title = "New Order Received";
    const body = `Order #${params.orderNumber} • ${params.itemCount} items (₹${params.totalAmount})`;

    const fcmServerKey = process.env.FCM_SERVER_KEY;
    if (fcmServerKey) {
      // Legacy FCM HTTP Send (if key is set)
      await Promise.allSettled(
        tokenList.map(async (token) => {
          try {
            await fetch("https://fcm.googleapis.com/fcm/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `key=${fcmServerKey}`,
              },
              body: JSON.stringify({
                to: token,
                priority: "high",
                notification: {
                  title,
                  body,
                  sound: "order_alert",
                  android_channel_id: "grabit_new_orders_channel_v1",
                },
                data: {
                  type: "NEW_ORDER",
                  orderId: params.orderId,
                  orderNumber: params.orderNumber,
                  canteenId: params.canteenId,
                  title,
                  body,
                  timestamp: new Date().toISOString(),
                },
              }),
            });
          } catch (sendErr) {
            console.warn("[vendor-push] FCM send error for token:", sendErr);
          }
        })
      );
    }

    return { success: true, dispatchedCount: tokenList.length };
  } catch (err) {
    console.warn("[vendor-push] Error dispatching push notification:", err);
    return { success: false, dispatchedCount: 0 };
  }
}
