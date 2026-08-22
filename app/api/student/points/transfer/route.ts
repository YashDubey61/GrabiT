import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getSupabaseAdminClient, displayNameForUser } from "@/lib/rewards/server";
import { validateTransferAmount } from "@/lib/rewards/points_rules";

const ERROR_MESSAGES: Record<string, string> = {
  SELF_TRANSFER: "You can't send points to yourself.",
  INVALID_AMOUNT: "Enter a valid number of points.",
  BELOW_MINIMUM: "You need at least 100 points to send.",
  NOT_MULTIPLE_OF_100: "Points can only be sent in multiples of 100.",
  ABOVE_MAXIMUM: "That's above the maximum you can send in one transfer.",
  SENDER_ACCOUNT_NOT_FOUND: "We couldn't find your points account.",
  RECIPIENT_ACCOUNT_NOT_FOUND: "That student doesn't have a GRABIT Points account yet.",
  INSUFFICIENT_BALANCE: "You don't have enough points for this transfer.",
  DAILY_LIMIT_EXCEEDED: "You've reached your daily points transfer limit.",
};

/**
 * Sends points from the authenticated student to another student.
 * The entire debit/credit/bonus/transaction-record sequence runs
 * inside transfer_points() (see migration 0030) as one Postgres
 * function — if anything fails, the whole thing rolls back, so a
 * sender can never lose points without the recipient gaining them.
 */
export async function POST(request: Request) {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as { recipientId?: unknown; amount?: unknown };
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : null;
  const amount = Number(body.amount);

  if (!recipientId) {
    return NextResponse.json({ ok: false, error: "Select who you're sending points to." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return NextResponse.json({ ok: false, error: "Enter a valid number of points." }, { status: 400 });
  }

  // Defense-in-depth: reject obviously-invalid amounts before even
  // reaching the RPC. transfer_points() (migration 0039) is still the
  // authoritative enforcement — this just avoids a round trip and gives
  // the same friendly message the RPC's own rejection would produce.
  const validation = validateTransferAmount(amount);
  if (!validation.valid) {
    const message =
      validation.reason === "BELOW_MINIMUM"
        ? ERROR_MESSAGES.BELOW_MINIMUM
        : validation.reason === "NOT_MULTIPLE_OF_100"
          ? ERROR_MESSAGES.NOT_MULTIPLE_OF_100
          : ERROR_MESSAGES.INVALID_AMOUNT;
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  // Ensure the sender has an account row before the RPC's row lock
  // (first-time senders otherwise hit SENDER_ACCOUNT_NOT_FOUND).
  await admin.from("reward_accounts").insert({ user_id: ctx.userId }).select().maybeSingle();

  const { data, error } = await admin.rpc("transfer_points", {
    p_sender_id: ctx.userId,
    p_recipient_id: recipientId,
    p_amount: amount,
  });

  if (error) {
    const code = error.message?.split(":")[0]?.trim() ?? "";
    const message = ERROR_MESSAGES[code] ?? "We couldn't complete the transfer. Your points were not deducted.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const result = data as {
    senderBalance: number;
    recipientBalance: number;
    senderBonus: number;
    recipientBonus: number;
  };

  try {
    const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
    const senderName = ctx.displayName;
    const recipientName = await displayNameForUser(recipientId);

    await createStudentNotification({
      userId: recipientId,
      type: "POINTS_RECEIVED",
      title: "You received GRABIT Points!",
      message: `${senderName} sent you ${amount} GRABIT Points.`,
      severity: "SUCCESS",
      category: "REWARDS",
      actionUrl: "/customer/rewards",
    });

    if (result.senderBonus > 0) {
      await createStudentNotification({
        userId: ctx.userId,
        type: "GIFT_BONUS_EARNED",
        title: "Gift bonus earned",
        message: `You earned a +${result.senderBonus} bonus for sending points to ${recipientName}.`,
        severity: "SUCCESS",
        category: "REWARDS",
        actionUrl: "/customer/rewards",
      });
    }
    if (result.recipientBonus > 0) {
      await createStudentNotification({
        userId: recipientId,
        type: "GIFT_BONUS_EARNED",
        title: "Gift bonus earned",
        message: `You earned a +${result.recipientBonus} bonus for receiving points!`,
        severity: "SUCCESS",
        category: "REWARDS",
        actionUrl: "/customer/rewards",
      });
    }
  } catch {
    // Notifications are non-critical — the transfer already succeeded.
  }

  return NextResponse.json({ ok: true, ...result });
}
