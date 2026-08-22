import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

interface ReportPayload {
  reason: string;
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
    const payload = (await request.json()) as ReportPayload;
    const reason = payload.reason?.trim();

    if (!reason) {
      return NextResponse.json(
        { ok: false, error: "Report reason is required." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Verify ownership
    const { data: dbReview } = await supabase
      .from("order_reviews")
      .select("id, canteen_id")
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
        { ok: false, error: "Forbidden. You do not have permission to report this review." },
        { status: 403 },
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from("order_reviews")
      .update({
        report_status: "reported",
        report_reason: reason,
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error("Vendor report update error:", updateErr);
      return NextResponse.json(
        { ok: false, error: "Failed to submit review report." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, review: updated });
  } catch (err) {
    console.error("Vendor review report POST error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error submitting review report." },
      { status: 500 },
    );
  }
}
