import { NextResponse } from "next/server";
import {
  resolvePickupQr,
  pickupQrHttpStatus,
  getSupabaseAdminClient,
} from "@/lib/supabase/pickup_qr_verify";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { recordOrderStatusHistory } from "@/lib/supabase/order_status_history";

/**
 * Consumes a pickup QR and completes the order.
 *
 * All authority comes from the token + the vendor's own session — the
 * client never supplies an order id, canteen id, or target status.
 *
 * The mutation is a single conditional UPDATE guarded on
 * (token, canteen, status, unused-token). If two devices scan the same
 * QR simultaneously, exactly one UPDATE matches a row; the loser gets
 * zero rows back and is reported as already completed. That guard —
 * not the read above it — is what actually prevents double completion.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { qrValue?: unknown };

    // Pre-flight: resolves ownership/state and produces the friendly
    // error messages. Not relied on for correctness — the atomic UPDATE
    // below re-asserts every condition.
    const result = await resolvePickupQr(body?.qrValue);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.error },
        { status: pickupQrHttpStatus(result.code) },
      );
    }

    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHENTICATED", error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const nowIso = new Date().toISOString();
    const previousStatus = result.order.status;

    const { data: updated, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "completed",
        picked_up_at: previousStatus === "picked_up" ? undefined : nowIso,
        completed_at: nowIso,
        pickup_qr_used_at: nowIso,
      })
      .eq("pickup_qr_token", result.token)
      .eq("canteen_id", vendorCtx.canteenId)
      .in("status", ["ready", "picked_up"])
      .is("pickup_qr_used_at", null)
      .select("id, order_number, completed_at")
      .maybeSingle();

    if (updateErr || !updated) {
      // Lost the race, or state changed between read and write.
      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_COMPLETED",
          error: "Order already completed. This QR code is no longer valid.",
        },
        { status: 409 },
      );
    }

    // Audit trail: the scan collapses ready -> picked_up -> completed
    // into one physical handover, so both steps are recorded.
    if (previousStatus === "ready") {
      await recordOrderStatusHistory({
        orderId: updated.id,
        previousStatus: "ready",
        newStatus: "picked_up",
        changedBy: vendorCtx.userId,
        actorRole: "vendor",
        reason: "Pickup QR verified at counter",
      });
    }
    await recordOrderStatusHistory({
      orderId: updated.id,
      previousStatus: "picked_up",
      newStatus: "completed",
      changedBy: vendorCtx.userId,
      actorRole: "vendor",
      reason: "Pickup QR verified at counter",
    });

    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      const { data: orderRow } = await supabase
        .from("orders")
        .select("student_id")
        .eq("id", updated.id)
        .maybeSingle();

      if (orderRow?.student_id) {
        await createStudentNotification({
          userId: orderRow.student_id,
          type: "ORDER_COMPLETED",
          title: `Order ${updated.order_number} Completed`,
          message: "Your order has been handed over. Enjoy your meal!",
          severity: "INFO",
          category: "ORDERS",
          relatedOrderId: updated.id,
          actionUrl: `/customer/orders/${updated.id}`,
          dedupeKey: `order-completed:${updated.id}`,
        });
      }
    } catch {
      // Notification is a non-critical side effect.
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: updated.id,
        orderNumber: updated.order_number,
        status: "completed",
        completedAt: updated.completed_at,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_QR", error: "Invalid GRABIT QR code." },
      { status: 400 },
    );
  }
}
