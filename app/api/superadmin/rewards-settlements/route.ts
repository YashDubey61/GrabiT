import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function maskCode(code: string | null): string {
  if (!code || code.length !== 16) return "•••• •••• •••• ••••";
  return `•••• •••• •••• ${code.slice(-4)}`;
}

export async function GET(request: Request) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "true";

  const admin = getSupabaseAdminClient();
  let query = admin
    .from("reward_redemptions")
    .select(
      "id, points_spent, code_status, redemption_code, redeemed_at, created_at, settlement_status, settlement_amount, settlement_reference, settled_at, " +
        "user_id, gifted_to_user_id, order_id, users!reward_redemptions_user_id_fkey(full_name, grabit_user_id), orders(order_number), " +
        "rewards(name, funding_type, grabit_cost, vendor_cost, discount_amount, canteens(id, name))",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (!includeAll) {
    query = query.in("code_status", ["USED", "EXPIRED"]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to load settlements." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).map((r) => ({
    id: r.id,
    studentName: r.users?.full_name || r.users?.grabit_user_id || "Student",
    rewardName: r.rewards?.name ?? "Reward",
    vendorName: r.rewards?.canteens?.name ?? "—",
    code: r.redemption_code,
    maskedCode: maskCode(r.redemption_code),
    orderNumber: r.orders?.order_number ?? null,
    pointsSpent: r.points_spent,
    fundingType: r.rewards?.funding_type ?? "GRABIT",
    grabitCost: r.rewards?.grabit_cost ?? r.rewards?.discount_amount ?? 0,
    vendorCost: r.rewards?.vendor_cost ?? 0,
    codeStatus: r.code_status,
    redeemedAt: r.redeemed_at,
    createdAt: r.created_at,
    settlementStatus: r.settlement_status,
    settlementAmount: r.settlement_amount,
    settlementReference: r.settlement_reference,
    settledAt: r.settled_at,
  }));

  return NextResponse.json({ ok: true, redemptions: rows });
}
