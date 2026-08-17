import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { recordOrderStatusHistory } from "@/lib/supabase/order_status_history";
import { validateOrderStatusTransition } from "@/lib/orders/status_transitions";
import type { VendorOrderStatus } from "@/lib/mock/vendor";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabaseUserClient = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseUserClient.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please sign in to confirm order pickup." },
        { status: 401 },
      );
    }

    const { id: orderId } = await params;
    const adminSupabase = getSupabaseAdminClient();

    // 1. Fetch target order
    let query = adminSupabase.from("orders").select("*");
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

    // Ownership check: Ensure student owns this order
    if (currentOrder.student_id !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You can only confirm pickup for your own orders." },
        { status: 403 },
      );
    }

    // Status check: only ready -> picked_up is a valid student-initiated transition
    const transitionCheck = validateOrderStatusTransition(
      currentOrder.status as VendorOrderStatus,
      "picked_up",
      "student",
    );

    if (!transitionCheck.ok) {
      return NextResponse.json(
        { ok: false, error: transitionCheck.error },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();

    // 2. Atomic Database Update (ready -> picked_up)
    const { data: updatedOrder, error: updateErr } = await adminSupabase
      .from("orders")
      .update({
        status: "picked_up",
        picked_up_at: nowIso,
      })
      .eq("id", currentOrder.id)
      .eq("status", "ready") // Atomic lock check
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        {
          ok: false,
          error: "This order has already been updated or processed.",
        },
        { status: 409 },
      );
    }

    // 3. Record in order_status_history
    await recordOrderStatusHistory({
      orderId: currentOrder.id,
      previousStatus: "ready",
      newStatus: "picked_up",
      changedBy: user.id,
      actorRole: "student",
      reason: "Student confirmed pickup at counter",
    });

    // 4. Send Notification
    try {
      const { createStudentNotification } = await import(
        "@/lib/notifications/student_notifications"
      );
      await createStudentNotification({
        userId: user.id,
        type: "ORDER_PICKED_UP",
        title: `Order #${updatedOrder.order_number ?? updatedOrder.id.slice(0, 6)} Picked Up`,
        message: "You have confirmed pickup at the counter. Enjoy your meal!",
        severity: "SUCCESS",
        category: "ORDERS",
        relatedOrderId: updatedOrder.id,
        actionUrl: `/student/orders/${updatedOrder.id}`,
        dedupeKey: `order-status:picked_up:${updatedOrder.id}`,
      });
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        pickedUpAt: updatedOrder.picked_up_at,
      },
    });
  } catch (err) {
    console.error("Student pickup endpoint error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error confirming pickup." },
      { status: 500 },
    );
  }
}
