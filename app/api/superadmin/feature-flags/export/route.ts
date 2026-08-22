import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import { fetchFeatureFlags } from "@/lib/supabase/superadmin_feature_flags";

/**
 * GET /api/superadmin/feature-flags/export
 * Generates a CSV report of feature flags directory.
 * Server-authoritative Super Admin access control.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const environment = searchParams.get("environment") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const flags = await fetchFeatureFlags(category, status, environment, search);

    const headers = [
      "Feature Name",
      "Flag Key",
      "Category",
      "Status",
      "Environment",
      "Rollout Percentage",
      "Target Scope",
      "Risk Level",
      "High Impact",
      "Last Updated",
      "Updated By",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = flags.map((f) => [
      escapeCsv(f.name),
      escapeCsv(f.key),
      escapeCsv(f.category),
      escapeCsv(f.status),
      escapeCsv(f.environment),
      escapeCsv(`${f.rolloutPercentage}%`),
      escapeCsv(f.targetScope),
      escapeCsv(f.riskLevel),
      escapeCsv(f.isHighImpact ? "YES" : "NO"),
      escapeCsv(f.updatedAt),
      escapeCsv(f.updatedByName || "Super Admin"),
    ]);

    const csvString = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");

    const dateSuffix = new Date().toISOString().split("T")[0];
    return new Response(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="grabit_feature_flags_${dateSuffix}.csv"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate feature flags report." },
      { status: 500 }
    );
  }
}
