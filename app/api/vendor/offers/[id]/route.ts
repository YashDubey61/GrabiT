import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface UpdateOfferPayload {
  code?: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FLAT";
  discountValue?: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: offerId } = await params;
    const payload = (await request.json()) as UpdateOfferPayload;
    const supabase = getSupabaseAdminClient();

    // Verify ownership
    const { data: dbOffer } = await supabase
      .from("promo_codes")
      .select("id, canteen_id")
      .eq("id", offerId)
      .limit(1);

    if (!dbOffer || dbOffer.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Offer not found." },
        { status: 404 },
      );
    }

    if (dbOffer[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to modify this offer." },
        { status: 403 },
      );
    }

    const updates: Record<string, unknown> = {};

    if (payload.code !== undefined) {
      const code = payload.code.trim().toUpperCase();
      if (!code) {
        return NextResponse.json(
          { ok: false, error: "Coupon code cannot be empty." },
          { status: 400 },
        );
      }
      updates.code = code;
    }

    if (payload.description !== undefined) {
      updates.description = payload.description.trim() || null;
    }

    if (payload.discountType !== undefined) {
      updates.discount_type = payload.discountType;
    }

    if (payload.discountValue !== undefined) {
      const val = Number(payload.discountValue);
      if (!Number.isFinite(val) || val <= 0) {
        return NextResponse.json(
          { ok: false, error: "Discount value must be > 0." },
          { status: 400 },
        );
      }
      updates.discount_value = val;
    }

    if (payload.maxDiscount !== undefined) {
      updates.max_discount = payload.maxDiscount ? Number(payload.maxDiscount) : null;
    }

    if (payload.minOrderValue !== undefined) {
      updates.min_order_value = Math.max(0, Number(payload.minOrderValue) || 0);
    }

    if (payload.usageLimit !== undefined) {
      updates.usage_limit = payload.usageLimit ? Number(payload.usageLimit) : null;
    }

    if (payload.perUserLimit !== undefined) {
      updates.per_user_limit = Math.max(1, Number(payload.perUserLimit) || 1);
    }

    if (payload.startsAt !== undefined) {
      updates.starts_at = payload.startsAt || null;
    }

    if (payload.expiresAt !== undefined) {
      updates.expires_at = payload.expiresAt || null;
    }

    if (payload.isActive !== undefined) {
      updates.is_active = Boolean(payload.isActive);
    }

    const { data: updatedOffer, error: updateErr } = await supabase
      .from("promo_codes")
      .update(updates)
      .eq("id", offerId)
      .select()
      .single();

    if (updateErr || !updatedOffer) {
      console.error("Offer update error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to update offer." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, offer: updatedOffer });
  } catch (err) {
    console.error("Vendor offer PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error updating offer." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }

    const { id: offerId } = await params;
    const supabase = getSupabaseAdminClient();

    // Verify ownership
    const { data: dbOffer } = await supabase
      .from("promo_codes")
      .select("id, canteen_id")
      .eq("id", offerId)
      .limit(1);

    if (!dbOffer || dbOffer.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Offer not found." },
        { status: 404 },
      );
    }

    if (dbOffer[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to delete this offer." },
        { status: 403 },
      );
    }

    const { error: deleteErr } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", offerId);

    if (deleteErr) {
      console.error("Offer deletion error:", deleteErr);
      return NextResponse.json(
        { ok: false, error: "Failed to delete offer." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, deletedId: offerId });
  } catch (err) {
    console.error("Vendor offer DELETE error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error deleting offer." },
      { status: 500 },
    );
  }
}
