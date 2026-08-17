import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { recordSuperAdminAction } from "@/lib/supabase/superadmin_audit";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("canteens")
    .select(
      "id, name, owner_name, email, phone, address, pickup_location, operating_hours, prep_time_minutes, status, is_paused, pause_reason, vendor_code, created_at, campus_id, campuses ( id, name )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Vendor not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, vendor: data });
}

/**
 * Handles edit, pause/resume, and reactivate — all as one PATCH, keyed
 * off which fields the request includes. Every write is scoped to this
 * single vendor id; the client never controls which vendor is affected
 * beyond the URL, and the admin role is re-verified on every call.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const { id } = await params;

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
    isPaused?: boolean;
    pauseReason?: string | null;
    status?: "active" | "inactive";
  };

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("canteens")
    .select("id, campus_id, is_paused")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Vendor not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.ownerName !== undefined) updates.owner_name = body.ownerName.trim();
  if (body.shopName !== undefined) updates.name = body.shopName.trim();
  if (body.email !== undefined) updates.email = body.email.trim().toLowerCase();
  if (body.phone !== undefined) updates.phone = body.phone.trim() || null;
  if (body.address !== undefined) updates.address = body.address.trim() || null;
  if (body.pickupLocation !== undefined) updates.pickup_location = body.pickupLocation.trim() || null;
  if (body.operatingHours !== undefined) updates.operating_hours = body.operatingHours.trim() || null;
  if (body.prepTimeMinutes !== undefined) updates.prep_time_minutes = body.prepTimeMinutes;

  let campusChanged = false;
  if (body.campusId !== undefined && body.campusId !== existing.campus_id) {
    const { data: campus } = await supabase.from("campuses").select("id").eq("id", body.campusId).maybeSingle();
    if (!campus) {
      return NextResponse.json({ ok: false, error: "Selected campus does not exist." }, { status: 400 });
    }
    updates.campus_id = body.campusId;
    campusChanged = true;
  }

  let pauseAction: "store_paused" | "store_resumed" | null = null;
  if (body.isPaused !== undefined && body.isPaused !== existing.is_paused) {
    updates.is_paused = body.isPaused;
    updates.pause_reason = body.isPaused ? body.pauseReason?.trim() || null : null;
    pauseAction = body.isPaused ? "store_paused" : "store_resumed";
  }

  let deactivateAction: "vendor_deactivated" | "vendor_reactivated" | null = null;
  if (body.status !== undefined) {
    updates.status = body.status;
    deactivateAction = body.status === "inactive" ? "vendor_deactivated" : "vendor_reactivated";
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
  }

  const { error: updateErr } = await supabase.from("canteens").update(updates).eq("id", id);
  if (updateErr) {
    return NextResponse.json({ ok: false, error: "Unable to update vendor." }, { status: 500 });
  }

  // Keep the vendor's own users row (campus_id) in sync so their
  // session-derived context matches the shop they're now assigned to.
  if (campusChanged) {
    await supabase.from("users").update({ campus_id: body.campusId }).eq("canteen_id", id);
  }

  if (pauseAction) {
    await recordSuperAdminAction({
      adminId: adminCtx.user.id,
      action: pauseAction,
      vendorId: id,
      reason: body.pauseReason ?? null,
    });
  }
  if (deactivateAction) {
    await recordSuperAdminAction({ adminId: adminCtx.user.id, action: deactivateAction, vendorId: id });
  }
  if (campusChanged) {
    await recordSuperAdminAction({
      adminId: adminCtx.user.id,
      action: "college_changed",
      vendorId: id,
      metadata: { fromCampusId: existing.campus_id, toCampusId: body.campusId },
    });
  }
  if (!pauseAction && !deactivateAction && !campusChanged) {
    await recordSuperAdminAction({ adminId: adminCtx.user.id, action: "vendor_edited", vendorId: id });
  }

  return NextResponse.json({ ok: true });
}

/** Soft-deletes the vendor: deactivates the shop (status='inactive')
 * and locks the login out, but keeps every historical order, payment,
 * and payout row intact and queryable by Super Admin. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }
  const { id } = await params;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("canteens").update({ status: "inactive" }).eq("id", id);
  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to deactivate vendor." }, { status: 500 });
  }

  // Lock the vendor's own login out without touching their auth record
  // (email/history), so a future reactivation doesn't need a new account.
  const { data: vendorUser } = await supabase.from("users").select("id").eq("canteen_id", id).maybeSingle();
  if (vendorUser) {
    await supabase.auth.admin.updateUserById(vendorUser.id, { ban_duration: "876000h" });
  }

  await recordSuperAdminAction({ adminId: adminCtx.user.id, action: "vendor_deactivated", vendorId: id });
  return NextResponse.json({ ok: true });
}
