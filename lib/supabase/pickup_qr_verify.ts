import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { parsePickupQrPayload } from "@/lib/orders/pickup_qr";

export type PickupQrFailureCode =
  | "UNAUTHENTICATED"
  | "INVALID_QR"
  | "NOT_FOUND"
  | "WRONG_VENDOR"
  | "CANCELLED"
  | "ALREADY_COMPLETED"
  | "NOT_READY";

export interface VerifiedPickupOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

export type PickupQrResult =
  | { ok: true; vendorCanteenId: string; token: string; order: VerifiedPickupOrder }
  | { ok: false; code: PickupQrFailureCode; error: string };

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

/**
 * Resolves a scanned pickup QR into an order the *authenticated* vendor
 * is actually allowed to act on.
 *
 * Everything is derived server-side: the vendor's canteen comes from
 * their session (never from the request body), and the order comes from
 * the opaque token (never from a client-supplied order id). Failure
 * messages are deliberately generic — they never leak internal ids,
 * another vendor's order details, or database structure.
 */
export async function resolvePickupQr(rawQrValue: unknown): Promise<PickupQrResult> {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Access denied. Please sign in with a vendor account.",
    };
  }

  const token = typeof rawQrValue === "string" ? parsePickupQrPayload(rawQrValue) : null;
  if (!token) {
    return { ok: false, code: "INVALID_QR", error: "Invalid GRABIT QR code." };
  }

  const supabase = getSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, canteen_id, status, total_amount, pickup_qr_used_at,
      order_items ( quantity, menu_items ( name ) )
    `)
    .eq("pickup_qr_token", token)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return { ok: false, code: "INVALID_QR", error: "Invalid GRABIT QR code." };
  }

  const row = rows[0];

  // Cross-vendor isolation: a vendor may only ever act on orders that
  // belong to their own canteen. Deliberately the same generic message
  // regardless of whose order it actually is.
  if (row.canteen_id !== vendorCtx.canteenId) {
    return {
      ok: false,
      code: "WRONG_VENDOR",
      error: "Unauthorized order. This QR does not belong to your store.",
    };
  }

  if (row.status === "cancelled") {
    return { ok: false, code: "CANCELLED", error: "This order has been cancelled." };
  }

  if (row.status === "completed" || row.pickup_qr_used_at) {
    return {
      ok: false,
      code: "ALREADY_COMPLETED",
      error: "Order already completed. This QR code is no longer valid.",
    };
  }

  if (row.status !== "ready" && row.status !== "picked_up") {
    return {
      ok: false,
      code: "NOT_READY",
      error: "Order not ready yet. Please wait until this order is marked Ready.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = ((row.order_items as any[]) ?? []).map((it) => ({
    name: it.menu_items?.name ?? "Canteen Dish",
    quantity: it.quantity,
  }));

  return {
    ok: true,
    vendorCanteenId: vendorCtx.canteenId,
    token,
    order: {
      id: row.id,
      orderNumber: row.order_number.startsWith("#") ? row.order_number : `#${row.order_number}`,
      studentName: "Campus Student",
      status: row.status,
      totalAmount: Number(row.total_amount) || 0,
      items,
    },
  };
}

export function pickupQrHttpStatus(code: PickupQrFailureCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "WRONG_VENDOR":
      return 403;
    case "NOT_FOUND":
    case "INVALID_QR":
      return 404;
    default:
      return 409;
  }
}
