import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getCashfreeOrderStatus } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Student polls this after closing Cashfree checkout while waiting for
 * the webhook. If our DB still shows "pending" past a short window, we
 * fall back to asking Cashfree directly for the order's live status —
 * server-side reconciliation, never trusting the client. */
export async function GET(request: Request) {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId is required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: orderRow } = await admin.from("orders").select("id, student_id, status").eq("id", orderId).maybeSingle();
  if (!orderRow || orderRow.student_id !== user.id) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("status, cashfree_order_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ ok: true, paymentStatus: "unknown", orderStatus: orderRow.status });
  }

  if (payment.status === "pending" && payment.cashfree_order_id) {
    try {
      const cfStatus = await getCashfreeOrderStatus(payment.cashfree_order_id);
      const orderStatus = (cfStatus as { order_status?: string })?.order_status;
      if (orderStatus === "PAID") {
        await admin
          .from("payments")
          .update({ status: "success", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("order_id", orderId);
        return NextResponse.json({ ok: true, paymentStatus: "success", orderStatus: orderRow.status });
      }

      // Cashfree order reached a terminal non-paid state (expired without
      // payment, or explicitly terminated) — this is the authoritative
      // signal for a dropped/abandoned checkout, since Cashfree never
      // sends a webhook for "the student closed the checkout without
      // attempting payment". Resolve it the same way the webhook resolves
      // an explicit FAILED/USER_DROPPED/CANCELLED event, so polling
      // eventually reaches a real terminal state instead of "pending"
      // forever.
      if (orderStatus === "EXPIRED" || orderStatus === "TERMINATED" || orderStatus === "TERMINATION_REQUESTED") {
        await admin
          .from("payments")
          .update({ status: "failed", gateway_response: cfStatus, updated_at: new Date().toISOString() })
          .eq("order_id", orderId);
        await admin
          .from("orders")
          .update({ status: "cancelled", cancellation_reason: "Payment not completed" })
          .eq("id", orderId)
          .eq("status", "placed");
        return NextResponse.json({ ok: true, paymentStatus: "failed", orderStatus: "cancelled" });
      }
    } catch {
      // Fall through to the DB-known status.
    }
  }

  return NextResponse.json({ ok: true, paymentStatus: payment.status, orderStatus: orderRow.status });
}
