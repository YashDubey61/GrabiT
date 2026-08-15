import { createClient } from "./client";
import type { VendorMenuItem, VendorMenuCategory } from "@/lib/mock/vendor";

export interface SupabaseMenuItemRow {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  availability: "available" | "unavailable";
  is_sponsored: boolean;
  created_at: string;
}

const DEFAULT_CANTEEN_ID = "ca000001-1111-1111-1111-111111111111";

/**
 * Fetch live vendor menu items from Supabase database.
 */
export async function getLiveVendorMenuItems(
  canteenId: string = DEFAULT_CANTEEN_ID,
): Promise<VendorMenuItem[]> {
  try {
    const supabase = createClient();
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (error || !items) {
      return [];
    }

    return items.map(mapSupabaseMenuItemToUI);
  } catch {
    return [];
  }
}

/**
 * Add a new live menu item via server API.
 */
export async function addLiveVendorMenuItem(itemData: {
  name: string;
  price: number;
  category?: VendorMenuCategory;
  description?: string;
  inStock?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/vendor/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemData.name,
        price: itemData.price,
        category: itemData.category,
        description: itemData.description,
        availability: itemData.inStock === false ? "unavailable" : "available",
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Failed to add menu item." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error adding menu item." };
  }
}

/**
 * Update an existing live menu item via server API.
 */
export async function updateLiveVendorMenuItem(
  id: string,
  itemData: {
    name?: string;
    price?: number;
    category?: VendorMenuCategory;
    description?: string;
    inStock?: boolean;
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/vendor/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: itemData.name,
        price: itemData.price,
        availability: itemData.inStock !== undefined ? (itemData.inStock ? "available" : "unavailable") : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Failed to update menu item." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error updating menu item." };
  }
}

/**
 * Toggle menu item stock availability (available ↔ unavailable).
 */
export async function toggleLiveVendorMenuItemStock(
  id: string,
  inStock: boolean,
): Promise<{ ok: boolean; error?: string }> {
  return updateLiveVendorMenuItem(id, { inStock });
}

function mapSupabaseMenuItemToUI(row: SupabaseMenuItemRow): VendorMenuItem {
  const price = Number(row.price);
  let category: VendorMenuCategory = "Lunch";

  const lowerName = row.name.toLowerCase();
  if (lowerName.includes("dosa") || lowerName.includes("chai") || lowerName.includes("tea") || lowerName.includes("coffee")) {
    category = "Breakfast";
  } else if (lowerName.includes("float") || lowerName.includes("soda") || lowerName.includes("juice")) {
    category = "Beverages";
  } else if (lowerName.includes("sandwich") || lowerName.includes("vada") || lowerName.includes("burger")) {
    category = "Snacks";
  }

  return {
    id: row.id,
    name: row.name,
    description: `Freshly prepared ${row.name} at Central Canteen.`,
    price,
    category,
    inStock: row.availability === "available",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDZJOsZC2WTR9Mf_IxY3m4yqQ8Y8wMwd2TS6HxDopTGA_DGGQamchaCR_uoLZ-zRhN1JFjCmYfXP4zclth26t59-EeFbwZpUCTDyW8EZk-8TsYcVNjZXJEJi87-S8-GPjoZamBExSnAbseaZzmiPjSMV52hUibuKRjDHXc2JH9QhumI7atkXb-HwcnHPc5OOAnRIK2-_cnvFElwxcluIyVRnee766ArY2JO-wO9Hclr0O1UOJDy6c0g",
  };
}
