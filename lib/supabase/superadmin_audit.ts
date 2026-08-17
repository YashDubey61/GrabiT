import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

/** Records a Super Admin action against a vendor for the audit trail.
 * Best-effort — a logging failure must never block the underlying
 * admin action itself. */
export async function recordSuperAdminAction(entry: {
  adminId: string;
  action:
    | "vendor_created"
    | "vendor_edited"
    | "store_paused"
    | "store_resumed"
    | "vendor_deactivated"
    | "vendor_reactivated"
    | "college_changed"
    | "credential_reset";
  vendorId: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("superadmin_audit_log").insert({
      admin_id: entry.adminId,
      action: entry.action,
      vendor_id: entry.vendorId,
      reason: entry.reason ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // Non-critical side effect.
  }
}
