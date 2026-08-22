import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Customer-facing Cashfree Payment Gateway view — payments collected
 * from students, straight off the `payments` table. No wallet/payout
 * concepts here at all. */
export async function GET() {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();

  const [{ data: recent }, { data: counts }] = await Promise.all([
    admin
      .from("payments")
      .select("id, order_id, amount, currency, status, cashfree_order_id, cashfree_payment_id, paid_at, created_at")
      .eq("payment_gateway", "cashfree")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("payments").select("status").eq("payment_gateway", "cashfree"),
  ]);

  const summary = { success: 0, pending: 0, failed: 0, refunded: 0 };
  for (const row of counts ?? []) {
    if (row.status === "success") summary.success++;
    else if (row.status === "pending") summary.pending++;
    else if (row.status === "failed") summary.failed++;
    else if (row.status === "refunded") summary.refunded++;
  }

  return NextResponse.json({ ok: true, recent: recent ?? [], summary });
}
