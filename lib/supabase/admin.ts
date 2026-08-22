import { createClient as createAdminClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the Supabase service-role key, or throws immediately if it's
 * unset. Every admin-privileged operation in this app used to silently
 * fall back to the anon key (`SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`)
 * when this var was missing — that masked misconfigured deployments
 * instead of failing loudly, and ran privileged code paths (order
 * placement, wallet debits, vendor/admin writes) at the wrong privilege
 * level with no clear error anywhere. Failing fast here surfaces a
 * missing/misconfigured environment immediately instead of producing
 * confusing downstream RLS-denial errors.
 */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Refusing to silently fall back to the anon key for an admin-privileged operation — set this environment variable for this deployment.",
    );
  }
  return key;
}

/**
 * The single Supabase admin (service-role) client factory. Bypasses RLS —
 * use only in server-side code that has already authenticated the caller
 * and verified their role/ownership itself.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createAdminClient(url, getServiceRoleKey());
}
