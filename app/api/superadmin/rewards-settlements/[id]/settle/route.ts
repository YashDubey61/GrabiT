import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: "Access denied.",
  REDEMPTION_NOT_FOUND: "Redemption not found.",
  NOT_YET_USED: "This reward hasn't been used by a vendor yet — it cannot be settled.",
  ALREADY_SETTLED: "This redemption has already been settled.",
  INVALID_SETTLEMENT_AMOUNT: "Enter a valid settlement amount.",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthenticatedSuperAdminContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied. Super Admin authorization required." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { settlementAmount?: unknown; reference?: unknown; notes?: unknown };
  const settlementAmount = Number(body.settlementAmount);
  if (!Number.isFinite(settlementAmount) || settlementAmount < 0) {
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES.INVALID_SETTLEMENT_AMOUNT }, { status: 400 });
  }
  const reference = typeof body.reference === "string" ? body.reference.slice(0, 200) : null;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : null;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("settle_redemption", {
    p_redemption_id: id,
    p_admin_id: ctx.user.id,
    p_settlement_amount: settlementAmount,
    p_reference: reference,
    p_notes: notes,
  });

  if (error) {
    const errCode = error.message?.split(":")[0]?.trim() ?? "";
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES[errCode] ?? "Couldn't settle this redemption." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, result: data });
}
