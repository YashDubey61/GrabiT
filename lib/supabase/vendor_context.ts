import { createClient } from "./client";

/**
 * Client-side resolver for the authenticated vendor's own canteen_id.
 * Returns null if unauthenticated, not a vendor, or unassigned — callers
 * must fail closed (empty state) rather than fall back to any other
 * vendor's data.
 */
export async function getLiveVendorCanteenId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("role, canteen_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "vendor" || !profile.canteen_id) {
      return null;
    }

    return profile.canteen_id;
  } catch {
    return null;
  }
}

/** Resolves the authenticated vendor's own store/shop name, for header
 * display. Falls back to null (never "undefined"/"null") so callers can
 * show a safe default like "GrabIt". */
export async function getLiveVendorShopName(): Promise<string | null> {
  try {
    const canteenId = await getLiveVendorCanteenId();
    if (!canteenId) return null;

    const supabase = createClient();
    const { data } = await supabase
      .from("canteens")
      .select("name")
      .eq("id", canteenId)
      .maybeSingle();

    return data?.name || null;
  } catch {
    return null;
  }
}
