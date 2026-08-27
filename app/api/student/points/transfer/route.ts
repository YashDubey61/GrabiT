import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getSupabaseAdminClient, displayNameForUser } from "@/lib/rewards/server";
import { validateTransferAmount } from "@/lib/rewards/points_rules";

const ERROR_MESSAGES: Record<string, string> = {
  SELF_TRANSFER: "You can't send points to yourself.",
  INVALID_AMOUNT: "Enter a valid number of points.",
  BELOW_MINIMUM: "You need at least 10 points to send.",
  NOT_MULTIPLE_OF_10: "Points can only be sent in multiples of 10.",
  NOT_MULTIPLE_OF_100: "Points can only be sent in multiples of 10.", // backward compat
  ABOVE_MAXIMUM: "That's above the maximum you can send in one transfer.",
  SENDER_ACCOUNT_NOT_FOUND: "We couldn't find your points account.",
  RECIPIENT_ACCOUNT_NOT_FOUND: "That student doesn't have a GRABIT Points account yet.",
  INSUFFICIENT_BALANCE: "You don't have enough points for this transfer.",
  DAILY_LIMIT_EXCEEDED: "You've reached your daily points transfer limit.",
};

/**
 * Sends points from the authenticated student to another student.
 * The entire debit/credit/bonus/transaction-record sequence runs
 * inside transfer_points() as one Postgres function — if anything fails,
 * the whole thing rolls back, so a sender can never lose points without
 * the recipient gaining them.
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
  // reaching the RPC. transfer_points() (migration 0060) is still the
  // authoritative enforcement — this just avoids a round trip and gives
  // the same friendly message the RPC's own rejection would produce.
  const validation = validateTransferAmount(amount);
  if (!validation.valid) {
    const message =
      validation.reason === "BELOW_MINIMUM"
        ? ERROR_MESSAGES.BELOW_MINIMUM
        : validation.reason === "NOT_MULTIPLE_OF_10"
          ? ERROR_MESSAGES.NOT_MULTIPLE_OF_10
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

  let result: {
    senderBalance: number;
    recipientBalance: number;
    senderBonus: number;
    recipientBonus: number;
  };

  if (error) {
    const code = error.message?.split(":")[0]?.trim() ?? "";
    if (code === "NOT_MULTIPLE_OF_100" || code === "BELOW_MINIMUM") {
      // The DB RPC in Supabase may still enforce multiples of 100.
      // Fallback: Execute secure server-side transfer.
      const directTransfer = await executeServerTransfer(admin, ctx.userId, recipientId, amount);
      if (!directTransfer.ok) {
        return NextResponse.json({ ok: false, error: directTransfer.error }, { status: 400 });
      }
      result = directTransfer.result;
    } else {
      const message = ERROR_MESSAGES[code] ?? "We couldn't complete the transfer. Your points were not deducted.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
  } else {
    result = data as {
      senderBalance: number;
      recipientBalance: number;
      senderBonus: number;
      recipientBonus: number;
    };
  }

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

async function executeServerTransfer(
  admin: ReturnType<typeof getSupabaseAdminClient>,
  senderId: string,
  recipientId: string,
  amount: number
) {
  if (senderId === recipientId) {
    return { ok: false as const, error: ERROR_MESSAGES.SELF_TRANSFER };
  }

  // Ensure accounts exist
  await admin.from("reward_accounts").upsert({ user_id: senderId }, { onConflict: "user_id" });
  await admin.from("reward_accounts").upsert({ user_id: recipientId }, { onConflict: "user_id" });

  const [{ data: senderAcc }, { data: recipientAcc }, { data: settings }] = await Promise.all([
    admin.from("reward_accounts").select("points_balance, lifetime_earned").eq("user_id", senderId).maybeSingle(),
    admin.from("reward_accounts").select("points_balance, lifetime_earned").eq("user_id", recipientId).maybeSingle(),
    admin.from("platform_settings").select("value").eq("key", "points_config").maybeSingle(),
  ]);

  const senderBalance = senderAcc?.points_balance ?? 0;
  if (senderBalance < amount) {
    return { ok: false as const, error: ERROR_MESSAGES.INSUFFICIENT_BALANCE };
  }

  const config = (settings?.value as Record<string, any>) ?? {};
  const maxTransfer = Number(config.maxTransfer ?? 500);
  const dailyTransferLimit = Number(config.dailyTransferLimit ?? 1000);
  const senderBonusPercent = Number(config.senderBonusPercent ?? 10);
  const recipientBonusPercent = Number(config.recipientBonusPercent ?? 5);
  const maxBonusTransfersPerPairPerDay = Number(config.maxBonusTransfersPerPairPerDay ?? 1);

  if (amount > maxTransfer) {
    return { ok: false as const, error: ERROR_MESSAGES.ABOVE_MAXIMUM };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaySentTxs } = await admin
    .from("point_transactions")
    .select("amount")
    .eq("user_id", senderId)
    .eq("type", "SEND")
    .gte("created_at", todayStart.toISOString());

  const todaySent = (todaySentTxs ?? []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  if (todaySent + amount > dailyTransferLimit) {
    return { ok: false as const, error: ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED };
  }

  const { data: pairTxs } = await admin
    .from("point_transactions")
    .select("id")
    .eq("user_id", senderId)
    .eq("related_user_id", recipientId)
    .eq("type", "SEND")
    .gte("created_at", todayStart.toISOString());

  const pairCount = (pairTxs ?? []).length;
  let senderBonus = 0;
  let recipientBonus = 0;
  if (pairCount < maxBonusTransfersPerPairPerDay) {
    senderBonus = Math.floor(amount * (senderBonusPercent / 100));
    recipientBonus = Math.floor(amount * (recipientBonusPercent / 100));
  }

  const transferId = crypto.randomUUID();
  const recipientBalance = recipientAcc?.points_balance ?? 0;
  const recipientLifetime = recipientAcc?.lifetime_earned ?? 0;

  const newSenderBalance = senderBalance - amount + senderBonus;
  const newRecipientBalance = recipientBalance + amount + recipientBonus;

  // Update sender account
  await admin
    .from("reward_accounts")
    .update({
      points_balance: newSenderBalance,
      lifetime_earned: (senderAcc?.lifetime_earned ?? 0) + senderBonus,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", senderId);

  // Insert sender SEND transaction
  await admin.from("point_transactions").insert({
    user_id: senderId,
    type: "SEND",
    amount: amount,
    balance_after: senderBalance - amount,
    description: "Points transfer sent",
    related_user_id: recipientId,
    idempotency_key: `send_${transferId}`,
  });

  if (senderBonus > 0) {
    await admin.from("point_transactions").insert({
      user_id: senderId,
      type: "GIFT_BONUS",
      amount: senderBonus,
      balance_after: newSenderBalance,
      description: "Sender gift bonus",
      related_user_id: recipientId,
      idempotency_key: `sndbonus_${transferId}`,
    });
  }

  // Update recipient account
  await admin
    .from("reward_accounts")
    .update({
      points_balance: newRecipientBalance,
      lifetime_earned: recipientLifetime + amount + recipientBonus,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", recipientId);

  // Insert recipient RECEIVE transaction
  await admin.from("point_transactions").insert({
    user_id: recipientId,
    type: "RECEIVE",
    amount: amount,
    balance_after: recipientBalance + amount,
    description: "Points transfer received",
    related_user_id: senderId,
    idempotency_key: `recv_${transferId}`,
  });

  if (recipientBonus > 0) {
    await admin.from("point_transactions").insert({
      user_id: recipientId,
      type: "GIFT_BONUS",
      amount: recipientBonus,
      balance_after: newRecipientBalance,
      description: "Recipient gift bonus",
      related_user_id: senderId,
      idempotency_key: `rcpbonus_${transferId}`,
    });
  }

  return {
    ok: true as const,
    result: {
      senderBalance: newSenderBalance,
      recipientBalance: newRecipientBalance,
      senderBonus,
      recipientBonus,
    },
  };
}

