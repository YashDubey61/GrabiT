import { createClient } from "./client";
import type { Order } from "@/lib/orders/types";

export interface SupabaseOrderRow {
  id: string;
  student_id: string;
  canteen_id: string;
  slot: "short_break" | "lunch";
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled";
  order_number: string;
  total_amount: number;
  created_at: string;
  pickup_qr_token?: string | null;
  pickup_qr_used_at?: string | null;
  pickup_otp_code?: string | null;
  completed_at?: string | null;
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
 * Fetch a single order by ID from Supabase.
 */
export async function getLiveOrderById(orderId: string): Promise<Order | null> {
  try {
    const supabase = createClient();

    // Query order by UUID or order_number
    let query = supabase.from("orders").select(`
      *,
      canteens ( name ),
      order_items (
        id,
        menu_item_id,
        quantity,
        price_at_order,
        menu_items ( name )
      )
    `);

    if (orderId.startsWith("order_") || orderId.includes("-")) {
      const cleanId = orderId.replace(/^order_/, "");
      query = query.or(`id.eq.${cleanId},order_number.eq.${orderId}`);
    } else {
      query = query.eq("order_number", orderId.startsWith("#") ? orderId : `#${orderId}`);
    }

    const { data: orders, error } = await query.limit(1);

    if (error || !orders || orders.length === 0) {
      return null;
    }

    const row = orders[0] as SupabaseOrderRow;
    return mapSupabaseOrderToUI(row);
  } catch {
    return null;
  }
}

/**
 * Fetch all orders for the current student from Supabase.
 */
export async function getLiveOrdersForStudent(): Promise<Order[]> {
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
      .order("created_at", { ascending: false });

    if (error || !orders) {
      return [];
    }

    return orders.map((o) => mapSupabaseOrderToUI(o as SupabaseOrderRow));
  } catch {
    return [];
  }
}

function mapSupabaseOrderToUI(row: SupabaseOrderRow): Order {
  const canteenName = row.canteens?.name ?? "Campus Canteen";
  const items = (row.order_items ?? []).map((item) => {
    const itemName = item.menu_items?.name ?? "Canteen Dish";
    const price = Number(item.price_at_order);
    return {
      id: item.id,
      menuItemId: item.menu_item_id,
      name: itemName,
      price,
      quantity: item.quantity,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
      lineTotal: price * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalAmount = Number(row.total_amount);
  const platformFee = Math.max(0, totalAmount - subtotal);

  const createdAt = row.created_at;
  const estimatedReadyAt = new Date(
    new Date(createdAt).getTime() + 10 * 60_000,
  ).toISOString();

  const slotMap: Record<string, Order["slot"]> = {
    short_break: "ASAP",
    lunch: "12:30 PM",
  };

  return {
    id: row.id,
    orderNumber: row.order_number.startsWith("#") ? row.order_number : `#${row.order_number}`,
    canteenId: row.canteen_id,
    canteenName,
    studentId: row.student_id,
    slot: slotMap[row.slot] ?? "ASAP",
    status: row.status,
    paymentMethod: "wallet",
    items,
    subtotal,
    platformFee,
    totalAmount,
    createdAt,
    estimatedReadyAt,
    pickupQrToken: row.pickup_qr_token ?? null,
    pickupQrUsedAt: row.pickup_qr_used_at ?? null,
    pickupOtpCode: row.pickup_otp_code ?? null,
    completedAt: row.completed_at ?? null,
  };
}
