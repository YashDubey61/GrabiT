import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyRazorpaySignature, GOLD_PLANS, type GoldPlanId } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to verify your payment." },
        { status: 401 },
      );
    }

    // Role Guard: Reject non-students
    const { data: profiles } = await supabaseServer
      .from("users")
      .select("role")
      .eq("id", user.id)
      .limit(1);

    if (!profiles || profiles.length === 0 || profiles[0].role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only student accounts can activate Gold." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const requestedPlan: GoldPlanId = body.plan === "gold_semester" ? "gold_semester" : "gold_monthly";

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Missing required Razorpay payment verification parameters." },
        { status: 400 },
      );
    }

    // Server-side HMAC SHA256 Signature Verification
    const isValidSignature = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      return NextResponse.json(
        { ok: false, error: "Invalid Razorpay payment signature. Payment verification failed." },
        { status: 400 },
      );
    }

    // Service-role Supabase client for idempotent database transactions
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createAdminClient(url, serviceKey);

    // 1. Idempotency Check: Verify if this payment has already been recorded
    const { data: existingPayments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .limit(1);

    if (existingPayments && existingPayments.length > 0 && existingPayments[0].status === "success") {
      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("renews_at", { ascending: false })
        .limit(1);

      return NextResponse.json({
        ok: true,
        message: "Payment already verified.",
        subscription: existingSub?.[0] ?? null,
      });
    }

    // 2. Server-authoritative plan calculation
    const planDetails = GOLD_PLANS[requestedPlan];
    const durationDays = planDetails.durationDays;

    // Check if student has an active subscription to extend
    const { data: currentSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
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

    // 3. Upsert Subscription (server-calculated renewal date & active status)
    const { data: subData, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan: planDetails.id,
          status: "active",
          renews_at: renewsAt,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (subError) {
      // Fallback if user_id unique constraint not present on table
      const { data: subDataFallback } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan: planDetails.id,
          status: "active",
          renews_at: renewsAt,
        })
        .select()
        .single();

      // Record payment
      await supabaseAdmin.from("payments").insert({
        user_id: user.id,
        method: "upi",
        razorpay_order_id,
        razorpay_payment_id,
        amount: planDetails.priceRupees,
        platform_fee: 0,
        vendor_settlement: 0,
        status: "success",
      });

      return NextResponse.json({
        ok: true,
        subscription: subDataFallback,
      });
    }

    // 4. Record Payment Ledger Row
    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      method: "upi",
      razorpay_order_id,
      razorpay_payment_id,
      amount: planDetails.priceRupees,
      platform_fee: 0,
      vendor_settlement: 0,
      status: "success",
    });

    // 5. Fail-Safe Student Notification Side-Effect (PAYMENT_SUCCESS & GOLD_ACTIVATED)
    try {
      const { createStudentNotification } = await import("@/lib/notifications/student_notifications");
      await createStudentNotification({
        userId: user.id,
        type: "PAYMENT_SUCCESS",
        title: "Payment Verified via Razorpay",
        message: `Your payment of ₹${planDetails.priceRupees} for GrabIt Gold was verified successfully.`,
        severity: "SUCCESS",
        category: "PAYMENTS",
        dedupeKey: `payment-success:${razorpay_payment_id}`,
      });

      await createStudentNotification({
        userId: user.id,
        type: "GOLD_ACTIVATED",
        title: "GrabIt Gold Subscription Active!",
        message: `Welcome to GrabIt Gold! Enjoy 0% platform fee and priority pickup lanes.`,
        severity: "SUCCESS",
        category: "GOLD",
        actionUrl: "/student/profile",
        dedupeKey: `gold-activated:${user.id}:${razorpay_payment_id}`,
      });
    } catch (notifErr) {
      console.warn("Non-critical payment notification side-effect error:", notifErr);
    }

    return NextResponse.json({
      ok: true,
      subscription: subData ?? null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to complete payment verification." },
      { status: 500 },
    );
  }
}
