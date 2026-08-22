import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSuperAdminContext } from "@/lib/supabase/superadmin";
import {
  fetchVendorApplicationDetails,
  updateKycStatusApi,
  updateApplicationStatusApi,
  suspendVendorApplicationApi,
  type ApplicationStatus,
  type KycStatus,
} from "@/lib/supabase/superadmin_vendor_applications";

/**
 * GET /api/superadmin/vendors/applications/[id]
 * Fetches vendor application details, KYC documents, and prerequisite checklist.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: applicationId } = await params;
  if (!applicationId) {
    return NextResponse.json({ ok: false, error: "Missing application ID." }, { status: 400 });
  }

  const result = await fetchVendorApplicationDetails(applicationId);
  if (!result.application) {
    return NextResponse.json({ ok: false, error: "Application not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    application: result.application,
    prerequisites: result.prerequisites,
  });
}

/**
 * PATCH /api/superadmin/vendors/applications/[id]
 * Super Admin operations: Approve, Reject, Put Under Review, Verify KYC, Reject KYC, or Suspend Vendor.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminCtx = await getAuthenticatedSuperAdminContext();
  if (!adminCtx || adminCtx.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Access denied." }, { status: 401 });
  }

  const { id: applicationId } = await params;
  if (!applicationId) {
    return NextResponse.json({ ok: false, error: "Missing application ID." }, { status: 400 });
  }

  const body = (await request.json()) as {
    action?: "update_app_status" | "update_kyc_status" | "suspend_vendor";
    newApplicationStatus?: ApplicationStatus;
    newKycStatus?: KycStatus;
    reason?: string;
  };

  const adminId = adminCtx.user.id;

  // 1. Application Status Action (Approve / Reject / Under Review)
  if (body.action === "update_app_status" && body.newApplicationStatus) {
    const res = await updateApplicationStatusApi({
      adminId,
      applicationId,
      newApplicationStatus: body.newApplicationStatus,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  // 2. KYC Status Action (Verify / Reject)
  if (body.action === "update_kyc_status" && body.newKycStatus) {
    const res = await updateKycStatusApi({
      adminId,
      applicationId,
      newKycStatus: body.newKycStatus,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  // 3. Suspend Vendor Action
  if (body.action === "suspend_vendor") {
    if (!body.reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required to suspend a vendor." }, { status: 400 });
    }

    const res = await suspendVendorApplicationApi({
      adminId,
      applicationId,
      reason: body.reason,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, message: "Vendor application updated successfully." });
}
