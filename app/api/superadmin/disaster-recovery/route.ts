import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { getDisasterRecoveryStatus } from "@/lib/disaster-recovery/disaster_recovery";
import { getFinancialRecoveryChecks } from "@/lib/disaster-recovery/financial_recovery";

export async function GET() {
  try {
    const adminCtx = await getAuthenticatedSuperAdminContext();
    if (!adminCtx) {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin authentication required." },
        { status: 401 },
      );
    }

    if (adminCtx.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin access required." },
        { status: 403 },
      );
    }

    const drSummary = await getDisasterRecoveryStatus();
    const financialChecks = await getFinancialRecoveryChecks();

    return NextResponse.json(
      {
        ...drSummary,
        financialChecks,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  } catch (err) {
    console.error("Failed to fetch disaster recovery status:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
