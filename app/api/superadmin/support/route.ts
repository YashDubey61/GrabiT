import { NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchSupportTicketsDirectory,
  fetchSupportOverviewStats,
  type SupportQueue,
} from "@/lib/supabase/superadmin_support";

/**
 * GET /api/superadmin/support
 * Returns Overview KPI stats and Support Ticket Directory.
 * Server-authoritative Super Admin role guard.
 */
export async function GET(request: Request) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queue = (searchParams.get("queue") || "ALL") as SupportQueue;
  const search = searchParams.get("search") || searchParams.get("q") || undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const campusId = searchParams.get("campusId") ?? undefined;

  try {
    const [stats, tickets] = await Promise.all([
      fetchSupportOverviewStats(),
      fetchSupportTicketsDirectory(queue, search, priority, status, category, campusId, adminCtx.user.id),
    ]);

    return NextResponse.json({
      ok: true,
      stats,
      tickets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load support tickets directory." },
      { status: 500 }
    );
  }
}
