import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { recordSuperAdminAction } from "@/lib/supabase/superadmin_audit";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

/** Lists every vendor (canteen) with its owning campus and account
 * contact, for the Super Admin Vendor Management table. Admin-only. */
export async function GET() {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("canteens")
    .select(
      "id, name, owner_name, email, phone, status, is_paused, pause_reason, vendor_code, created_at, campuses ( id, name )",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to load vendors." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vendors: data ?? [] });
}

/**
 * Creates a new vendor: an auth account (password hashed by Supabase
 * Auth — never touched or stored by us in plaintext), a public.users
 * profile with role='vendor', and a canteens row linked to the chosen
 * campus. All three succeed together or the auth account created is
 * rolled back, so a failed creation never leaves an orphaned login.
 */
export async function POST(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as {
    ownerName?: string;
    shopName?: string;
    email?: string;
    phone?: string;
    campusId?: string;
    address?: string;
    pickupLocation?: string;
    operatingHours?: string;
    prepTimeMinutes?: number;
    password?: string;
  };

  const ownerName = body.ownerName?.trim();
  const shopName = body.shopName?.trim();
  const email = body.email?.trim().toLowerCase();
  const campusId = body.campusId?.trim();
  const password = body.password ?? "";

  if (!ownerName || !shopName || !email || !campusId) {
    return NextResponse.json(
      { ok: false, error: "Owner name, shop name, email, and campus are required." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Temporary password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();

  const { data: campus } = await supabase.from("campuses").select("id").eq("id", campusId).maybeSingle();
  if (!campus) {
    return NextResponse.json({ ok: false, error: "Selected campus does not exist." }, { status: 400 });
  }

  // 1. Create the auth account. Supabase Auth hashes and stores the
  // password itself — this route never persists it anywhere.
  const { data: created, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr || !created?.user) {
    const message = authErr?.message?.includes("already been registered")
      ? "A vendor with this email already exists."
      : "Unable to create vendor login.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const newUserId = created.user.id;

  try {
    // 2. Canteen/shop profile.
    const qrCodeId = `QR-${shopName.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 20)}-${Date.now().toString(36).toUpperCase()}`;
    const vendorCode = `GRB-VND-${newUserId.slice(0, 6).toUpperCase()}`;

    const { data: canteen, error: canteenErr } = await supabase
      .from("canteens")
      .insert({
        name: shopName,
        owner_name: ownerName,
        email,
        phone: body.phone?.trim() || null,
        campus_id: campusId,
        address: body.address?.trim() || null,
        pickup_location: body.pickupLocation?.trim() || null,
        operating_hours: body.operatingHours?.trim() || null,
        prep_time_minutes: body.prepTimeMinutes ?? 15,
        status: "active",
        qr_code_id: qrCodeId,
        vendor_code: vendorCode,
      })
      .select("id, vendor_code")
      .single();

    if (canteenErr || !canteen) {
      throw new Error(`Failed to create shop profile: ${canteenErr?.message}`);
    }

    // 3. Vendor profile row, linked to the new canteen.
    const { error: profileErr } = await supabase.from("users").insert({
      id: newUserId,
      role: "vendor",
      full_name: ownerName,
      phone: body.phone?.trim() || null,
      canteen_id: canteen.id,
      campus_id: campusId,
    });

    if (profileErr) {
      throw new Error(`Failed to create vendor profile: ${profileErr.message}`);
    }

    await recordSuperAdminAction({
      adminId: adminCtx.user.id,
      action: "vendor_created",
      vendorId: canteen.id,
      metadata: { shopName, campusId, email },
    });

    return NextResponse.json({
      ok: true,
      vendor: { id: canteen.id, vendorCode: canteen.vendor_code },
    });
  } catch (err) {
    // Roll back the auth account so a partial failure never leaves a
    // login with no shop attached to it.
    await supabase.auth.admin.deleteUser(newUserId);
    console.error("Vendor creation failed:", err);
    return NextResponse.json({ ok: false, error: "Failed to create vendor. Please try again." }, { status: 500 });
  }
}
