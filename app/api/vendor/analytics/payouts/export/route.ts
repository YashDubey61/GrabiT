import { NextResponse } from "next/server";
import { getAuthenticatedVendorContext } from "@/lib/supabase/vendor_auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Returns the vendor's full report as structured JSON — orders (with
 * dishes + customer), payouts, and vendor profile — all scoped to the
 * authenticated vendor's own canteen_id, server-side. The client
 * (VendorPayoutLedger's "Download Full History") turns this into an
 * actual .pdf with jsPDF; this endpoint never renders anything itself,
 * so it can't be tricked into leaking another vendor's data via the
 * client.
 */
export async function GET(request: Request) {
  try {
    const vendorCtx = await getAuthenticatedVendorContext();
    if (!vendorCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Please sign in with a vendor account." },
        { status: 401 },
      );
    }
    const canteenId = vendorCtx.canteenId;
    const supabase = getSupabaseAdminClient();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("tf") || "30d";
    const days = timeframe === "today" ? 1 : timeframe === "7d" ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [{ data: canteen }, { data: authUser }, { data: profile }] = await Promise.all([
      supabase
        .from("canteens")
        .select("name, description")
        .eq("id", canteenId)
        .maybeSingle(),
      supabase.auth.admin.getUserById(vendorCtx.userId),
      supabase.from("users").select("phone").eq("id", vendorCtx.userId).maybeSingle(),
    ]);

    const { data: orders } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, delivery_charge, created_at, student_id, order_items ( quantity, price_at_order, menu_items ( name ) )",
      )
      .eq("canteen_id", canteenId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    const { data: payouts } = await supabase
      .from("payouts")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("requested_at", { ascending: false });

    const completed = (orders ?? []).filter((o) => o.status === "completed");
    const cancelled = (orders ?? []).filter((o) => o.status === "cancelled");
    const totalSales = completed.reduce((s, o) => s + Number(o.total_amount), 0);
    const avgOrder = completed.length ? totalSales / completed.length : 0;
    const totalDeliveryCharges = (orders ?? []).reduce(
      (s, o) => s + Number(o.delivery_charge || 0),
      0,
    );

    return NextResponse.json({
      ok: true,
      report: {
        generatedAt: new Date().toISOString(),
        period: {
          timeframe,
          start: since.toISOString(),
          end: new Date().toISOString(),
        },
        vendor: {
          vendorId: canteenId,
          shopName: canteen?.name ?? null,
          shopDescription: canteen?.description ?? null,
          email: authUser?.user?.email ?? null,
          phone: profile?.phone ?? null,
        },
        summary: {
          totalSales,
          totalOrders: orders?.length ?? 0,
          completedOrders: completed.length,
          cancelledOrders: cancelled.length,
          averageOrderValue: avgOrder,
          totalDeliveryCharges,
        },
        orders: (orders ?? []).map((o) => ({
          orderNumber: o.order_number,
          createdAt: o.created_at,
          customerId: o.student_id ? `GRB-${o.student_id.slice(0, 6).toUpperCase()}` : "Unknown",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: ((o.order_items as any[]) ?? []).map((it) => ({
            name: it.menu_items?.name ?? "Item",
            quantity: it.quantity,
            price: Number(it.price_at_order),
          })),
          total: Number(o.total_amount),
          status: o.status,
        })),
        payouts: (payouts ?? []).map((p) => ({
          reference: `PAY-${p.id.slice(0, 5).toUpperCase()}-X`,
          status: p.status,
          requestedAt: p.requested_at,
          settledAt: p.settled_at ?? null,
          amount: Number(p.amount),
        })),
      },
    });
  } catch (err) {
    console.error("Vendor report export error:", err);
    return NextResponse.json({ ok: false, error: "Failed to generate report." }, { status: 500 });
  }
}
