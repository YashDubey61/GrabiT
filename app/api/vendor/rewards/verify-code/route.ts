import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE_FORMAT: "Enter a valid 16-digit reward code.",
  CODE_NOT_FOUND: "This reward code doesn't exist.",
  VENDOR_MISMATCH: "This reward code isn't valid for your vendor.",
  CODE_EXPIRED: "This reward code has expired.",
  CODE_ALREADY_USED: "This reward code has already been used.",
  CODE_NOT_VALID: "This reward code is no longer valid.",
};

/** Read-only check — does not mutate anything. Vendors use this to
 * preview a code before committing to "Mark as Redeemed". */
export async function POST(request: Request) {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied. Please sign in with a vendor account." }, { status: 401 });
  }

  const body = (await request.json()) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (code.length !== 16) {
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES.INVALID_CODE_FORMAT }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("verify_redemption_code", {
    p_code: code,
    p_canteen_id: vendorCtx.canteenId,
  });

  if (error) {
    const errCode = error.message?.split(":")[0]?.trim() ?? "";
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES[errCode] ?? "Couldn't verify this code." }, { status: 400 });
  }

  const result = data as { redemptionId: string; rewardName: string; rewardType: string; canteenName: string; pointsSpent: number };

  return NextResponse.json({
    ok: true,
    valid: true,
    rewardName: result.rewardName,
    rewardType: result.rewardType,
    canteenName: result.canteenName,
    pointsSpent: result.pointsSpent,
  });
}
