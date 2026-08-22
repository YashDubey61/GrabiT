import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RecordStatusHistoryParams {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  changedBy?: string | null;
  actorRole: "student" | "vendor" | "admin" | "system";
  reason?: string | null;
}

/**
 * Persists an order status transition audit record into `order_status_history`.
 */
export async function recordOrderStatusHistory({
  orderId,
  previousStatus,
  newStatus,
  changedBy = null,
  actorRole,
  reason = null,
}: RecordStatusHistoryParams): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("order_status_history").insert({
      order_id: orderId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed_by: changedBy,
      actor_role: actorRole,
      reason,
    });

    if (error) {
      console.warn("Failed to insert order status history:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Error recording order status history:", err);
    return false;
  }
}
