import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedStudentContext, getSupabaseAdminClient } from "@/lib/rewards/server";
import { PICKUP_OTP_LENGTH } from "@/lib/orders/pickup_otp";

const ERROR_MESSAGES: Record<string, string> = {
  SELF_GIFT: "You can't gift a reward to yourself.",
  REWARD_NOT_FOUND: "This reward is no longer available.",
  REWARD_INACTIVE: "This reward is no longer available.",
  REWARD_NOT_YET_AVAILABLE: "This reward isn't available yet.",
  REWARD_EXPIRED: "This reward has expired.",
  REWARD_NOT_GIFTABLE: "This reward can't be gifted — only redeemed for yourself.",
  OUT_OF_STOCK: "This reward is out of stock.",
  REDEMPTION_LIMIT_REACHED: "You've already redeemed this reward the maximum number of times.",
  INSUFFICIENT_POINTS: "You don't have enough points for this reward.",
};

/**
 * Redeems a reward — for the student themself, or as a gift to a
 * friend. redeem_reward() (migration 0030) atomically checks
 * availability/limits, debits points, and records the redemption in
 * one Postgres function. When the reward is a FOOD_ITEM with a real
 * menu_item_id, this route then creates an actual `orders` row for the
 * recipient so it flows through the existing vendor kitchen/QR-pickup
 * pipeline exactly like a paid order — just funded by points instead
 * of the wallet.
 */
export async function POST(request: Request) {
  const ctx = await getAuthenticatedStudentContext();
  if (!ctx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as { rewardId?: unknown; giftToUserId?: unknown };
  const rewardId = typeof body.rewardId === "string" ? body.rewardId : null;
  const giftToUserId = typeof body.giftToUserId === "string" ? body.giftToUserId : null;

  if (!rewardId) {
    return NextResponse.json({ ok: false, error: "Select a reward to redeem." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const { data, error } = await admin.rpc("redeem_reward", {
    p_user_id: ctx.userId,
    p_reward_id: rewardId,
    p_gift_to_user_id: giftToUserId,
  });

  if (error) {
    const code = error.message?.split(":")[0]?.trim() ?? "";
    const message = ERROR_MESSAGES[code] ?? "We couldn't complete this redemption. Your points were not deducted.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const result = data as {
    redemptionId: string;
    balance: number;
    rewardType: "FOOD_ITEM" | "DISCOUNT" | "PERK";
    menuItemId: string | null;
    canteenId: string | null;
    rewardName: string;
    recipientId: string;
    isGift: boolean;
    redemptionCode: string;
    expiresAt: string;
  };

  let orderId: string | null = null;
  let orderNumber: string | null = null;

  // Only FOOD_ITEM rewards with a real menu item linked spawn an
  // actual order — DISCOUNT/PERK rewards, and any FOOD_ITEM without a
  // vendor-linked menu item yet, stay a pure points redemption record.
  if (result.rewardType === "FOOD_ITEM" && result.menuItemId && result.canteenId) {
    try {
      const { data: menuItem } = await admin
        .from("menu_items")
        .select("id, name, price")
        .eq("id", result.menuItemId)
        .maybeSingle();

      if (menuItem) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const pickupQrToken = randomBytes(32).toString("hex");
        const pickupOtpCode = String(randomInt(0, 10 ** PICKUP_OTP_LENGTH)).padStart(PICKUP_OTP_LENGTH, "0");

        const { data: createdOrder, error: orderErr } = await admin
          .from("orders")
          .insert({
            student_id: result.recipientId,
            canteen_id: result.canteenId,
            order_number: `#${randomSuffix}`,
            status: "placed",
            total_amount: Number(menuItem.price),
            slot: "short_break",
            pickup_qr_token: pickupQrToken,
            pickup_qr_created_at: new Date().toISOString(),
            pickup_otp_code: pickupOtpCode,
            gifted_by_id: result.isGift ? ctx.userId : null,
          })
          .select("id, order_number")
          .single();

        if (!orderErr && createdOrder) {
          await admin.from("order_items").insert({
            order_id: createdOrder.id,
            menu_item_id: menuItem.id,
            quantity: 1,
            price_at_order: menuItem.price,
          });
          orderId = createdOrder.id;
          orderNumber = createdOrder.order_number;
          await admin.from("reward_redemptions").update({ order_id: createdOrder.id }).eq("id", result.redemptionId);
        }
      }
    } catch {
      // The points redemption already succeeded; a missing/broken menu
      // item link just means no auto-order was created for it.
    }
  }

  try {
    const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
    const formattedCode = result.redemptionCode.replace(/(\d{4})(?=\d)/g, "$1 ");
    if (result.isGift) {
      const senderName = ctx.displayName;
      await createStudentNotification({
        userId: result.recipientId,
        type: result.rewardType === "FOOD_ITEM" ? "FOOD_GIFT_RECEIVED" : "REWARD_GIFT_RECEIVED",
        title: "🎁 " + result.rewardName + " is ready!",
        message: `${senderName} gifted you ${result.rewardName}. Reward code: ${formattedCode}. Show this code at the vendor.`,
        severity: "SUCCESS",
        category: "REWARDS",
        relatedOrderId: orderId,
        actionUrl: "/customer/rewards",
      });
    } else {
      await createStudentNotification({
        userId: ctx.userId,
        type: "POINTS_REDEEMED",
        title: "🎁 " + result.rewardName + " is ready!",
        message: `Reward code: ${formattedCode}. Show this code at the vendor.`,
        severity: "SUCCESS",
        category: "REWARDS",
        relatedOrderId: orderId,
        actionUrl: "/customer/rewards",
      });
    }
  } catch {
    // Non-critical.
  }

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    redemptionId: result.redemptionId,
    orderId,
    orderNumber,
    redemptionCode: result.isGift ? null : result.redemptionCode,
    expiresAt: result.isGift ? null : result.expiresAt,
  });
}
