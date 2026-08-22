import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { isCashfreePayoutsConfigured, getPayoutsBalance } from "@/lib/payments/cashfree_payouts";

/**
 * Reports the REAL Cashfree Payouts connection/balance status — never
 * derived from grabit_payout_wallet_ledger or any internal GRABIT
 * accounting figure. If Cashfree Payouts credentials aren't set, this
 * returns configured:false and no balance is ever fabricated.
 */
export async function GET() {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  if (!isCashfreePayoutsConfigured()) {
    return NextResponse.json({
      ok: true,
      configured: false,
      connectionStatus: "NOT_CONFIGURED",
    });
  }

  try {
    const balance = await getPayoutsBalance();
    return NextResponse.json({
      ok: true,
      configured: true,
      connectionStatus: "CONNECTED",
      availableBalance: balance.availableBalance,
      fundSource: balance.fundSource,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cashfree Payouts balance lookup failed:", err);
    return NextResponse.json({
      ok: true,
      configured: true,
      connectionStatus: "ERROR",
      error: "Could not reach Cashfree Payouts. Balance unavailable.",
    });
  }
}
