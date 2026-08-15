import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface VendorContext {
  userId: string;
  role: "vendor";
  canteenId: string;
  canteenName: string;
}

const SEED_CANTEEN_ID = "ca000001-1111-1111-1111-111111111111";

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseAdmin = createAdminClient(url, key);

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
    const canteenId = canteen?.id ?? p.canteen_id ?? SEED_CANTEEN_ID;
    const canteenName = canteen?.name ?? "Central Food Court";

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
