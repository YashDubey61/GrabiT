import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { trackProductEvent } from "@/lib/analytics/events";
import type { VendorOrderStatus } from "@/lib/mock/vendor";

interface UpdateOrderStatusPayload {
  status: VendorOrderStatus;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

    // 2. Validate strict status transition rules (placed -> preparing -> ready -> completed)
    const validTransitions: Record<VendorOrderStatus, VendorOrderStatus[]> = {
      placed: ["preparing"],
      preparing: ["ready"],
      ready: ["completed"],
      completed: [],
    };

    const allowedNextStatuses = validTransitions[currentStatus] ?? [];

    if (!allowedNextStatuses.includes(targetStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid status transition from "${currentStatus}" to "${targetStatus}".`,
        },
        { status: 400 },
      );
    }

    // 3. Update status in database
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({ status: targetStatus })
      .eq("id", currentOrder.id)
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      console.error("Order status update database error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to update order status." },
        { status: 500 },
      );
    }

    // 4. Authoritative Server Analytics Event Tracking
    if (targetStatus === "completed") {
      trackProductEvent({
        eventName: "order_completed",
        orderId: currentOrder.id,
        canteenId: currentOrder.canteen_id,
      });
    }

    // 5. Fail-Safe Student Notification Side-Effect
    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      let notifType: "ORDER_PREPARING" | "ORDER_READY" | "ORDER_COMPLETED" | "ORDER_CANCELLED" | null = null;
      let title = "";
      let message = "";
      let severity: "INFO" | "SUCCESS" | "WARNING" | "URGENT" = "INFO";

      if (targetStatus === "preparing") {
        notifType = "ORDER_PREPARING";
        title = `Order #${updatedOrder.order_number ?? updatedOrder.id.slice(0, 6)} is Preparing`;
        message = "The kitchen has accepted your order and started cooking.";
        severity = "INFO";
      } else if (targetStatus === "ready") {
        notifType = "ORDER_READY";
        title = `Order #${updatedOrder.order_number ?? updatedOrder.id.slice(0, 6)} Ready for Pickup!`;
        message = "Your food is fresh & hot at the counter. Head to the pickup lane.";
        severity = "SUCCESS";
      } else if (targetStatus === "completed") {
        notifType = "ORDER_COMPLETED";
        title = `Order #${updatedOrder.order_number ?? updatedOrder.id.slice(0, 6)} Pickup Completed`;
        message = "Thank you for ordering with GrabIt! Enjoy your meal.";
        severity = "SUCCESS";
      } else if ((targetStatus as string) === "cancelled") {
        notifType = "ORDER_CANCELLED";
        title = `Order #${updatedOrder.order_number ?? updatedOrder.id.slice(0, 6)} Cancelled`;
        message = "Your order was cancelled. Any charged amount will be refunded.";
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
          actionUrl: `/student/orders/${updatedOrder.id}`,
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
