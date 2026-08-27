import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { trackProductEvent } from "@/lib/analytics/events";
import { PICKUP_OTP_LENGTH } from "@/lib/orders/pickup_otp";
import { createCashfreeOrder, isCashfreeConfigured, getPaymentModeLabel } from "@/lib/payments/cashfree";
import { calculateOrderPricing } from "@/lib/pricing/order_pricing";
import { computeRewardCheckoutDiscount, isRewardCodeFormat, type RewardCodeConfig } from "@/lib/rewards/checkout";

interface IncomingOrderItem {
  menuItemId: string;
  quantity: number;
  price?: number; // ignored — never trusted
}

interface CreateOrderPayload {
  amount?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderNote?: string;
  returnUrl?: string;
  type?: "wallet" | "order" | "generic";
  // Food order fields:
  canteenId?: string;
  canteenName?: string;
  slot?: string;
  items?: IncomingOrderItem[];
  promoCode?: string | null;
  rewardCode?: string | null;
}

const REWARD_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE_FORMAT: "Enter a valid 16-digit reward code.",
  INVALID_CODE: "This reward code doesn't exist.",
  NOT_YOUR_CODE: "This reward code doesn't belong to your account.",
  CODE_ALREADY_USED: "This reward code has already been used.",
  CODE_EXPIRED: "This reward code has expired.",
  CODE_NOT_VALID: "This reward code is no longer valid.",
  CODE_NOT_APPLICABLE_AT_CHECKOUT: "This reward can't be applied at checkout.",
  CODE_NOT_VALID_FOR_VENDOR: "This reward isn't valid for this vendor.",
  REQUIRED_ITEM_NOT_IN_CART: "Add the required item to your cart to use this reward.",
};

const PROMO_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CODE: "This promo code doesn't exist.",
  CODE_UNAVAILABLE: "This promo code isn't available right now.",
  CODE_NOT_YET_ACTIVE: "This promo code isn't active yet.",
  CODE_EXPIRED: "This promo code has expired.",
  CODE_NOT_VALID_FOR_CAMPUS: "This promo code isn't valid at your campus.",
  CODE_NOT_VALID_FOR_VENDOR: "This promo code isn't valid for this vendor.",
  BELOW_MINIMUM_ORDER: "Your order doesn't meet the minimum amount for this code.",
  USAGE_LIMIT_REACHED: "This promo code has reached its usage limit.",
  PER_USER_LIMIT_REACHED: "You've already used this promo code the maximum number of times.",
};

/**
 * Handles Cashfree order creation for both direct wallet top-up/payments
 * and food checkout orders with full server-side validation.
 */
export async function POST(request: Request) {
  try {
    if (!isCashfreeConfigured()) {
      return NextResponse.json({ ok: false, error: "Online payments are not configured yet." }, { status: 503 });
    }

    const payload = (await request.json()) as CreateOrderPayload;

    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    // 1. Direct wallet top-up / generic payment order flow (when canteenId is not specified)
    if (!payload.canteenId && payload.amount !== undefined) {
      const studentId = user?.id || payload.customerId;
      if (!studentId) {
        return NextResponse.json({ ok: false, error: "Please sign in to make a payment." }, { status: 401 });
      }

      const amount = Number(payload.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ ok: false, error: "Enter a valid amount." }, { status: 400 });
      }

      const admin = getSupabaseAdminClient();
      const { data: userRow } = await admin
        .from("users")
        .select("id, role, full_name, email, phone")
        .eq("id", studentId)
        .maybeSingle();

      const cashfreeOrderId = `GRABIT-WALLET-${randomUUID()}`;

      try {
        const cfOrder = await createCashfreeOrder({
          orderId: cashfreeOrderId,
          orderAmount: amount,
          customerDetails: {
            customerId: studentId,
            customerName: payload.customerName || userRow?.full_name || "GRABIT Student",
            customerEmail: payload.customerEmail || userRow?.email || "student@grabit.app",
            customerPhone: payload.customerPhone || (userRow?.phone && userRow.phone.trim() ? userRow.phone : "9999999999"),
          },
          orderNote: payload.orderNote || "GrabIt Wallet top-up",
          returnUrl: payload.returnUrl,
        });

        await admin.rpc("create_wallet_topup_intent", {
          p_user_id: studentId,
          p_topup_amount: amount,
          p_cashfree_order_id: cashfreeOrderId,
        });

        return NextResponse.json({
          ok: true,
          order_id: cashfreeOrderId,
          cashfreeOrderId,
          payment_session_id: cfOrder.payment_session_id,
          paymentSessionId: cfOrder.payment_session_id,
          order_status: cfOrder.order_status,
          orderStatus: cfOrder.order_status,
          paymentMode: getPaymentModeLabel(),
        });
      } catch (err) {
        console.error("Cashfree generic/wallet order creation failed:", err);
        return NextResponse.json({ ok: false, error: "Couldn't start payment. Please try again." }, { status: 502 });
      }
    }

    // 2. Food order flow
    if (!payload.canteenId) {
      return NextResponse.json({ ok: false, error: "Canteen ID or valid amount is required." }, { status: 400 });
    }
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
    }
    if (payload.promoCode && payload.rewardCode) {
      return NextResponse.json({ ok: false, error: "Only one promo or reward code can be applied at a time." }, { status: 400 });
    }
    for (const item of payload.items) {
      if (!item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ ok: false, error: "Cart contains an invalid item quantity." }, { status: 400 });
      }
    }

    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: "Please sign in to place an order." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: userRow } = await supabase
      .from("users")
      .select("id, role, campus_id, full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow && userRow.role !== "student") {
      return NextResponse.json({ ok: false, error: "Only students are allowed to place orders." }, { status: 403 });
    }

    const { data: canteenRow, error: canteenErr } = await supabase
      .from("canteens")
      .select("id, campus_id, status, name, is_paused, pause_reason")
      .eq("id", payload.canteenId)
      .maybeSingle();

    if (canteenErr || !canteenRow) {
      return NextResponse.json({ ok: false, error: "The selected vendor could not be found." }, { status: 400 });
    }
    if (canteenRow.status !== "active") {
      return NextResponse.json({ ok: false, error: "This vendor is currently not accepting orders." }, { status: 400 });
    }
    if (canteenRow.is_paused) {
      return NextResponse.json(
        { ok: false, error: canteenRow.pause_reason ? `This vendor is currently unavailable: ${canteenRow.pause_reason}` : "This vendor is currently unavailable." },
        { status: 400 },
      );
    }
    if (userRow?.campus_id && canteenRow.campus_id !== userRow.campus_id) {
      return NextResponse.json({ ok: false, error: "This vendor is not available at your selected campus." }, { status: 400 });
    }

    const menuItemIds = payload.items.map((i) => i.menuItemId);
    const { data: dbMenuItems, error: dbErr } = await supabase
      .from("menu_items")
      .select("id, name, price, availability, canteen_id")
      .in("id", menuItemIds);

    if (dbErr || !dbMenuItems || dbMenuItems.length === 0) {
      return NextResponse.json({ ok: false, error: "One or more selected menu items could not be found." }, { status: 400 });
    }

    const menuItemMap = new Map(
      dbMenuItems.map((item) => [
        item.id,
        { name: item.name, price: Number(item.price), isAvailable: item.availability === "available", canteenId: item.canteen_id },
      ]),
    );

    let subtotal = 0;
    const validatedLineItems: { menuItemId: string; name: string; unitPrice: number; quantity: number; lineTotal: number }[] = [];

    for (const item of payload.items) {
      const dbItem = menuItemMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json({ ok: false, error: `Menu item ${item.menuItemId} is not available.` }, { status: 400 });
      }
      if (dbItem.canteenId !== payload.canteenId) {
        return NextResponse.json({ ok: false, error: "One or more items do not belong to the selected vendor." }, { status: 400 });
      }
      if (!dbItem.isAvailable) {
        return NextResponse.json({ ok: false, error: `"${dbItem.name}" is currently out of stock.` }, { status: 400 });
      }
      const lineTotal = dbItem.price * item.quantity;
      subtotal += lineTotal;
      validatedLineItems.push({ menuItemId: item.menuItemId, name: dbItem.name, unitPrice: dbItem.price, quantity: item.quantity, lineTotal });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#${randomSuffix}`;
    const dbSlot: "short_break" | "lunch" =
      payload.slot === "short_break" || payload.slot === "lunch"
        ? payload.slot
        : payload.slot === "1:00 PM" || payload.slot === "1:30 PM" || payload.slot === "LUNCH_1230"
          ? "lunch"
          : "short_break";
    const pickupQrToken = randomBytes(32).toString("hex");
    const pickupOtpCode = String(randomInt(0, 10 ** PICKUP_OTP_LENGTH)).padStart(PICKUP_OTP_LENGTH, "0");

    // Order inserted first (placeholder total) so a promo code can be
    // atomically redeemed against a real order_id — see app/api/orders
    // for the same pattern and its rationale.
    const { data: createdOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        student_id: user.id,
        canteen_id: payload.canteenId,
        order_number: orderNumber,
        status: "placed",
        total_amount: subtotal,
        delivery_charge: 0,
        slot: dbSlot,
        pickup_qr_token: pickupQrToken,
        pickup_qr_created_at: new Date().toISOString(),
        pickup_otp_code: pickupOtpCode,
      })
      .select("id, order_number, created_at, canteen_id, student_id")
      .single();

    if (orderErr || !createdOrder) {
      console.error("Failed to insert order into database:", orderErr);
      return NextResponse.json({ ok: false, error: "Failed to save order. Please try again." }, { status: 500 });
    }

    let discount = 0;
    if (payload.promoCode) {
      const { data: promoResult, error: promoErr } = await supabase.rpc("redeem_promo_code", {
        p_code: payload.promoCode,
        p_user_id: user.id,
        p_order_id: createdOrder.id,
        p_subtotal: subtotal,
        p_campus_id: userRow?.campus_id ?? null,
        p_canteen_id: payload.canteenId,
      });

      if (promoErr) {
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        const code = promoErr.message?.split(":")[0]?.trim() ?? "";
        return NextResponse.json(
          { ok: false, error: PROMO_ERROR_MESSAGES[code] ?? "Couldn't apply promo code. Please try again." },
          { status: 400 },
        );
      }
      discount = Number((promoResult as { discountAmount: number }).discountAmount);
    } else if (payload.rewardCode) {
      if (!isRewardCodeFormat(payload.rewardCode)) {
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        return NextResponse.json({ ok: false, error: REWARD_ERROR_MESSAGES.INVALID_CODE_FORMAT }, { status: 400 });
      }

      const { data: rewardResult, error: rewardErr } = await supabase.rpc("consume_reward_code", {
        p_code: payload.rewardCode,
        p_user_id: user.id,
        p_order_id: createdOrder.id,
      });

      if (rewardErr) {
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        const code = rewardErr.message?.split(":")[0]?.trim() ?? "";
        return NextResponse.json(
          { ok: false, error: REWARD_ERROR_MESSAGES[code] ?? "Couldn't apply reward code. Please try again." },
          { status: 400 },
        );
      }

      const reward = rewardResult as RewardCodeConfig & { redemptionId: string };
      const discountResult = computeRewardCheckoutDiscount(reward, {
        canteenId: payload.canteenId,
        items: validatedLineItems.map((i) => ({ menuItemId: i.menuItemId, lineTotal: i.lineTotal })),
        subtotal,
      });

      if (!discountResult.ok) {
        await supabase
          .from("reward_redemptions")
          .update({ code_status: "GENERATED", redeemed_at: null, order_id: null })
          .eq("id", reward.redemptionId);
        await supabase.from("orders").delete().eq("id", createdOrder.id);
        return NextResponse.json(
          { ok: false, error: REWARD_ERROR_MESSAGES[discountResult.error ?? ""] ?? "This reward can't be applied to your cart." },
          { status: 400 },
        );
      }
      discount = discountResult.discountAmount;
    }

    // Single authoritative pricing calculation, shared with
    // /api/orders — platformFee is ₹2.50 when subtotal > ₹25 else ₹0;
    // deliveryCharge is always ₹0. This is the only amount that will
    // ever be sent to Cashfree or trusted on webhook confirmation.
    const pricing = calculateOrderPricing({ subtotal, discount });
    const platformFee = pricing.platformFee;
    const totalAmount = pricing.totalPayable;

    await supabase.from("orders").update({ total_amount: totalAmount }).eq("id", createdOrder.id);

    await supabase.from("order_items").insert(
      validatedLineItems.map((item) => ({
        order_id: createdOrder.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_order: item.unitPrice,
      })),
    );

    try {
      await supabase.from("order_status_history").insert({
        order_id: createdOrder.id,
        previous_status: null,
        new_status: "placed",
        changed_by: user.id,
        actor_role: "student",
        reason: "Order placed by student (Cashfree payment pending)",
      });
    } catch {
      // Non-critical audit log.
    }

    const { data: paymentRow, error: paymentErr } = await supabase
      .from("payments")
      .insert({
        order_id: createdOrder.id,
        method: "cashfree",
        payment_gateway: "cashfree",
        amount: totalAmount,
        currency: "INR",
        platform_fee: platformFee,
        vendor_settlement: subtotal,
        status: "pending",
      })
      .select("id")
      .single();

    if (paymentErr || !paymentRow) {
      console.error("Failed to insert pending payment row:", paymentErr);
      return NextResponse.json({ ok: false, error: "Failed to start payment. Please try again." }, { status: 500 });
    }

    // A reward/promo code covered the full order — never send a ₹0
    // (or negative) amount to Cashfree. Finalize the order as paid
    // directly, exactly like the existing wallet-payment success path.
    if (totalAmount <= 0) {
      await supabase
        .from("payments")
        .update({ status: "success", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", paymentRow.id);

      trackProductEvent({
        eventName: "payment_succeeded",
        orderId: createdOrder.id,
        canteenId: createdOrder.canteen_id,
        metadata: { amount: 0, method: "reward_or_promo_full_discount" },
      });

      try {
        const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
        await createStudentNotification({
          userId: user.id,
          type: "ORDER_PLACED",
          title: `Order #${createdOrder.order_number} Placed`,
          message: `Your order was fully covered by your ${payload.rewardCode ? "reward" : "promo"} code — nothing to pay.`,
          severity: "SUCCESS",
          category: "ORDERS",
          relatedOrderId: createdOrder.id,
          actionUrl: `/customer/orders/${createdOrder.id}`,
          dedupeKey: `order-placed:${createdOrder.id}`,
        });
      } catch {
        // Non-critical.
      }

      return NextResponse.json({
        ok: true,
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        amount: 0,
        skippedPayment: true,
      });
    }

    // Distinct, unguessable prefix so the webhook can route a Cashfree
    // order id to "this is a customer order payment" without a lookup.
    const cashfreeOrderId = `GRABIT-ORDER-${createdOrder.id}-${randomUUID().slice(0, 8)}`;

    try {
      const cfOrder = await createCashfreeOrder({
        orderId: cashfreeOrderId,
        orderAmount: totalAmount,
        customerDetails: {
          customerId: user.id,
          customerName: userRow?.full_name ?? undefined,
          customerEmail: userRow?.email ?? undefined,
          customerPhone: userRow?.phone && userRow.phone.trim() ? userRow.phone : "9999999999",
        },
        orderNote: `GRABIT order ${createdOrder.order_number}`,
      });

      await supabase
        .from("payments")
        .update({ cashfree_order_id: cashfreeOrderId, updated_at: new Date().toISOString() })
        .eq("id", paymentRow.id);

      trackProductEvent({
        eventName: "payment_started",
        orderId: createdOrder.id,
        canteenId: createdOrder.canteen_id,
        metadata: { amount: totalAmount, method: "cashfree" },
      });

      return NextResponse.json({
        ok: true,
        orderId: createdOrder.id,
        orderNumber: createdOrder.order_number,
        paymentSessionId: cfOrder.payment_session_id,
        cashfreeOrderId,
        amount: totalAmount,
        paymentMode: getPaymentModeLabel(),
      });
    } catch (cfErr) {
      console.error("Cashfree order creation failed:", cfErr);
      // Roll the order forward as failed rather than leaving it stuck —
      // the student sees a clean failure and can retry from checkout.
      await supabase.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("id", paymentRow.id);
      await supabase.from("orders").update({ status: "cancelled", cancellation_reason: "Payment gateway error" }).eq("id", createdOrder.id);
      return NextResponse.json({ ok: false, error: "Couldn't start payment. Please try again." }, { status: 502 });
    }
  } catch (err) {
    console.error("Cashfree create-order route error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error creating payment." }, { status: 500 });
  }
}
