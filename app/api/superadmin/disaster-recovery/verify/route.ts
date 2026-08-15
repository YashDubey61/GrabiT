import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { runReadonlyRecoveryAudit } from "@/lib/disaster-recovery/financial_recovery";

export async function POST() {
  try {
    const adminCtx = await getAuthenticatedSuperAdminContext();
    if (!adminCtx || adminCtx.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin access required." },
        { status: 401 },
      );
    }

    const auditResult = await runReadonlyRecoveryAudit(adminCtx.user.id);

    return NextResponse.json(
      {
        ok: true,
        message: "Read-only Disaster Recovery audit completed successfully.",
        audit: auditResult,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      },
    );
  } catch (err) {
    console.error("Failed to execute read-only disaster recovery audit:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
