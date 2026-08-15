import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyRazorpayWebhookSignature, GOLD_PLANS, type GoldPlanId } from "@/lib/payments/razorpay";

export async function POST(request: Request) {
  try {
    // 1. Extract RAW Request Body for HMAC Signature Verification
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-razorpay-signature") || "";

    // 2. Verify Webhook Signature (Strict Security Requirement)
    const isValidSignature = verifyRazorpayWebhookSignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      return NextResponse.json(
        { ok: false, error: "Invalid Razorpay webhook signature." },
        { status: 400 },
      );
    }

    // 3. Parse Verified Payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Malformed JSON webhook payload." },
        { status: 400 },
      );
    }

    const eventType = payload.event || "unknown";
    const eventId =
      payload.event_id ||
      request.headers.get("x-razorpay-event-id") ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 4. Initialize Supabase Admin Client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createAdminClient(url, serviceKey);

    // 5. Idempotency Check: Verify if eventId has already been processed
    const { data: existingEvents } = await supabaseAdmin
      .from("payment_webhook_events")
      .select("*")
      .eq("event_id", eventId)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return NextResponse.json(
        { ok: true, message: "Duplicate webhook event ignored." },
        { status: 200 },
      );
    }

    // Extract Entities
    const paymentEntity = payload.payload?.payment?.entity || {};
    const orderEntity = payload.payload?.order?.entity || {};
    const razorpay_order_id = paymentEntity.order_id || orderEntity.id || "";
    const razorpay_payment_id = paymentEntity.id || "";
    const currency = paymentEntity.currency || orderEntity.currency || "INR";

    // Currency Guard: Reject unexpected currencies
    if (currency !== "INR") {
      await supabaseAdmin.from("payment_webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        razorpay_order_id,
        razorpay_payment_id,
        status: "ignored_currency",
        payload_summary: { error: `Unsupported currency: ${currency}` },
      });

      return NextResponse.json(
        { ok: true, message: `Ignored event with non-INR currency: ${currency}` },
        { status: 200 },
      );
    }

    // 6. Process Canonical Webhook Events
    if (eventType === "payment.captured" || eventType === "order.paid") {
      // Find corresponding internal payment record
      let userId: string | null = null;
      let targetPlan: GoldPlanId = "gold_monthly";

      if (razorpay_order_id || razorpay_payment_id) {
        let query = supabaseAdmin.from("payments").select("*");
        if (razorpay_order_id) {
          query = query.eq("razorpay_order_id", razorpay_order_id);
        } else {
          query = query.eq("razorpay_payment_id", razorpay_payment_id);
        }
        const { data: matchedPayments } = await query.limit(1);

        if (matchedPayments && matchedPayments.length > 0) {
          const p = matchedPayments[0];
          userId = p.user_id;

          // Update internal payment status
          await supabaseAdmin
            .from("payments")
            .update({
              status: "success",
              razorpay_payment_id: razorpay_payment_id || p.razorpay_payment_id,
            })
            .eq("id", p.id);
        }
      }

      // Check notes for user_id and plan_id fallback if not resolved from payments table
      const notes = paymentEntity.notes || orderEntity.notes || {};
      if (!userId && notes.user_id) {
        userId = notes.user_id;
      }
      if (notes.plan_id === "gold_semester") {
        targetPlan = "gold_semester";
      }

      // Confirm / Activate Subscription for user if resolved
      if (userId) {
        const planDetails = GOLD_PLANS[targetPlan];
        const durationDays = planDetails.durationDays;

        const { data: currentSubs } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
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

        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: planDetails.id,
            status: "active",
            renews_at: renewsAt,
          },
          { onConflict: "user_id" },
        );
      }
    } else if (eventType === "payment.failed") {
      if (razorpay_order_id || razorpay_payment_id) {
        let query = supabaseAdmin.from("payments").select("id");
        if (razorpay_order_id) {
          query = query.eq("razorpay_order_id", razorpay_order_id);
        } else {
          query = query.eq("razorpay_payment_id", razorpay_payment_id);
        }
        const { data: matchedPayments } = await query.limit(1);

        if (matchedPayments && matchedPayments.length > 0) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed" })
            .eq("id", matchedPayments[0].id);
        }
      }
    } else if (eventType === "refund.processed" || eventType === "refund.created") {
      if (razorpay_payment_id) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "refunded" })
          .eq("razorpay_payment_id", razorpay_payment_id);
      }
    }

    // 7. Audit Event Registration
    await supabaseAdmin.from("payment_webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
      razorpay_order_id: razorpay_order_id || null,
      razorpay_payment_id: razorpay_payment_id || null,
      status: "processed",
      payload_summary: {
        event: eventType,
        amount: paymentEntity.amount,
        currency,
      },
    });

    return NextResponse.json(
      { ok: true, event: eventType, status: "processed" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal webhook processing error." },
      { status: 500 },
    );
  }
}
