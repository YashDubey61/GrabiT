import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { trackProductEvent } from "@/lib/analytics/events";
import { recordOrderStatusHistory } from "@/lib/supabase/order_status_history";
import { validateOrderStatusTransition } from "@/lib/orders/status_transitions";
import type { VendorOrderStatus } from "@/lib/mock/vendor";

interface UpdateOrderStatusPayload {
  status: VendorOrderStatus;
  reason?: string;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: orderId } = await params;
    const payload = (await request.json()) as UpdateOrderStatusPayload;

    if (!payload.status) {
      return NextResponse.json(
        { ok: false, error: "Target order status is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch current order from Supabase
    let query = supabase.from("orders").select("*");
    if (orderId.includes("-")) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderId.startsWith("#") ? orderId : `#${orderId}`);
    }

    const { data: orders, error: fetchErr } = await query.limit(1);

    if (fetchErr || !orders || orders.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 },
      );
    }

    const currentOrder = orders[0];

    // Cross-tenant IDOR Check: Ensure order belongs strictly to authorized vendor's canteen
    if (currentOrder.canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to transition this order." },
        { status: 403 },
      );
    }

    const currentStatus = currentOrder.status as VendorOrderStatus;
    const targetStatus = payload.status;

    // 2. Validate strict status transition rules (placed -> preparing -> ready -> picked_up -> completed)
    const transitionCheck = validateOrderStatusTransition(currentStatus, targetStatus, "vendor");

    if (!transitionCheck.ok) {
      return NextResponse.json(
        { ok: false, error: transitionCheck.error },
        { status: 400 },
      );
    }

    // 3. Prepare atomic update fields
    const nowIso = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFields: Record<string, any> = {
      status: targetStatus,
    };

    if (targetStatus === "preparing" && currentStatus === "placed") {
      updateFields.accepted_at = nowIso;
    } else if (targetStatus === "picked_up") {
      updateFields.picked_up_at = nowIso;
    } else if (targetStatus === "completed") {
      updateFields.completed_at = nowIso;
    } else if (targetStatus === "cancelled") {
      updateFields.cancelled_at = nowIso;
      updateFields.cancelled_by = vendorCtx.userId;
      updateFields.cancellation_reason =
        payload.reason?.trim() || "Store was unable to fulfill this order.";
    }

    // 4. Atomic Database Update (WHERE status = currentStatus) for Race Condition Protection
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update(updateFields)
      .eq("id", currentOrder.id)
      .eq("status", currentStatus) // Atomic status check
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        {
          ok: false,
          error: "This order has already been processed or updated by another session.",
        },
        { status: 409 },
      );
    }

    // 5. Audit Log to order_status_history
    await recordOrderStatusHistory({
      orderId: currentOrder.id,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      changedBy: vendorCtx.userId,
      actorRole: "vendor",
      reason: payload.reason,
    });

    // 6. Auto-resolve corresponding vendor new order notification
    if (targetStatus === "preparing" || targetStatus === "cancelled") {
      try {
        const { autoResolveOperationalNotification } = await import(
          "@/lib/notifications/operational_notifications"
        );
        await autoResolveOperationalNotification(`vendor-new-order:${currentOrder.id}`);
      } catch (notifErr) {
        console.warn("Non-critical notification resolve error:", notifErr);
      }
    }

    // 7. Authoritative Server Analytics Event Tracking
    if (targetStatus === "completed") {
      trackProductEvent({
        eventName: "order_completed",
        orderId: currentOrder.id,
        canteenId: currentOrder.canteen_id,
      });
    }

    // 8. Student Notification Side-Effect
    try {
      const { createStudentNotification } = await import(
        "@/lib/notifications/student_notifications"
      );
      let notifType:
        | "ORDER_PREPARING"
        | "ORDER_READY"
        | "ORDER_PICKED_UP"
        | "ORDER_COMPLETED"
        | "ORDER_CANCELLED"
        | null = null;
      let title = "";
      let message = "";
      let severity: "INFO" | "SUCCESS" | "WARNING" | "URGENT" = "INFO";

      const orderNum = updatedOrder.order_number ?? updatedOrder.id.slice(0, 6);

      if (targetStatus === "preparing") {
        notifType = "ORDER_PREPARING";
        title = `Order #${orderNum} Accepted!`;
        message = "The canteen has accepted your order and started cooking.";
        severity = "INFO";
      } else if (targetStatus === "ready") {
        notifType = "ORDER_READY";
        title = `Order #${orderNum} Ready for Pickup!`;
        message = "Your food is fresh & hot at the counter. Head to the pickup lane.";
        severity = "SUCCESS";
      } else if (targetStatus === "picked_up") {
        notifType = "ORDER_PICKED_UP";
        title = `Order #${orderNum} Picked Up`;
        message = "Your order has been collected at the counter. Enjoy your meal!";
        severity = "SUCCESS";
      } else if (targetStatus === "completed") {
        notifType = "ORDER_COMPLETED";
        title = `Order #${orderNum} Completed`;
        message = "Thank you for ordering with GrabIt! Enjoy your meal.";
        severity = "SUCCESS";
      } else if (targetStatus === "cancelled") {
        notifType = "ORDER_CANCELLED";
        title = `Order #${orderNum} Cancelled by Store`;
        message = `Reason: ${payload.reason?.trim() || "Store unable to process item"}. Any paid amount will be refunded.`;
        severity = "WARNING";
      }

      if (notifType && updatedOrder.student_id) {
        await createStudentNotification({
          userId: updatedOrder.student_id,
          type: notifType,
          title,
          message,
          severity,
          category: "ORDERS",
          relatedOrderId: updatedOrder.id,
          actionUrl: `/customer/orders/${updatedOrder.id}`,
          dedupeKey: `order-status:${targetStatus}:${updatedOrder.id}`,
        });
      }
    } catch (notifErr) {
      console.warn("Non-critical notification side-effect error:", notifErr);
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        acceptedAt: updatedOrder.accepted_at,
        pickedUpAt: updatedOrder.picked_up_at,
        completedAt: updatedOrder.completed_at,
        cancelledAt: updatedOrder.cancelled_at,
        cancellationReason: updatedOrder.cancellation_reason,
      },
    });
  } catch (err) {
    console.error("Vendor order route error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error updating order status." },
      { status: 500 },
    );
  }
}
