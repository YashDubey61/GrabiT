import { createClient } from "./client";
import type { VendorOrder, VendorOrderStatus } from "@/lib/mock/vendor";
import { getPendingOfflineManualOrders, MAX_SYNC_ATTEMPTS } from "@/lib/offline/manual_order_db";

export interface SupabaseVendorOrderRow {
  id: string;
  order_number: string;
  student_id?: string | null;
  canteen_id: string;
  slot?: "short_break" | "lunch" | null;
  status: VendorOrderStatus;
  total_amount: number;
  created_at: string;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  pickup_otp_code?: string | null;
  order_type?: string | null;
  is_manual?: boolean | null;
  payment_method?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  student_identifier?: string | null;
  canteens?: { name: string };
  users?: { full_name?: string | null } | null;
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
 * scoped to the given canteen. Merges local offline manual cash orders
 * from IndexedDB if server is offline or sync is pending.
 */
export async function getLiveVendorOrders(
  canteenId?: string,
): Promise<VendorOrder[]> {
  if (!canteenId) {
    return [];
  }

  let dbOrders: VendorOrder[] = [];

  try {
    const supabase = createClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        canteens ( name ),
        users:student_id ( full_name ),
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

    if (!error && orders) {
      dbOrders = orders.map((o) => mapSupabaseVendorOrderToUI(o as SupabaseVendorOrderRow));
    }
  } catch {
    // Database connection fallback
  }

  // Merge local pending manual cash orders from IndexedDB
  try {
    const localPending = await getPendingOfflineManualOrders(canteenId);
    const localMapped: VendorOrder[] = localPending.map((loc) => {
      const isStuck = loc.syncStatus === "FAILED" && (loc.syncAttempts ?? 0) >= MAX_SYNC_ATTEMPTS;
      return {
        id: loc.clientOrderId,
        orderNumber: loc.serverOrderNumber || `#GRABIT-M-${loc.clientOrderId.slice(-4).toUpperCase()}`,
        studentName: loc.customerName || "Walk-in Customer",
        elapsedTimeText: isStuck ? "Sync Failed — Needs Attention" : "Pending Sync (Offline)",
        paymentType: "CASH",
        status: "preparing",
        totalAmount: loc.totalAmount,
        items: loc.items.map((i) => ({ name: i.name, quantity: i.quantity })),
        createdAtIso: loc.createdAt,
        orderType: "MANUAL_CASH_ORDER",
        isManual: true,
      };
    });

    // Deduplicate if order already exists in dbOrders by serverOrderNumber or ID
    const dbOrderNumbers = new Set(dbOrders.map((o) => o.orderNumber));
    const uniqueLocal = localMapped.filter((loc) => !dbOrderNumbers.has(loc.orderNumber));

    return [...uniqueLocal, ...dbOrders];
  } catch {
    return dbOrders;
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

  const isManualOrder = Boolean(
    row.is_manual ||
    row.order_type === "MANUAL_CASH_ORDER" ||
    (row.order_number && row.order_number.includes("-M-"))
  );

  const rawStudentName = row.customer_name || row.users?.full_name;
  const studentName = rawStudentName && rawStudentName.trim()
    ? rawStudentName.trim()
    : isManualOrder
      ? "Walk-in Customer"
      : "Customer";

  return {
    id: row.id,
    orderNumber: row.order_number.startsWith("#") ? row.order_number : `#${row.order_number}`,
    studentName,
    elapsedTimeText,
    paymentType: row.payment_method === "cash" || isManualOrder ? "CASH" : "PREPAID",
    status: row.status,
    totalAmount: Number(row.total_amount) || 0,
    items,
    otpCode: row.status === "ready" ? row.pickup_otp_code ?? undefined : undefined,
    prepProgressPercent: row.status === "preparing" ? Math.min(85, 30 + elapsedMinutes * 10) : undefined,
    createdAtIso: row.created_at,
    acceptedAtIso: row.accepted_at ?? undefined,
    pickedUpAtIso: row.picked_up_at ?? undefined,
    completedAtIso: row.completed_at ?? undefined,
    cancelledAtIso: row.cancelled_at ?? undefined,
    cancellationReason: row.cancellation_reason ?? undefined,
    orderType: row.order_type || (isManualOrder ? "MANUAL_CASH_ORDER" : "ONLINE_ORDER"),
    isManual: isManualOrder,
  };
}
