import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * GRABIT Financial Ledger — internal accounting derived from real
 * payments/settlement records (get_financial_ledger_summary RPC). This
 * is explicitly NOT the Cashfree Payouts balance — see
 * /api/superadmin/cashfree-payouts for that. Kept at the historical
 * /api/superadmin/wallet path (only the response shape changed) so
 * nothing else that already calls this route breaks; the UI at
 * /superadmin/wallet now presents it under the "GRABIT Financial
 * Ledger" heading rather than as a wallet balance.
 */
export async function GET(request: Request) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? 30);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (Number.isFinite(days) && days > 0 ? days : 30));

  const admin = getSupabaseAdminClient();

  const [{ data: ledgerData, error: ledgerErr }, { data: adjustments, error: adjErr }] = await Promise.all([
    admin.rpc("get_financial_ledger_summary", { p_start: start.toISOString(), p_end: end.toISOString() }),
    admin
      .from("grabit_payout_wallet_ledger")
      .select("id, transaction_type, direction, amount, status, cashfree_order_id, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (ledgerErr || adjErr) {
    return NextResponse.json({ ok: false, error: "Failed to load financial ledger." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    ledger: ledgerData,
    adjustmentHistory: adjustments ?? [],
    rangeDays: days,
  });
}
