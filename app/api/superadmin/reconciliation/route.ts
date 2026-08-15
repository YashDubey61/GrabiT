import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { runFinancialReconciliation } from "@/lib/supabase/financial_reconciliation";

export async function GET(request: Request) {
  try {
    // 1. Role Guard & Server Identity Resolution: Require authenticated Super Admin session
    const superAdminCtx = await getAuthenticatedSuperAdminContext();
    if (!superAdminCtx) {
      return NextResponse.json(
        { ok: false, error: "Access denied. Super Admin authorization required." },
        { status: 403 },
      );
    }

    // 2. Extract & Validate Timeframe Parameter
    const { searchParams } = new URL(request.url);
    const timeframeParam = (searchParams.get("timeframe") ?? "today") as "today" | "7d" | "30d";

    if (timeframeParam !== "today" && timeframeParam !== "7d" && timeframeParam !== "30d") {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid timeframe parameter. Allowed values: 'today', '7d', '30d'.",
        },
        { status: 400 },
      );
    }

    // 3. Run Deterministic Financial Reconciliation Audit
    const result = await runFinancialReconciliation(timeframeParam);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err) {
    console.error("Super Admin Reconciliation API error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error performing financial reconciliation audit." },
      { status: 500 },
    );
  }
}
