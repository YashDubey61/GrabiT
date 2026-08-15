import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Student authentication required." },
        { status: 401 },
      );
    }

    const { data } = await supabase
      .from("student_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const preferences = data ?? {
      user_id: user.id,
      order_updates_enabled: true,
      payment_updates_enabled: true,
      wallet_updates_enabled: true,
      gold_updates_enabled: true,
      recommendation_updates_enabled: true,
      marketing_enabled: false,
    };

    return NextResponse.json({ preferences }, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch notification preferences:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Student authentication required." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const payload = {
      user_id: user.id,
      order_updates_enabled: Boolean(body.order_updates_enabled ?? true),
      payment_updates_enabled: Boolean(body.payment_updates_enabled ?? true),
      wallet_updates_enabled: Boolean(body.wallet_updates_enabled ?? true),
      gold_updates_enabled: Boolean(body.gold_updates_enabled ?? true),
      recommendation_updates_enabled: Boolean(body.recommendation_updates_enabled ?? true),
      marketing_enabled: Boolean(body.marketing_enabled ?? false),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("student_notification_preferences")
      .upsert(payload);

    if (error) {
      return NextResponse.json(
        { error: "Failed to save preferences." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, preferences: payload }, { status: 200 });
  } catch (err) {
    console.error("Failed to update notification preferences:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
