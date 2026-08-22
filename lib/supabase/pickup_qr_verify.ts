import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { parsePickupQrPayload } from "@/lib/orders/pickup_qr";
import { normalizePickupOtp } from "@/lib/orders/pickup_otp";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
export { getSupabaseAdminClient };

export type PickupQrFailureCode =
  | "UNAUTHENTICATED"
  | "INVALID_QR"
  | "INVALID_OTP"
  | "RATE_LIMITED"
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

/** Which column on `orders` the vendor's credential matched — the
 * completion endpoint filters its atomic UPDATE on this same pair, so
 * QR and OTP share one row-level guard instead of two parallel ones. */
export interface MatchedCredential {
  column: "pickup_qr_token" | "pickup_otp_code";
  value: string;
}

export type PickupQrResult =
  | { ok: true; vendorCanteenId: string; credential: MatchedCredential; order: VerifiedPickupOrder }
  | { ok: false; code: PickupQrFailureCode; error: string };

// Lightweight per-vendor attempt limiter for manual OTP entry — the
// 4-digit space (10,000 combinations) is guessable without one. No
// existing rate-limit infra in this project to reuse, so this is
// deliberately minimal: an in-memory sliding window, reset per instance.
const OTP_ATTEMPT_WINDOW_MS = 5 * 60_000;
const OTP_ATTEMPT_LIMIT = 8;
const otpAttempts = new Map<string, number[]>();

function isRateLimited(vendorUserId: string): boolean {
  const now = Date.now();
  const attempts = (otpAttempts.get(vendorUserId) ?? []).filter(
    (t) => now - t < OTP_ATTEMPT_WINDOW_MS,
  );
  attempts.push(now);
  otpAttempts.set(vendorUserId, attempts);
  return attempts.length > OTP_ATTEMPT_LIMIT;
}

/**
 * Resolves a vendor's pickup credential (QR token OR manual OTP) into an
 * order they're actually allowed to act on. Everything but the raw
 * credential is derived server-side: the vendor's canteen comes from
 * their session, never the request body; the order comes from whichever
 * column matched, never a client-supplied order id. Failure messages are
 * deliberately generic so they never leak internal ids, another
 * vendor's order details, or database structure — and QR vs OTP get the
 * *same* wording for "no match" so neither method can be used to probe
 * which codes are real.
 */
async function resolveByCredential(
  column: MatchedCredential["column"],
  value: string,
  invalidCode: "INVALID_QR" | "INVALID_OTP",
  invalidMessage: string,
): Promise<PickupQrResult> {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return {
      ok: false,
      code: "UNAUTHENTICATED",
      error: "Access denied. Please sign in with a vendor account.",
    };
  }

  if (column === "pickup_otp_code" && isRateLimited(vendorCtx.userId)) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const supabase = getSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, canteen_id, status, total_amount, pickup_qr_used_at,
      order_items ( quantity, menu_items ( name ) )
    `)
    .eq(column, value)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return { ok: false, code: invalidCode, error: invalidMessage };
  }

  const row = rows[0];

  // Cross-vendor isolation: a vendor may only ever act on orders that
  // belong to their own canteen. Deliberately the same generic message
  // regardless of whose order it actually is.
  if (row.canteen_id !== vendorCtx.canteenId) {
    return {
      ok: false,
      code: "WRONG_VENDOR",
      error: "Unauthorized order. This code does not belong to your store.",
    };
  }

  if (row.status === "cancelled") {
    return { ok: false, code: "CANCELLED", error: "This order has been cancelled." };
  }

  if (row.status === "completed" || row.pickup_qr_used_at) {
    return {
      ok: false,
      code: "ALREADY_COMPLETED",
      error: "Order already completed. This code is no longer valid.",
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
    credential: { column, value },
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

export async function resolvePickupQr(rawQrValue: unknown): Promise<PickupQrResult> {
  const token = typeof rawQrValue === "string" ? parsePickupQrPayload(rawQrValue) : null;
  if (!token) {
    return { ok: false, code: "INVALID_QR", error: "Invalid GRABIT QR code." };
  }
  return resolveByCredential("pickup_qr_token", token, "INVALID_QR", "Invalid GRABIT QR code.");
}

export async function resolvePickupOtp(rawOtpValue: unknown): Promise<PickupQrResult> {
  const code = normalizePickupOtp(rawOtpValue);
  const invalidMessage = "Incorrect OTP. The code doesn't match this order.";
  if (!code) {
    return { ok: false, code: "INVALID_OTP", error: invalidMessage };
  }
  return resolveByCredential("pickup_otp_code", code, "INVALID_OTP", invalidMessage);
}

export function pickupQrHttpStatus(code: PickupQrFailureCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "WRONG_VENDOR":
      return 403;
    case "RATE_LIMITED":
      return 429;
    case "NOT_FOUND":
    case "INVALID_QR":
    case "INVALID_OTP":
      return 404;
    default:
      return 409;
  }
}
