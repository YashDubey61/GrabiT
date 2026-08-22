import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { calculateOfferStatus } from "@/lib/supabase/vendor_offers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface CreateOfferPayload {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export async function GET() {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch offers belonging to this vendor's canteen
    const { data: dbOffers, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("canteen_id", vendorCtx.canteenId)
      .order("created_at", { ascending: false });

    if (error || !dbOffers) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch offers." },
        { status: 500 },
      );
    }

    // 2. Fetch redemptions for this canteen's offers to compute real analytics
    const offerIds = dbOffers.map((o) => o.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let redemptions: any[] = [];
    if (offerIds.length > 0) {
      const { data: rData } = await supabase
        .from("promo_code_redemptions")
        .select("id, promo_code_id, discount_amount, order_id, orders ( total_amount )")
        .in("promo_code_id", offerIds);
      redemptions = rData ?? [];
    }

    // Aggregate stats per offer
    const redemptionsByOffer = new Map<
      string,
      { count: number; totalDiscount: number; totalRevenue: number }
    >();

    for (const r of redemptions) {
      const existing = redemptionsByOffer.get(r.promo_code_id) ?? {
        count: 0,
        totalDiscount: 0,
        totalRevenue: 0,
      };
      existing.count += 1;
      existing.totalDiscount += Number(r.discount_amount || 0);
      existing.totalRevenue += Number(r.orders?.total_amount || 0);
      redemptionsByOffer.set(r.promo_code_id, existing);
    }

    let activeOffersCount = 0;
    let scheduledOffersCount = 0;
    let expiredOffersCount = 0;

    const formattedOffers = dbOffers.map((row) => {
      const status = calculateOfferStatus(row.is_active, row.starts_at, row.expires_at);
      if (status === "ACTIVE") activeOffersCount++;
      else if (status === "SCHEDULED") scheduledOffersCount++;
      else if (status === "EXPIRED") expiredOffersCount++;

      const redStats = redemptionsByOffer.get(row.id) ?? {
        count: 0,
        totalDiscount: 0,
        totalRevenue: 0,
      };

      return {
        id: row.id,
        code: row.code,
        description: row.description || "",
        discountType: row.discount_type,
        discountValue: Number(row.discount_value),
        maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
        minOrderValue: Number(row.min_order_value || 0),
        usageLimit: row.usage_limit ? Number(row.usage_limit) : undefined,
        perUserLimit: Number(row.per_user_limit || 1),
        startsAtIso: row.starts_at ?? undefined,
        expiresAtIso: row.expires_at ?? undefined,
        isActive: row.is_active,
        isPublished: row.is_published,
        status,
        canteenId: row.canteen_id,
        usageCount: redStats.count,
        totalDiscountGiven: redStats.totalDiscount,
        totalRevenueGenerated: redStats.totalRevenue,
        createdAtIso: row.created_at,
      };
    });

    const totalRedemptions = redemptions.length;
    const totalDiscountGiven = redemptions.reduce(
      (sum, r) => sum + Number(r.discount_amount || 0),
      0,
    );
    const totalRevenueGenerated = redemptions.reduce(
      (sum, r) => sum + Number(r.orders?.total_amount || 0),
      0,
    );

    return NextResponse.json({
      ok: true,
      offers: formattedOffers,
      stats: {
        activeOffersCount,
        scheduledOffersCount,
        expiredOffersCount,
        totalRedemptions,
        totalDiscountGiven,
        totalRevenueGenerated,
      },
    });
  } catch (err) {
    console.error("Vendor offers GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as CreateOfferPayload;

    const code = payload.code?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Coupon code is required." },
        { status: 400 },
      );
    }

    const discountValue = Number(payload.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { ok: false, error: "Discount value must be greater than 0." },
        { status: 400 },
      );
    }

    if (payload.discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json(
        { ok: false, error: "Percentage discount cannot exceed 100%." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Check duplicate code
    const { data: existing } = await supabase
      .from("promo_codes")
      .select("id")
      .eq("code", code)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: `Coupon code "${code}" is already in use.` },
        { status: 400 },
      );
    }

    const { data: newOffer, error: insertErr } = await supabase
      .from("promo_codes")
      .insert({
        canteen_id: vendorCtx.canteenId,
        code,
        description: payload.description?.trim() || null,
        discount_type: payload.discountType,
        discount_value: discountValue,
        max_discount: payload.maxDiscount ? Number(payload.maxDiscount) : null,
        min_order_value: payload.minOrderValue ? Number(payload.minOrderValue) : 0,
        usage_limit: payload.usageLimit ? Number(payload.usageLimit) : null,
        per_user_limit: payload.perUserLimit ? Number(payload.perUserLimit) : 1,
        starts_at: payload.startsAt || null,
        expires_at: payload.expiresAt || null,
        is_active: payload.isActive !== false,
        is_published: true,
        created_by: vendorCtx.userId,
      })
      .select()
      .single();

    if (insertErr || !newOffer) {
      console.error("Offer creation error:", insertErr);
      return NextResponse.json(
        { ok: false, error: "Failed to create offer." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, offer: newOffer });
  } catch (err) {
    console.error("Vendor offers POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error creating offer." },
      { status: 500 },
    );
  }
}
