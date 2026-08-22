import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { trackProductEvent } from "@/lib/analytics/events";
import { recordOrderStatusHistory } from "@/lib/supabase/order_status_history";
import { validateOrderStatusTransition } from "@/lib/orders/status_transitions";
import type { VendorOrderStatus } from "@/lib/mock/vendor";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface UpdateOrderStatusPayload {
  status: VendorOrderStatus;
  reason?: string;
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

    // 5b. Inventory Restock on Order Cancellation
    if (targetStatus === "cancelled") {
      try {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("menu_item_id, quantity")
          .eq("order_id", currentOrder.id);

        if (orderItems && orderItems.length > 0) {
          for (const item of orderItems) {
            await supabase.rpc("adjust_inventory_stock", {
              p_menu_item_id: item.menu_item_id,
              p_quantity_delta: item.quantity,
              p_adjustment_type: "cancellation_restock",
              p_reason: `Restock cancelled order ${currentOrder.order_number}`,
              p_user_id: vendorCtx.userId,
            });
          }
        }
      } catch (restockErr) {
        console.warn("Non-critical order cancellation restock error:", restockErr);
      }
    }

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

    // 9. Award GRABIT Points — only for genuinely paid, completed
    // orders. Gift-food orders (gifted_by_id set) were already funded
    // by the sender's points, so the recipient does not also earn
    // fresh points for them — that would mint points out of thin air.
    // award_order_points() is idempotent (unique per order), so a
    // retry/race here can never double-award.
    if (targetStatus === "completed" && !updatedOrder.gifted_by_id) {
      try {
        const { data: pointsResult } = await supabase.rpc("award_order_points", {
          p_order_id: updatedOrder.id,
        });
        const awarded = (pointsResult as { awarded?: number } | null)?.awarded ?? 0;
        if (awarded > 0 && updatedOrder.student_id) {
          const { createStudentNotification } = await import(
            "@/lib/notifications/student_notifications"
          );
          await createStudentNotification({
            userId: updatedOrder.student_id,
            type: "POINTS_EARNED",
            title: "GRABIT Points earned!",
            message: `You earned ${awarded} GRABIT Points from your order.`,
            severity: "SUCCESS",
            category: "REWARDS",
            relatedOrderId: updatedOrder.id,
            actionUrl: "/customer/rewards",
            dedupeKey: `order-points:${updatedOrder.id}`,
          });
        }
      } catch (pointsErr) {
        console.warn("Non-critical points-award error:", pointsErr);
      }
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
