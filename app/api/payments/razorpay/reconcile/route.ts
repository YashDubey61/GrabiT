import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { GOLD_PLANS, type GoldPlanId } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to access payment reconciliation." },
        { status: 401 },
      );
    }

    // Strict Authorization: Require Super Admin Role
    const { data: profiles } = await supabaseServer
      .from("users")
      .select("role")
      .eq("id", user.id)
      .limit(1);

    if (!profiles || profiles.length === 0 || profiles[0].role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only Super Admin can perform payment reconciliation." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { razorpay_payment_id, razorpay_order_id, target_user_id, plan_id } = body;

    if (!razorpay_payment_id && !razorpay_order_id) {
      return NextResponse.json(
        { ok: false, error: "Either razorpay_payment_id or razorpay_order_id is required." },
        { status: 400 },
      );
    }

    // Service-role client for administrative data repair
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createAdminClient(url, serviceKey);

    // 1. Locate internal payment record
    let query = supabaseAdmin.from("payments").select("*");
    if (razorpay_payment_id) {
      query = query.eq("razorpay_payment_id", razorpay_payment_id);
    } else {
      query = query.eq("razorpay_order_id", razorpay_order_id);
    }
    const { data: payments } = await query.limit(1);

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Internal payment record not found for reconciliation." },
        { status: 404 },
      );
    }

    const p = payments[0];
    const resolvedUserId = target_user_id || p.user_id;

    if (!resolvedUserId) {
      return NextResponse.json(
        { ok: false, error: "User relationship cannot be resolved for this payment." },
        { status: 400 },
      );
    }

    // 2. Safe Repair: If payment is success, ensure subscription is active
    const selectedPlan: GoldPlanId = plan_id === "gold_semester" ? "gold_semester" : "gold_monthly";
    const planDetails = GOLD_PLANS[selectedPlan];
    const durationDays = planDetails.durationDays;

    const { data: currentSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", resolvedUserId)
      .eq("status", "active")
      .order("renews_at", { ascending: false })
      .limit(1);

    let baseTime = Date.now();
    if (currentSubs && currentSubs.length > 0) {
      const existingRenews = new Date(currentSubs[0].renews_at).getTime();
      if (existingRenews > baseTime) {
        baseTime = existingRenews;
      }
    }

    const renewsAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Reconcile payment status to success if needed
    if (p.status !== "success") {
      await supabaseAdmin.from("payments").update({ status: "success" }).eq("id", p.id);
    }

    // Reconcile subscription state
    const { data: reconciledSub } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: resolvedUserId,
          plan: selectedPlan,
          status: "active",
          renews_at: renewsAt,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    return NextResponse.json({
      ok: true,
      message: "Payment and subscription successfully reconciled.",
      paymentId: p.id,
      userId: resolvedUserId,
      subscription: reconciledSub,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal error during payment reconciliation." },
      { status: 500 },
    );
  }
}
