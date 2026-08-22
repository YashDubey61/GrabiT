import { createStudentNotification } from "./student_notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type StudentLifecycleSegment =
  | "NEW"
  | "ACTIVATED"
  | "RETURNING"
  | "LOYAL"
  | "AT_RISK"
  | "DORMANT";

/**
 * Derives student engagement lifecycle segment and triggers relevant non-transactional recommendations
 * while strictly respecting daily anti-spam limits (max 1/day).
 */
export async function checkAndTriggerStudentEngagement(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    // 1. Calculate student completed order count
    const { count: completedOrdersCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("status", "completed");

    const ordersCount = completedOrdersCount ?? 0;

    let segment: StudentLifecycleSegment = "NEW";
    if (ordersCount >= 10) segment = "LOYAL";
    else if (ordersCount >= 3) segment = "RETURNING";
    else if (ordersCount >= 1) segment = "ACTIVATED";

    const todayStr = new Date().toISOString().split("T")[0];
    const dedupeKey = `engagement:${segment.toLowerCase()}:${userId}:${todayStr}`;

    if (segment === "NEW") {
      await createStudentNotification({
        userId,
        type: "CAMPUS_ANNOUNCEMENT",
        title: "Welcome to GrabIt Campus Canteen!",
        message: "Skip the canteen line. Order fresh food directly from your phone.",
        severity: "INFO",
        category: "GENERAL",
        actionUrl: "/customer/menu",
        dedupeKey,
      });
    } else if (segment === "ACTIVATED" || segment === "RETURNING") {
      await createStudentNotification({
        userId,
        type: "RECOMMENDATION_AVAILABLE",
        title: "Popular Dish Nearby Today",
        message: "Butter Paneer Meal Box is trending at your campus food court.",
        severity: "INFO",
        category: "RECOMMENDATIONS",
        actionUrl: "/customer/menu",
        dedupeKey,
      });
    } else if (segment === "LOYAL") {
      await createStudentNotification({
        userId,
        type: "GOLD_ACTIVATED",
        title: "GrabIt Gold Priority Active",
        message: "Enjoy 0% platform fee and priority pickup lanes across campus.",
        severity: "SUCCESS",
        category: "GOLD",
        actionUrl: "/customer/profile",
        dedupeKey,
      });
    }

    return true;
  } catch (err) {
    console.warn("Engagement trigger warning (handled gracefully):", err);
    return false;
  }
}
