import { createClient } from "./client";

export interface VendorCategory {
  id: string;
  name: string;
}

/** Vendor-scoped menu categories — read via the browser client (RLS
 * already confines rows to the caller's own canteen_id). */
export async function getLiveVendorCategories(): Promise<VendorCategory[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vendor_categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}
