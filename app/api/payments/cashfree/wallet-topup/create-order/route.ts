import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createCashfreeOrder, isCashfreeConfigured, getPaymentModeLabel } from "@/lib/payments/cashfree";
import { calculateWalletTopupBonus } from "@/lib/pricing/wallet_topup";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Starts a GrabIt Wallet top-up. Mirrors the food-order Cashfree flow
 * (create-order → payment_session_id → Cashfree Checkout → verified
 * webhook), but credits the student's own `wallets` row instead of
 * creating an `orders` row. The wallet is credited only by the webhook
 * (see confirm_wallet_topup RPC) — never here.
 */
export async function POST(request: Request) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ ok: false, error: "Online payments are not configured yet." }, { status: 503 });
  }

  const supabaseServer = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabaseServer.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Please sign in to add money." }, { status: 401 });
  }

  const body = (await request.json()) as { amount?: unknown };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ ok: false, error: "Enter a valid amount." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: userRow } = await admin.from("users").select("full_name, email, phone").eq("id", user.id).maybeSingle();

  // Distinct GRABIT-WALLET- prefix so the webhook routes this to the
  // wallet-topup handler, never the food-order or payout-ledger ones.
  const cashfreeOrderId = `GRABIT-WALLET-${randomUUID()}`;

  // Server-computed bonus preview — the same numbers the webhook will
  // credit once payment is verified. The client never determines this.
  const preview = calculateWalletTopupBonus(amount);

  try {
    const cfOrder = await createCashfreeOrder({
      orderId: cashfreeOrderId,
      orderAmount: amount,
      customerDetails: {
        customerId: user.id,
        customerName: userRow?.full_name ?? undefined,
        customerEmail: userRow?.email ?? undefined,
        customerPhone: userRow?.phone && userRow.phone.trim() ? userRow.phone : "9999999999",
      },
      orderNote: "GrabIt Wallet top-up",
    });

    const { error: intentErr } = await admin.rpc("create_wallet_topup_intent", {
      p_user_id: user.id,
      p_topup_amount: amount,
      p_cashfree_order_id: cashfreeOrderId,
    });

    if (intentErr) {
      console.error("create_wallet_topup_intent RPC error:", intentErr);
      return NextResponse.json({ ok: false, error: "Couldn't start top-up. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
      paymentMode: getPaymentModeLabel(),
      preview,
    });
  } catch (err) {
    console.error("Wallet top-up Cashfree order creation failed:", err);
    return NextResponse.json({ ok: false, error: "Couldn't start top-up. Please try again." }, { status: 502 });
  }
}
