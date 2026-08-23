"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initStudentPushNotifications, type OrderPushData } from "@/lib/notifications/push_client";

/**
 * Mounted once in the Student layout. Registers this device for order
 * push notifications only once a student session actually exists (never
 * on cold launch before login), and routes a tapped order notification
 * to its Order Details screen.
 *
 * Ownership is enforced by the same RLS-backed order fetch every other
 * "/customer/orders/[id]" entry point already goes through (see
 * lib/supabase/orders.ts) — a tapped notification for an order that
 * doesn't belong to the signed-in student resolves the same as browsing
 * there directly would: no data, not another student's order.
 */
export function StudentPushInit() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      await initStudentPushNotifications((data: OrderPushData) => {
        if (data.orderId) {
          router.push(`/customer/orders/${data.orderId}`);
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
