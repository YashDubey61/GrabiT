import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, GOLD_PLANS, type GoldPlanId } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to purchase GrabIt Gold." },
        { status: 401 },
      );
    }

    // Role Guard: Only students can purchase student Gold subscriptions
    const { data: profiles } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .limit(1);

    if (!profiles || profiles.length === 0 || profiles[0].role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only student accounts can purchase Gold subscriptions." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedPlan: GoldPlanId = body.plan === "gold_semester" ? "gold_semester" : "gold_monthly";

    // Server-authoritative plan pricing check
    const planDetails = GOLD_PLANS[requestedPlan];
    if (!planDetails) {
      return NextResponse.json(
        { ok: false, error: "Invalid subscription plan selected." },
        { status: 400 },
      );
    }

    const receipt = `rcpt_gold_${user.id.slice(0, 8)}_${Date.now()}`;
    const orderResult = await createRazorpayOrder(requestedPlan, receipt);

    if (!orderResult.ok || !orderResult.razorpayOrderId) {
      return NextResponse.json(
        { ok: false, error: orderResult.error ?? "Failed to create Razorpay payment order." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      razorpayOrderId: orderResult.razorpayOrderId,
      amount: orderResult.amount, // Server-authoritative amount in INR (₹49 or ₹199)
      currency: orderResult.currency,
      keyId: orderResult.keyId,
      plan: requestedPlan,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to process payment request. Please try again." },
      { status: 500 },
    );
  }
}
