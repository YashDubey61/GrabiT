import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Financial-reconciliation view of student wallet top-ups —
 * distinguishes topup vs bonus vs total credit per the ₹500/10% rule,
 * for Super Admin audit. Read-only; wallet crediting only ever happens
 * via the verified Cashfree webhook. */
export async function GET() {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("wallet_topups")
    .select("id, topup_amount, bonus_amount, total_wallet_credit, cashfree_payment_id, status, created_at, users(full_name, grabit_user_id)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to load wallet top-ups." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).map((r) => ({
    id: r.id,
    studentName: r.users?.full_name || r.users?.grabit_user_id || "Student",
    topupAmount: Number(r.topup_amount),
    bonusAmount: Number(r.bonus_amount),
    totalWalletCredit: Number(r.total_wallet_credit),
    cashfreePaymentId: r.cashfree_payment_id,
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ ok: true, topups: rows });
}
