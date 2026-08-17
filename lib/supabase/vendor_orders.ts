import { createClient } from "./client";
import type { VendorOrder, VendorOrderStatus } from "@/lib/mock/vendor";

export interface SupabaseVendorOrderRow {
  id: string;
  order_number: string;
  student_id: string;
  canteen_id: string;
  slot: "short_break" | "lunch";
  status: VendorOrderStatus;
  total_amount: number;
  created_at: string;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  pickup_otp_code?: string | null;
  canteens?: { name: string };
  order_items?: {
    id: string;
    menu_item_id: string;
    quantity: number;
    price_at_order: number;
    menu_items?: { name: string };
  }[];
}

/**
 * Fetch live vendor active orders from Supabase database, strictly
 * scoped to the given canteen. Fails closed (returns []) when no
 * canteenId is provided — a vendor must never see another vendor's
 * orders, so there is no "fetch everything" fallback.
 */
export async function getLiveVendorOrders(
  canteenId?: string,
): Promise<VendorOrder[]> {
  if (!canteenId) {
    return [];
  }

  try {
    const supabase = createClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        canteens ( name ),
        order_items (
          id,
          menu_item_id,
          quantity,
          price_at_order,
          menu_items ( name )
        )
      `)
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (error || !orders) {
      return [];
    }

    return orders.map((o) => mapSupabaseVendorOrderToUI(o as SupabaseVendorOrderRow));
  } catch {
    return [];
  }
}

export function mapSupabaseVendorOrderToUI(row: SupabaseVendorOrderRow): VendorOrder {
  const items = (row.order_items ?? []).map((item) => ({
    name: item.menu_items?.name ?? "Canteen Dish",
    quantity: item.quantity,
  }));

  const createdTime = new Date(row.created_at).getTime();
  const elapsedMinutes = Math.max(1, Math.floor((Date.now() - createdTime) / 60_000));

  let elapsedTimeText = `${elapsedMinutes} mins ago`;
  if (row.status === "preparing") {
    elapsedTimeText = `Started ${elapsedMinutes}m ago`;
  } else if (row.status === "ready") {
    elapsedTimeText = `Ready since ${elapsedMinutes}m`;
  } else if (row.status === "picked_up") {
    elapsedTimeText = `Picked Up`;
  } else if (row.status === "completed") {
    elapsedTimeText = `Completed`;
  } else if (row.status === "cancelled") {
    elapsedTimeText = `Cancelled`;
  }

  return {
    id: row.id,
    orderNumber: row.order_number.startsWith("#") ? row.order_number : `#${row.order_number}`,
    studentName: "Campus Student",
    elapsedTimeText,
    paymentType: "PREPAID",
    status: row.status,
    totalAmount: Number(row.total_amount) || 0,
    items,
    // Real per-order secret the *customer* reads aloud for manual OTP
    // verification — this used to be derived from the (guessable, public)
    // order number, which defeated the purpose of a fallback credential.
    otpCode: row.status === "ready" ? row.pickup_otp_code ?? undefined : undefined,
    prepProgressPercent: row.status === "preparing" ? Math.min(85, 30 + elapsedMinutes * 10) : undefined,
    createdAtIso: row.created_at,
    acceptedAtIso: row.accepted_at ?? undefined,
    pickedUpAtIso: row.picked_up_at ?? undefined,
    completedAtIso: row.completed_at ?? undefined,
    cancelledAtIso: row.cancelled_at ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
  };
}
