import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { computeRewardCheckoutDiscount, isRewardCodeFormat, type RewardCodeConfig } from "@/lib/rewards/checkout";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

/** Recomputes the subtotal server-side from real DB prices (never
 * trusts a client-supplied subtotal, even for this UX preview). Routes
 * a 16-digit numeric code to reward-code validation, anything else to
 * the Super Admin promo-code system. Nothing is reserved/consumed
 * here — real enforcement happens at order creation. */
export async function POST(request: Request) {
  const supabaseServer = await createServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in." }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: unknown;
    canteenId?: unknown;
    items?: { menuItemId: string; quantity: number }[];
  };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const canteenId = typeof body.canteenId === "string" ? body.canteenId : null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!code) {
    return NextResponse.json({ ok: false, error: "Enter a promo code." }, { status: 400 });
  }
  if (!canteenId || items.length === 0) {
    return NextResponse.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin.from("users").select("campus_id").eq("id", user.id).maybeSingle();

  const menuItemIds = items.map((i) => i.menuItemId);
  const { data: dbItems } = await admin.from("menu_items").select("id, price, canteen_id").in("id", menuItemIds);
  if (!dbItems || dbItems.length === 0) {
    return NextResponse.json({ ok: false, error: "Your cart is empty." }, { status: 400 });
  }
  const priceMap = new Map(dbItems.map((i) => [i.id, Number(i.price)]));
  const cartLines = items.map((item) => ({ menuItemId: item.menuItemId, lineTotal: (priceMap.get(item.menuItemId) ?? 0) * item.quantity }));
  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);

  if (isRewardCodeFormat(code)) {
    const { data, error } = await admin.rpc("preview_reward_code", { p_code: code, p_user_id: user.id });
    if (error) {
      const errCode = error.message?.split(":")[0]?.trim() ?? "";
      return NextResponse.json({ ok: false, error: REWARD_ERROR_MESSAGES[errCode] ?? "Couldn't apply this reward code." }, { status: 400 });
    }

    const reward = data as RewardCodeConfig;
    const discountResult = computeRewardCheckoutDiscount(reward, { canteenId, items: cartLines, subtotal });
    if (!discountResult.ok) {
      return NextResponse.json(
        { ok: false, error: REWARD_ERROR_MESSAGES[discountResult.error ?? ""] ?? "This reward can't be applied to your current cart." },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      codeType: "REWARD",
      code,
      description: `Reward: ${reward.rewardName}`,
      discountType: "REWARD",
      discountAmount: discountResult.discountAmount,
    });
  }

  const { data, error } = await admin.rpc("preview_promo_code", {
    p_code: code,
    p_user_id: user.id,
    p_subtotal: subtotal,
    p_campus_id: profile?.campus_id ?? null,
    p_canteen_id: canteenId,
  });

  if (error) {
    const errCode = error.message?.split(":")[0]?.trim() ?? "";
    return NextResponse.json({ ok: false, error: PROMO_ERROR_MESSAGES[errCode] ?? "Couldn't apply this promo code." }, { status: 400 });
  }

  const result = data as { promoCodeId: string; code: string; description: string | null; discountType: string; discountAmount: number };

  return NextResponse.json({
    ok: true,
    codeType: "PROMO",
    promoCodeId: result.promoCodeId,
    code: result.code,
    description: result.description,
    discountType: result.discountType,
    discountAmount: Number(result.discountAmount),
  });
}
