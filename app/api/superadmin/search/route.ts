import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  executeGlobalSearch,
  type SearchEntityCategory,
} from "@/lib/supabase/superadmin_search";

/**
 * GET /api/superadmin/search
 * Centralized Global Search & Unified Operations Finder endpoint.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("query") || "";
  const category = (searchParams.get("category") || "ALL") as SearchEntityCategory;
  const limitParam = parseInt(searchParams.get("limit") || "30", 10);
  const limit = isNaN(limitParam) ? 30 : Math.min(limitParam, 100);

  try {
    const results = await executeGlobalSearch({
      query: q,
      category,
      limit,
    });

    return NextResponse.json({
      ok: true,
      query: q,
      category,
      total: results.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to execute global search." },
      { status: 500 }
    );
  }
}
