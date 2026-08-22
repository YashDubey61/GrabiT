import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface ReplyPayload {
  replyText: string;
}

export async function POST(
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

    const { id: reviewId } = await params;
    const payload = (await request.json()) as ReplyPayload;
    const replyText = payload.replyText?.trim();

    if (!replyText) {
      return NextResponse.json(
        { ok: false, error: "Reply text cannot be empty." },
        { status: 400 },
      );
    }

    if (replyText.length > 500) {
      return NextResponse.json(
        { ok: false, error: "Reply text cannot exceed 500 characters." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verify ownership
    const { data: dbReview } = await supabase
      .from("order_reviews")
      .select("id, canteen_id, vendor_reply")
      .eq("id", reviewId)
      .limit(1);

    if (!dbReview || dbReview.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Review not found." },
        { status: 404 },
      );
    }

    if (dbReview[0].canteen_id !== vendorCtx.canteenId) {
      return NextResponse.json(
        { ok: false, error: "Forbidden. You do not have permission to reply to this review." },
        { status: 403 },
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from("order_reviews")
      .update({
        vendor_reply: replyText,
        vendor_replied_at: new Date().toISOString(),
        vendor_replied_by: vendorCtx.userId,
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error("Vendor reply update error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to save vendor reply." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, review: updated });
  } catch (err) {
    console.error("Vendor review reply POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error saving vendor reply." },
      { status: 500 },
    );
  }
}
