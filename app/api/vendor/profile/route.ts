import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

export async function GET() {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const [{ data: canteen }, { data: authUser }, { data: profile }] = await Promise.all([
    supabase
      .from("canteens")
      .select("name, description, image_url, status")
      .eq("id", vendorCtx.canteenId)
      .maybeSingle(),
    supabase.auth.admin.getUserById(vendorCtx.userId),
    supabase.from("users").select("phone, created_at").eq("id", vendorCtx.userId).maybeSingle(),
  ]);

  return NextResponse.json({
    ok: true,
    profile: {
      vendorId: vendorCtx.canteenId,
      shopName: canteen?.name ?? null,
      shopDescription: canteen?.description ?? null,
      shopImageUrl: canteen?.image_url ?? null,
      storeStatus: canteen?.status ?? null,
      email: authUser?.user?.email ?? null,
      phone: profile?.phone ?? null,
      registeredAt: profile?.created_at ?? authUser?.user?.created_at ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const vendorCtx = await getAuthenticatedVendorContext();
  if (!vendorCtx) {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const body = (await request.json()) as {
    shopName?: unknown;
    shopDescription?: unknown;
    shopImageUrl?: unknown;
  };

  const updates: Record<string, string> = {};
  if (typeof body.shopName === "string" && body.shopName.trim()) {
    updates.name = body.shopName.trim();
  }
  if (typeof body.shopDescription === "string") {
    updates.description = body.shopDescription.trim();
  }
  if (typeof body.shopImageUrl === "string" && body.shopImageUrl.trim()) {
    updates.image_url = body.shopImageUrl.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("canteens")
    .update(updates)
    .eq("id", vendorCtx.canteenId);

  if (error) {
    return NextResponse.json({ ok: false, error: "Unable to update profile." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
