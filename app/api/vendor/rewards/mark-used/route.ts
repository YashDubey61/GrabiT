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
  const { data, error } = await admin.rpc("mark_redemption_used", {
    p_code: code,
    p_canteen_id: vendorCtx.canteenId,
    p_vendor_user_id: vendorCtx.userId,
  });

  if (error) {
    const errCode = error.message?.split(":")[0]?.trim() ?? "";
    return NextResponse.json({ ok: false, error: ERROR_MESSAGES[errCode] ?? "Couldn't redeem this code." }, { status: 400 });
  }

  const result = data as { redemptionId: string; rewardName: string; recipientUserId: string; pointsSpent: number };

  try {
    const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
    await createStudentNotification({
      userId: result.recipientUserId,
      type: "REWARD_CODE_USED",
      title: "✅ Reward redeemed",
      message: `Your ${result.rewardName} reward was redeemed successfully.`,
      severity: "SUCCESS",
      category: "REWARDS",
      actionUrl: "/customer/rewards",
    });
  } catch {
    // Non-critical.
  }

  return NextResponse.json({ ok: true, rewardName: result.rewardName });
}
