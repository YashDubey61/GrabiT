import { NextResponse } from "next/server";
import {
  resolvePickupQr,
  resolvePickupOtp,
  pickupQrHttpStatus,
  getSupabaseAdminClient,
} from "@/lib/supabase/pickup_qr_verify";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { recordOrderStatusHistory } from "@/lib/supabase/order_status_history";

/**
 * Consumes a pickup credential — QR token OR manual OTP — and completes
 * the order. Both methods call this exact same handler, so they can
 * never leave the order in different states.
 *
 * All authority comes from the credential + the vendor's own session —
 * the client never supplies an order id, canteen id, or target status.
 *
 * The mutation is a single conditional UPDATE guarded on
 * (credential, canteen, status, unused-token). If two devices verify
 * the same order simultaneously (via QR, OTP, or one of each), exactly
 * one UPDATE matches a row; the loser gets zero rows back and is
 * reported as already completed. That guard — not the read above it —
 * is what actually prevents double completion.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { qrValue?: unknown; otpValue?: unknown };

    // Pre-flight: resolves ownership/state and produces the friendly
    // error messages. Not relied on for correctness — the atomic UPDATE
    // below re-asserts every condition.
    const result =
      body?.otpValue !== undefined
        ? await resolvePickupOtp(body.otpValue)
        : await resolvePickupQr(body?.qrValue);
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
    const { column: credentialColumn, value: credentialValue } = result.credential;

    let updateQuery = supabase
      .from("orders")
      .update({
        status: "completed",
        picked_up_at: previousStatus === "picked_up" ? undefined : nowIso,
        completed_at: nowIso,
        // Shared "used" marker for BOTH methods — once either QR or OTP
        // completes the order, this blocks the other from also working.
        pickup_qr_used_at: nowIso,
      })
      .eq("canteen_id", vendorCtx.canteenId)
      .in("status", ["ready", "picked_up"])
      .is("pickup_qr_used_at", null);

    updateQuery =
      credentialColumn === "pickup_qr_token"
        ? updateQuery.eq("pickup_qr_token", credentialValue)
        : updateQuery.eq("pickup_otp_code", credentialValue);

    const { data: updated, error: updateErr } = await updateQuery
      .select("id, order_number, completed_at")
      .maybeSingle();

    if (updateErr || !updated) {
      // Lost the race, or state changed between read and write.
      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_COMPLETED",
          error: "Order already completed. This code is no longer valid.",
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
        reason:
          credentialColumn === "pickup_qr_token"
            ? "Pickup QR verified at counter"
            : "Pickup OTP verified at counter",
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
        .select("student_id, gifted_by_id")
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

      // Same rule as the standard status-transition route: gift-food
      // orders were already paid for in points, so no fresh points on
      // completion — only genuinely paid orders earn.
      if (orderRow?.student_id && !orderRow.gifted_by_id) {
        const { data: pointsResult } = await supabase.rpc("award_order_points", {
          p_order_id: updated.id,
        });
        const awarded = (pointsResult as { awarded?: number } | null)?.awarded ?? 0;
        if (awarded > 0) {
          await createStudentNotification({
            userId: orderRow.student_id,
            type: "POINTS_EARNED",
            title: "GRABIT Points earned!",
            message: `You earned ${awarded} GRABIT Points from your order.`,
            severity: "SUCCESS",
            category: "REWARDS",
            relatedOrderId: updated.id,
            actionUrl: "/customer/rewards",
            dedupeKey: `order-points:${updated.id}`,
          });
        }
      }
    } catch {
      // Notification/points side-effects are non-critical — the pickup
      // itself already succeeded via the atomic UPDATE above.
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
