import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to view saved addresses." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Failed to load addresses." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      addresses: addresses ?? [],
    });
  } catch (err) {
    console.error("Addresses GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to add an address." },
        { status: 401 },
      );
    }

    const payload = await request.json();

    if (!payload.addressLine || typeof payload.addressLine !== "string" || !payload.addressLine.trim()) {
      return NextResponse.json(
        { ok: false, error: "Address line is required." },
        { status: 400 },
      );
    }

    const label = payload.label?.trim() || "Hostel";
    const addressLine = payload.addressLine.trim();
    const city = payload.city?.trim() || "Kanpur";
    const isDefault = Boolean(payload.isDefault);

    const supabase = getSupabaseAdminClient();

    // If setting default, unset existing default addresses for this user
    if (isDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: newAddr, error: insertErr } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label,
        address_line: addressLine,
        city,
        is_default: isDefault,
      })
      .select()
      .single();

    if (insertErr || !newAddr) {
      return NextResponse.json(
        { ok: false, error: "Failed to save address." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      address: newAddr,
    });
  } catch (err) {
    console.error("Addresses POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error saving address." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to delete an address." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const addressId = searchParams.get("id");

    if (!addressId) {
      return NextResponse.json(
        { ok: false, error: "Address ID is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { error: deleteErr } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", user.id); // Strict ownership check

    if (deleteErr) {
      return NextResponse.json(
        { ok: false, error: "Failed to delete address." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Address deleted successfully.",
    });
  } catch (err) {
    console.error("Addresses DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error deleting address." },
      { status: 500 },
    );
  }
}
