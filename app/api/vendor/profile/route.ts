import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import type { VendorStoreSettingsData } from "@/lib/supabase/vendor_settings";
import { resolveImageUrl } from "@/lib/utils/image";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json({ ok: false, error: "Access denied. Vendor authentication required." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch Canteen Info with Campus Name
    const { data: canteen } = await supabase
      .from("canteens")
      .select("*, campuses(name)")
      .eq("id", vendorCtx.canteenId)
      .single();

    if (!canteen) {
      return NextResponse.json({ ok: false, error: "Canteen profile not found." }, { status: 404 });
    }

    // 2. Fetch User Account Info
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, name, email, phone, role")
      .eq("id", vendorCtx.userId)
      .single();

    // 3. Format Bank Payout Details
    const rawAcc = (canteen.bank_account_number || "").trim();
    const maskedAcc = rawAcc.length >= 4 ? `•••• •••• ${rawAcc.slice(-4)}` : "••••";

    const campusObj = canteen.campuses as { name?: string } | null;

    const rawPhotos: (string | null | undefined)[] = Array.isArray(canteen.photo_urls) && canteen.photo_urls.length > 0
      ? canteen.photo_urls
      : [canteen.image_url];
    const photoUrls = rawPhotos.map((url: string | null | undefined) => resolveImageUrl(url, "canteen")).filter(Boolean);

    const data: VendorStoreSettingsData = {
      canteenId: canteen.id,
      campusId: canteen.campus_id,
      campusName: campusObj?.name || "Main Institutional Campus",
      name: canteen.name || "Vendor Store",
      status: (canteen.status as VendorStoreSettingsData["status"]) || "active",
      category: canteen.category || "Fast Food & Snacks",
      tier: canteen.tier || "STD",
      commissionRate: Number(canteen.commission_rate || 10.0),
      description: canteen.description || "",
      imageUrl: resolveImageUrl(canteen.image_url, "canteen"),
      photoUrls: photoUrls.length > 0 ? photoUrls : [resolveImageUrl(null, "canteen")],
      cuisineTags: canteen.cuisine_tags || "Fast Food, Indian, Beverages",
      phone: canteen.phone || userProfile?.phone || "",
      email: canteen.email || userProfile?.email || "",
      prepTimeMinutes: Number(canteen.prep_time_minutes || 15),
      openingTime: canteen.opening_time || "08:00 AM",
      closingTime: canteen.closing_time || "08:00 PM",
      operatingDays: canteen.operating_days || "Monday - Saturday",
      announcementMessage: canteen.announcement_message || "",
      account: {
        userId: userProfile?.id || vendorCtx.userId,
        fullName: userProfile?.name || "Vendor Manager",
        email: userProfile?.email || "",
        phone: userProfile?.phone || "",
        role: "Vendor",
      },
      payoutAccount: {
        isConfigured: Boolean(canteen.bank_account_number),
        bankName: canteen.bank_name || "HDFC Bank",
        maskedAccountNumber: maskedAcc,
        ifscCode: canteen.ifsc_code || "",
        isVerified: Boolean(canteen.payout_account_verified),
      },
    };

    const profile = {
      vendorId: canteen.id,
      shopName: canteen.name || "Vendor Store",
      shopDescription: canteen.description || "",
      shopImageUrl: canteen.image_url || "",
      storeStatus: canteen.status || "active",
      email: canteen.email || userProfile?.email || "",
      phone: canteen.phone || userProfile?.phone || "",
      registeredAt: canteen.created_at || new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, data, profile });
  } catch (err) {
    console.error("Vendor profile GET error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json({ ok: false, error: "Access denied. Vendor authentication required." }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseAdminClient();

    // Disallow security/identity fields
    if ("role" in body || "canteenId" in body || "vendorId" in body || "id" in body) {
      return NextResponse.json(
        { ok: false, error: "Security Policy: Role and canteen ownership cannot be modified." },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.shopName === "string" && body.shopName.trim()) updates.name = body.shopName.trim();
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (typeof body.shopDescription === "string") updates.description = body.shopDescription.trim();
    if (typeof body.category === "string") updates.category = body.category.trim();
    if (typeof body.imageUrl === "string") updates.image_url = body.imageUrl.trim();
    if (typeof body.shopImageUrl === "string") updates.image_url = body.shopImageUrl.trim();
    if (Array.isArray(body.photoUrls)) updates.photo_urls = body.photoUrls;
    if (typeof body.cuisineTags === "string") updates.cuisine_tags = body.cuisineTags.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();
    if (typeof body.email === "string") updates.email = body.email.trim();
    
    if (typeof body.status === "string") {
      const st = body.status.toLowerCase();
      if (["active", "inactive", "closed", "busy"].includes(st)) {
        updates.status = st === "inactive" || st === "closed" ? "inactive" : "active";
      }
    }

    if (typeof body.prepTimeMinutes === "number" && body.prepTimeMinutes > 0) {
      updates.prep_time_minutes = Math.round(body.prepTimeMinutes);
    }
    if (typeof body.openingTime === "string") updates.opening_time = body.openingTime.trim();
    if (typeof body.closingTime === "string") updates.closing_time = body.closingTime.trim();
    if (typeof body.operatingDays === "string") updates.operating_days = body.operatingDays.trim();
    if (typeof body.announcementMessage === "string") updates.announcement_message = body.announcementMessage.trim();

    const { error: updateErr } = await supabase
      .from("canteens")
      .update(updates)
      .eq("id", vendorCtx.canteenId);

    if (updateErr) {
      console.error("Vendor profile PATCH error:", updateErr);
      return NextResponse.json({ ok: false, error: updateErr.message || "Failed to update store settings." }, { status: 400 });
    }

    // Sync phone/email/name on users table for this vendor
    const userUpdates: Record<string, unknown> = {};
    if (typeof body.phone === "string" && body.phone.trim()) userUpdates.phone = body.phone.trim();
    if (typeof body.email === "string" && body.email.trim()) userUpdates.email = body.email.trim();
    if (typeof body.name === "string" && body.name.trim()) userUpdates.name = body.name.trim();

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from("users").update(userUpdates).eq("id", vendorCtx.userId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Vendor profile PATCH internal error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
