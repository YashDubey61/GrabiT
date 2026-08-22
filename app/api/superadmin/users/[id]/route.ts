import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchUserDetails,
  updateUserRoleApi,
  updateUserStatusApi,
  type UserRole,
  type AccountStatus,
} from "@/lib/supabase/superadmin_users";

/**
 * GET /api/superadmin/users/[id]
 * Retrieves comprehensive details for a specific user, including order stats & audit trail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: targetUserId } = await params;
  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: "Missing user ID parameter." }, { status: 400 });
  }

  const result = await fetchUserDetails(targetUserId);
  if (!result.user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    user: result.user,
    ordersCount: result.ordersCount,
    totalSpentOrManaged: result.totalSpentOrManaged,
    auditTrail: result.auditTrail,
  });
}

/**
 * PATCH /api/superadmin/users/[id]
 * Updates user role or account status (active, suspended, disabled).
 * Derives Super Admin identity server-side, enforcing protection rules.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: targetUserId } = await params;
  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: "Missing user ID parameter." }, { status: 400 });
  }

  const body = (await request.json()) as {
    newRole?: UserRole;
    newStatus?: AccountStatus;
    reason?: string;
  };

  const adminId = adminCtx.user.id;

  // 1. Role Update Action
  if (body.newRole) {
    const res = await updateUserRoleApi({
      adminId,
      targetUserId,
      newRole: body.newRole,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  // 2. Account Status Action
  if (body.newStatus) {
    const res = await updateUserStatusApi({
      adminId,
      targetUserId,
      newStatus: body.newStatus,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, message: "User updated successfully." });
}
