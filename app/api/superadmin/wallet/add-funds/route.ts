import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { createCashfreeOrder, isCashfreeConfigured, getPaymentModeLabel } from "@/lib/payments/cashfree";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ ok: false, error: "Cashfree is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { amount?: unknown };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Enter a valid amount." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const cashfreeOrderId = `GRABIT-FUND-${randomUUID()}`;

  try {
    const cfOrder = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: Number(amount.toFixed(2)),
      customerDetails: {
        customerId: ctx.user.id,
        customerEmail: ctx.user.email ?? undefined,
        customerPhone: "9999999999",
      },
      orderNote: "GRABIT payout wallet fund addition",
    });

    const { data: ledgerResult, error: ledgerErr } = await admin.rpc("create_fund_addition", {
      p_admin_id: ctx.user.id,
      p_amount: amount,
      p_cashfree_order_id: cashfreeOrderId,
    });

    if (ledgerErr) {
      console.error("create_fund_addition RPC error:", ledgerErr);
      return NextResponse.json({ ok: false, error: "Couldn't record fund addition intent." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ledgerId: (ledgerResult as { ledgerId: string }).ledgerId,
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
      paymentMode: getPaymentModeLabel(),
    });
  } catch (err) {
    console.error("Cashfree fund-addition order creation failed:", err);
    return NextResponse.json({ ok: false, error: "Couldn't start fund addition. Please try again." }, { status: 502 });
  }
}
