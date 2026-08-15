import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ProductEventName } from "@/lib/analytics/events";

const ALLOWED_EVENTS = new Set<ProductEventName>([
  "student_home_viewed",
  "menu_viewed",
  "menu_item_viewed",
  "cart_item_added",
  "cart_viewed",
  "checkout_started",
  "checkout_submitted",
  "order_created",
  "payment_started",
  "payment_succeeded",
  "payment_failed",
  "order_completed",
  "gold_plan_viewed",
  "gold_purchase_started",
  "gold_purchase_succeeded",
  "wallet_viewed",
  "wallet_topup_started",
]);

// Simple in-memory rate limiter (30 events per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (entry.count >= 30) {
    return true;
  }

  entry.count++;
  return false;
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Too many analytics events." },
        { status: 429 },
      );
    }

    // 2. Parse & Validate Body
    const body = await request.json();
    const {
      event_name,
      anonymous_session_id,
      campus_id,
      canteen_id,
      menu_item_id,
      order_id,
      metadata,
    } = body;

    if (!event_name || typeof event_name !== "string" || !ALLOWED_EVENTS.has(event_name as ProductEventName)) {
      return NextResponse.json(
        { error: "Invalid or unapproved event_name." },
        { status: 400 },
      );
    }

    // Enforce 4KB metadata size limit
    const metaObj = typeof metadata === "object" && metadata !== null ? metadata : {};
    const stringifiedMeta = JSON.stringify(metaObj);
    if (stringifiedMeta.length > 4096) {
      return NextResponse.json(
        { error: "Metadata payload exceeds 4KB limit." },
        { status: 400 },
      );
    }

    // 3. Server-Authoritative Identity Resolution
    // NEVER trust user_id or role sent by client
    let userId: string | null = null;
    let userRole: string | null = null;

    try {
      const supabaseServer = await createServerClient();
      const {
        data: { user },
      } = await supabaseServer.auth.getUser();

      if (user) {
        userId = user.id;
        const { data: profile } = await supabaseServer
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        userRole = profile?.role ?? "student";
      }
    } catch {
      // Unauthenticated event - proceed with anonymous session id
    }

    // 4. Server-Side Insertion into product_analytics_events
    const supabaseAdmin = getSupabaseAdminClient();
    const { error: insertErr } = await supabaseAdmin
      .from("product_analytics_events")
      .insert({
        event_name,
        anonymous_session_id: anonymous_session_id ? String(anonymous_session_id).slice(0, 100) : null,
        user_id: userId,
        role: userRole,
        campus_id: campus_id ? String(campus_id) : null,
        canteen_id: canteen_id ? String(canteen_id) : null,
        menu_item_id: menu_item_id ? String(menu_item_id) : null,
        order_id: order_id ? String(order_id) : null,
        metadata: metaObj,
      });

    if (insertErr) {
      console.error("Failed to insert analytics event:", insertErr);
      return NextResponse.json(
        { error: "Failed to persist analytics event." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Analytics ingestion exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
