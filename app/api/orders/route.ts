import { randomBytes, randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { trackProductEvent } from "@/lib/analytics/events";
import { PICKUP_OTP_LENGTH } from "@/lib/orders/pickup_otp";
import { calculateOrderPricing } from "@/lib/pricing/order_pricing";
import { computeRewardCheckoutDiscount, isRewardCodeFormat, type RewardCodeConfig } from "@/lib/rewards/checkout";

interface IncomingOrderItem {
  menuItemId: string;
  quantity: number;
  // Note: Client price is explicitly ignored for security!
  price?: number;
}

interface CreateOrderPayload {
  canteenId: string;
  canteenName?: string;
  slot: string;
  paymentMethod: "wallet";
  items: IncomingOrderItem[];
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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateOrderPayload;

    // 1. Basic Payload Validation
    if (!payload.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Canteen ID is required." },
        { status: 400 },
      );
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Your cart is empty." },
        { status: 400 },
      );
    }

    // This route only ever handles GrabIt Wallet payments — UPI is no
    // longer a standalone GRABIT payment option (online payments,
    // including UPI, go through /api/payments/cashfree/create-order).
    if (payload.paymentMethod !== "wallet") {
      return NextResponse.json(
        { ok: false, error: "Invalid payment method." },
        { status: 400 },
      );
    }

    // A promo code and a reward code can never be combined — one or
    // the other, matching the product's explicit "prefer one, not both" rule.
    if (payload.promoCode && payload.rewardCode) {
      return NextResponse.json(
        { ok: false, error: "Only one promo or reward code can be applied at a time." },
        { status: 400 },
      );
    }

    for (const item of payload.items) {
      if (!item.menuItemId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { ok: false, error: "Cart contains an invalid item quantity." },
          { status: 400 },
        );
      }
    }

    // 2. Derive Student Identity Server-Side strictly from Supabase Auth Session
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to place an order." },
        { status: 401 },
      );
    }

    // Initialize Admin Supabase Client for bypassing RLS during order placement
    const supabase = getSupabaseAdminClient();

    // 3. Authoritative Role Verification from Database
    const { data: userRow } = await supabase
      .from("users")
      .select("id, role, campus_id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow && userRow.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Only students are allowed to place orders." },
        { status: 403 },
      );
    }

    const effectiveCanteenId = payload.canteenId;

    // 4. Authoritative Canteen & Campus Validation
    const { data: canteenRow, error: canteenErr } = await supabase
      .from("canteens")
      .select("id, campus_id, status, name, is_paused, pause_reason, pickup_location")
      .eq("id", effectiveCanteenId)
      .maybeSingle();

    if (canteenErr || !canteenRow) {
      return NextResponse.json(
        { ok: false, error: "The selected vendor could not be found." },
        { status: 400 },
      );
    }

    if (canteenRow.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "This vendor is currently not accepting orders." },
        { status: 400 },
      );
    }

    if (canteenRow.is_paused) {
      return NextResponse.json(
        {
          ok: false,
          error: canteenRow.pause_reason
            ? `This vendor is currently unavailable: ${canteenRow.pause_reason}`
            : "This vendor is currently unavailable.",
        },
        { status: 400 },
      );
    }

    if (userRow?.campus_id && canteenRow.campus_id !== userRow.campus_id) {
      return NextResponse.json(
        { ok: false, error: "This vendor is not available at your selected campus." },
        { status: 400 },
      );
    }

    // 5. Fetch authoritative menu items & validate vendor ownership
    const menuItemIds = payload.items.map((i) => i.menuItemId);
    const { data: dbMenuItems, error: dbErr } = await supabase
      .from("menu_items")
      .select("id, name, price, availability, canteen_id")
      .in("id", menuItemIds);

    if (dbErr || !dbMenuItems || dbMenuItems.length === 0) {
      return NextResponse.json(
        { ok: false, error: "One or more selected menu items could not be found." },
        { status: 400 },
      );
    }

    const menuItemMap = new Map<
      string,
      { name: string; price: number; isAvailable: boolean; canteenId: string }
    >();
    dbMenuItems.forEach((item) => {
      menuItemMap.set(item.id, {
        name: item.name,
        price: Number(item.price),
        isAvailable: item.availability === "available",
        canteenId: item.canteen_id,
      });
    });

    // 6. Compute authoritative server-side totals & enforce cross-vendor protection
    let subtotal = 0;
    const validatedLineItems: {
      menuItemId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of payload.items) {
      const dbItem = menuItemMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { ok: false, error: `Menu item ${item.menuItemId} is not available.` },
          { status: 400 },
        );
      }

      if (dbItem.canteenId !== effectiveCanteenId) {
        return NextResponse.json(
          { ok: false, error: "One or more items do not belong to the selected vendor." },
          { status: 400 },
        );
      }

      if (!dbItem.isAvailable) {
        return NextResponse.json(
          { ok: false, error: `"${dbItem.name}" is currently out of stock.` },
          { status: 400 },
        );
      }

      const lineTotal = dbItem.price * item.quantity;
      subtotal += lineTotal;
      validatedLineItems.push({
        menuItemId: item.menuItemId,
        name: dbItem.name,
        unitPrice: dbItem.price,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // 7. Generate human-readable order number + pickup verification tokens
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

    // Insert the order first (with a placeholder total) so a promo
    // code can be atomically redeemed against a real order_id —
    // redeem_promo_code locks the promo row and inserts the
    // redemption+order_id together, so two concurrent orders can never
    // both slip through a usage limit of 1.
    const { data: createdOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        student_id: user.id,
        canteen_id: effectiveCanteenId,
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
      return NextResponse.json(
        { ok: false, error: "Failed to save order. Please try again." },
        { status: 500 },
      );
    }

    // 7b. Server-side promo code redemption — never trusts a
    // client-supplied discount amount. Rolls back the order on any
    // validation failure so an invalid/expired/limit-exceeded code
    // never results in a placed order.
    let discount = 0;
    if (payload.promoCode) {
      const { data: promoResult, error: promoErr } = await supabase.rpc("redeem_promo_code", {
        p_code: payload.promoCode,
        p_user_id: user.id,
        p_order_id: createdOrder.id,
        p_subtotal: subtotal,
        p_campus_id: userRow?.campus_id ?? null,
        p_canteen_id: effectiveCanteenId,
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
        canteenId: effectiveCanteenId,
        items: validatedLineItems.map((i) => ({ menuItemId: i.menuItemId, lineTotal: i.lineTotal })),
        subtotal,
      });

      if (!discountResult.ok) {
        // The consumption already happened atomically — this is a
        // cart-mismatch case (e.g. required item removed between
        // preview and submit). Undo the consumption and the order.
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

    // Single authoritative pricing calculation — platformFee is ₹2.50
    // when subtotal > ₹25 else ₹0; deliveryCharge is always ₹0. Never
    // trust a client-supplied fee/discount/total.
    const pricing = calculateOrderPricing({ subtotal, discount });
    const platformFee = pricing.platformFee;
    const deliveryCharge = pricing.deliveryCharge;
    const totalAmount = pricing.totalPayable;

    await supabase.from("orders").update({ total_amount: totalAmount }).eq("id", createdOrder.id);

    // 8. Auto-Initialize Wallet & Handle Wallet Debit — skipped
    // entirely when a reward/promo code covers the full order (₹0
    // payable). Nothing to charge, so nothing to debit.
    if (payload.paymentMethod === "wallet" && totalAmount > 0) {
      // Ensure student wallet exists
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingWallet) {
        await supabase.from("wallets").insert({
          user_id: user.id,
          balance: 0,
        });
        await supabase.from("orders").update({ status: "cancelled", cancellation_reason: "Insufficient wallet balance" }).eq("id", createdOrder.id);
        return NextResponse.json(
          {
            ok: false,
            error: `Insufficient wallet balance (Available: ₹0.00, Required: ₹${totalAmount.toFixed(2)}). Please top up your wallet.`,
          },
          { status: 400 },
        );
      }

      const availableBalance = Number(existingWallet.balance ?? 0);
      if (availableBalance < totalAmount) {
        await supabase.from("orders").update({ status: "cancelled", cancellation_reason: "Insufficient wallet balance" }).eq("id", createdOrder.id);
        return NextResponse.json(
          {
            ok: false,
            error: `Insufficient wallet balance (Available: ₹${availableBalance.toFixed(2)}, Required: ₹${totalAmount.toFixed(2)}). Please top up your wallet.`,
          },
          { status: 400 },
        );
      }

      const { data: debitResult, error: debitErr } = await supabase.rpc(
        "debit_student_wallet",
        {
          p_user_id: user.id,
          p_amount: totalAmount,
          p_order_id: createdOrder.id,
        },
      );

      if (debitErr) {
        console.error("Wallet debit RPC error:", debitErr);
        await supabase.from("orders").update({ status: "cancelled", cancellation_reason: "Wallet debit failed" }).eq("id", createdOrder.id);
        return NextResponse.json(
          { ok: false, error: "Failed to debit student wallet. Please try again." },
          { status: 500 },
        );
      }

      const resultObj = debitResult as { ok: boolean; error?: string };
      if (!resultObj || !resultObj.ok) {
        await supabase.from("orders").update({ status: "cancelled", cancellation_reason: "Insufficient wallet balance" }).eq("id", createdOrder.id);
        return NextResponse.json(
          { ok: false, error: resultObj?.error || "Insufficient wallet balance." },
          { status: 400 },
        );
      }
    }

    // 9. Insert order_items
    const orderItemsToInsert = validatedLineItems.map((item) => ({
      order_id: createdOrder.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price_at_order: item.unitPrice,
    }));

    await supabase.from("order_items").insert(orderItemsToInsert);

    // 9b. Deduct stock for each ordered item atomically
    for (const lineItem of validatedLineItems) {
      try {
        await supabase.rpc("adjust_inventory_stock", {
          p_menu_item_id: lineItem.menuItemId,
          p_quantity_delta: -lineItem.quantity,
          p_adjustment_type: "order_deduction",
          p_reason: `Order ${createdOrder.order_number}`,
          p_user_id: user.id,
        });
      } catch (invErr) {
        console.warn("Non-critical inventory deduction warning:", invErr);
      }
    }

    // 11. Insert Audit History Record
    try {
      await supabase.from("order_status_history").insert({
        order_id: createdOrder.id,
        previous_status: null,
        new_status: "placed",
        changed_by: user.id,
        actor_role: "student",
        reason: "Order placed by student",
      });
    } catch (auditErr) {
      console.warn("Non-critical audit log insertion error:", auditErr);
    }

    // 12. Insert Payment Record
    await supabase.from("payments").insert({
      order_id: createdOrder.id,
      method: "wallet",
      amount: totalAmount,
      platform_fee: platformFee,
      vendor_settlement: subtotal,
      status: "success",
    });

    // 13. Server Analytics Event Tracking
    trackProductEvent({
      eventName: "order_created",
      orderId: createdOrder.id,
      canteenId: createdOrder.canteen_id,
      metadata: { totalAmount, paymentMethod: payload.paymentMethod },
    });

    trackProductEvent({
      eventName: payload.paymentMethod === "wallet" ? "payment_succeeded" : "payment_started",
      orderId: createdOrder.id,
      canteenId: createdOrder.canteen_id,
      metadata: { amount: totalAmount, method: payload.paymentMethod },
    });

    // 14. Notifications Side-Effects
    try {
      const orderNum = String(createdOrder.order_number ?? createdOrder.id.slice(0, 6)).replace(/^#/, "");
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      const notifResult = await createStudentNotification({
        userId: user.id,
        type: "ORDER_PLACED",
        title: "Order Placed 🎉",
        message: `Your GRABIT order #${orderNum} has been placed successfully at ${payload.canteenName ?? "Campus Canteen"}.`,
        severity: "INFO",
        category: "ORDERS",
        relatedOrderId: createdOrder.id,
        actionUrl: `/customer/orders/${createdOrder.id}`,
        dedupeKey: `order-status:placed:${createdOrder.id}`,
      });

      if (notifResult.success && !notifResult.alreadyExisted) {
        const { sendStudentOrderPushNotification } = await import(
          "@/lib/notifications/student_push_service"
        );
        await sendStudentOrderPushNotification({
          userId: user.id,
          orderId: createdOrder.id,
          orderNumber: orderNum,
          type: "ORDER_PLACED",
          title: "Order Placed 🎉",
          body: `Your GRABIT order #${orderNum} has been placed successfully at ${payload.canteenName ?? "Campus Canteen"}.`,
          actionUrl: `/customer/orders/${createdOrder.id}`,
        });
      }

      const { createOperationalNotification } = await import("@/lib/notifications/operational_notifications");
      await createOperationalNotification({
        recipientType: "vendor",
        canteenId: createdOrder.canteen_id,
        type: "NEW_ORDER",
        severity: "INFO",
        title: `New Order #${createdOrder.order_number ?? createdOrder.id.slice(0, 6)} Received`,
        message: `${validatedLineItems.length} items totaling ₹${totalAmount}. Slot: ${payload.slot}.`,
        actionUrl: "/vendor",
        relatedOrderId: createdOrder.id,
        dedupeKey: `vendor-new-order:${createdOrder.id}`,
      });

      const { sendVendorNewOrderPushNotification } = await import("@/lib/notifications/vendor_push_service");
      await sendVendorNewOrderPushNotification({
        orderId: createdOrder.id,
        orderNumber: String(createdOrder.order_number ?? createdOrder.id.slice(0, 6)),
        canteenId: createdOrder.canteen_id,
        itemCount: validatedLineItems.length,
        totalAmount,
        slot: payload.slot,
      });
    } catch (notifErr) {
      console.warn("Non-critical notification side-effect error:", notifErr);
    }

    // 14b. Order Confirmation Email — this order is only reached after
    // payment (wallet debit or ₹0 total) already succeeded, so it is
    // always a genuine confirmation. A Resend failure here must never
    // fail the order response; sendOrderConfirmationEmail never throws
    // and is idempotent per order id.
    if (user.email) {
      try {
        const { sendOrderConfirmationEmail } = await import("@/lib/email/email-service");
        await sendOrderConfirmationEmail({
          orderId: createdOrder.id,
          customerEmail: user.email,
          data: {
            customerName: userRow?.full_name || "GRABIT Student",
            orderNumber: createdOrder.order_number ?? createdOrder.id.slice(0, 6),
            orderDateIso: createdOrder.created_at,
            vendorName: payload.canteenName ?? canteenRow.name ?? "Campus Canteen",
            items: validatedLineItems.map((i) => ({ name: i.name, quantity: i.quantity, price: i.unitPrice })),
            subtotal,
            discount,
            deliveryFee: platformFee,
            total: totalAmount,
            pickupLocation: canteenRow.pickup_location ?? null,
          },
        });
      } catch (emailErr) {
        console.warn("Non-critical order confirmation email error:", emailErr);
      }
    }

    // 15. Return Created Order to Client
    return NextResponse.json({
      ok: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.order_number,
        canteenId: createdOrder.canteen_id,
        canteenName: payload.canteenName ?? canteenRow.name ?? "Campus Canteen",
        studentId: createdOrder.student_id,
        slot: payload.slot,
        status: "placed",
        paymentMethod: payload.paymentMethod,
        items: validatedLineItems.map((item) => ({
          id: item.menuItemId,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
          lineTotal: item.lineTotal,
        })),
        subtotal,
        platformFee,
        deliveryCharge,
        promoCode: payload.promoCode && discount > 0 ? payload.promoCode.toUpperCase() : null,
        rewardCode: payload.rewardCode && discount > 0 ? payload.rewardCode : null,
        discount,
        totalAmount,
        createdAt: createdOrder.created_at,
        estimatedReadyAt: new Date(
          new Date(createdOrder.created_at).getTime() + 10 * 60_000,
        ).toISOString(),
      },
    });
  } catch (err) {
    console.error("Server order route error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error creating order." },
      { status: 500 },
    );
  }
}
