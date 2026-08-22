import { createClient as createServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface VendorContext {
  userId: string;
  role: "vendor";
  canteenId: string;
  canteenName: string;
}

/**
 * Server-side Vendor Identity & Canteen Resolver.
 * Resolves authenticated vendor identity strictly from auth.users session -> public.users -> canteens.
 * Returns null if user is unauthenticated or user.role !== 'vendor' to guarantee fail-closed security.
 */
export async function getAuthenticatedVendorContext(): Promise<VendorContext | null> {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return null;
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Query public.users for vendor profile
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from("users")
      .select("role, canteen_id, canteens(id, name)")
      .eq("id", user.id)
      .limit(1);

    if (profileErr || !profiles || profiles.length === 0) {
      return null;
    }

    const p = profiles[0];
    if (p.role !== "vendor") {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canteen = (p.canteens as any) ?? null;
    const canteenId = canteen?.id ?? p.canteen_id ?? null;

    // Fail closed: a vendor account with no assigned canteen has nothing
    // to manage, and must not silently fall back to another vendor's shop.
    if (!canteenId) {
      return null;
    }

    const canteenName = canteen?.name ?? "";

    return {
      userId: user.id,
      role: "vendor",
      canteenId,
      canteenName,
    };
  } catch {
    return null;
  }
}
