import { createClient } from "./client";
import type { VendorMenuItem, VendorMenuCategory } from "@/lib/mock/vendor";

export interface SupabaseMenuItemRow {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  availability: "available" | "unavailable";
  is_sponsored: boolean;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
}

/**
 * Fetch live vendor menu items from Supabase database, strictly scoped
 * to the given canteen. Fails closed (returns []) with no canteenId.
 */
export async function getLiveVendorMenuItems(
  canteenId: string | null,
): Promise<VendorMenuItem[]> {
  if (!canteenId) return [];
  try {
    const supabase = createClient();
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("name", { ascending: true });

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

const DEFAULT_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

function toVendorCategory(category: string | null | undefined): VendorMenuCategory {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("breakfast")) return "Breakfast";
  if (normalized.includes("beverage") || normalized.includes("drink")) return "Beverages";
  if (normalized.includes("snack")) return "Snacks";
  return "Lunch";
}

function mapSupabaseMenuItemToUI(row: SupabaseMenuItemRow): VendorMenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: Number(row.price),
    category: toVendorCategory(row.category),
    inStock: row.availability === "available",
    imageUrl: row.image_url || DEFAULT_ITEM_IMAGE,
  };
}
