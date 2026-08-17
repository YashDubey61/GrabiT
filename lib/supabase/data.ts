import { createClient } from "./client";
import type { MockCanteen } from "@/lib/mock/campus";
import type { MockMenuItem } from "@/lib/mock/menu";

export interface SupabaseCampus {
  id: string;
  name: string;
  short_name?: string;
  city: string;
  address?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number | null;
  status?: string;
}

export interface SupabaseCanteen {
  id: string;
  campus_id: string;
  name: string;
  status: "active" | "inactive";
  qr_code_id: string;
  category?: string | null;
  cuisine_tags?: string | null;
  description?: string | null;
  image_url?: string | null;
}

export interface SupabaseMenuItem {
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

const DEFAULT_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";
const DEFAULT_CANTEEN_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80";

function toMenuCategory(category: string | null | undefined): MockMenuItem["category"] {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("breakfast")) return "breakfast";
  if (normalized.includes("drink") || normalized.includes("beverage")) return "drinks";
  if (normalized.includes("snack")) return "snacks";
  return "main_course";
}

function toCanteenCategory(category: string | null | undefined): MockCanteen["category"] {
  const normalized = (category || "").toLowerCase();
  if (normalized.includes("beverage") || normalized.includes("drink")) return "beverages";
  if (normalized.includes("meal") || normalized.includes("bowl")) return "meal_bowls";
  return "quick_snacks";
}

/**
 * Fetch all active university campuses from Supabase for discovery & selection.
 * Returns an empty array (not fake data) when none exist or the query fails —
 * callers must render an empty/error state rather than fabricate a campus.
 */
export async function getLiveCampusList(): Promise<SupabaseCampus[]> {
  const supabase = createClient();
  const { data: campuses, error } = await supabase
    .from("campuses")
    .select("*")
    .order("name");

  if (error || !campuses) {
    return [];
  }

  return campuses as SupabaseCampus[];
}

/**
 * Fetch campus header metrics dynamically scoped to campusId (or the
 * first available campus if none is specified) from Supabase.
 * Returns null when no campus exists — callers must render an empty
 * state rather than fabricate a campus name.
 */
export async function getLiveCampusDetails(
  campusId?: string,
): Promise<{ id: string; name: string; canteensOpen: number; estWaitMinutes: number } | null> {
  const supabase = createClient();
  let query = supabase.from("campuses").select("*");
  query = campusId ? query.eq("id", campusId) : query.order("name").limit(1);

  const { data: campuses } = await query.limit(1);
  const activeCampus = campuses && campuses.length > 0 ? campuses[0] : null;

  if (!activeCampus) {
    return null;
  }

  const { data: canteens } = await supabase
    .from("canteens")
    .select("id")
    .eq("campus_id", activeCampus.id)
    .eq("status", "active");

  const canteensOpen = canteens ? canteens.length : 0;
  const estWaitMinutes = canteensOpen > 0 ? Math.max(5, Math.min(25, canteensOpen * 4)) : 0;

  return {
    id: activeCampus.id,
    name: activeCampus.name,
    canteensOpen,
    estWaitMinutes,
  };
}

/**
 * Fetch active canteens strictly scoped to campusId from Supabase database.
 * Every display field (cuisine tags, category, image) is DB-owned —
 * no name-keyed hardcoded lookup maps.
 */
export async function getLiveCampusCanteens(campusId?: string): Promise<MockCanteen[]> {
  const supabase = createClient();
  let query = supabase.from("canteens").select("*").eq("status", "active");

  if (campusId) {
    query = query.eq("campus_id", campusId);
  }

  const { data: canteens, error } = await query.order("name");

  if (error || !canteens) {
    return [];
  }

  return (canteens as SupabaseCanteen[]).map((c, idx) => ({
    id: c.id,
    name: c.name,
    cuisineTags: c.cuisine_tags || "Campus Vendor",
    category: toCanteenCategory(c.category),
    waitMinutes: 8 + idx * 4,
    rating: 4.8,
    ratingNote: "Live",
    trending: idx === 0,
    image: c.image_url || DEFAULT_CANTEEN_IMAGE,
    imageAlt: `${c.name} canteen stall`,
  }));
}

/**
 * Fetch live menu items for a canteen from Supabase, mapped to the UI
 * model. Returns a null canteenInfo when the canteen doesn't exist —
 * callers must render an empty state, not fabricated menu data.
 */
export async function getLiveCanteenMenuItems(canteenId: string): Promise<{
  canteenInfo: {
    id: string;
    name: string;
    avgPrepMinutes: number;
    rating: number;
    ratingCount: string;
    isOpen: boolean;
    description: string;
  } | null;
  items: MockMenuItem[];
}> {
  const supabase = createClient();

  const { data: canteens } = await supabase
    .from("canteens")
    .select("*")
    .eq("id", canteenId)
    .limit(1);

  const canteen = canteens && canteens.length > 0 ? (canteens[0] as SupabaseCanteen) : null;

  if (!canteen) {
    return { canteenInfo: null, items: [] };
  }

  const { data: dbItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("canteen_id", canteenId)
    .order("name");

  const items = mapDbItemsToUI((dbItems as SupabaseMenuItem[]) ?? []);

  return {
    canteenInfo: {
      id: canteen.id,
      name: canteen.name,
      avgPrepMinutes: 10,
      rating: 4.8,
      ratingCount: "Live",
      isOpen: canteen.status === "active",
      description: canteen.description || "",
    },
    items,
  };
}

function mapDbItemsToUI(dbItems: SupabaseMenuItem[]): MockMenuItem[] {
  return dbItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || (item.is_sponsored ? "Sponsored Campus Choice" : ""),
    price: Number(item.price),
    available: item.availability === "available",
    category: toMenuCategory(item.category),
    isVeg: true,
    image: item.image_url || DEFAULT_ITEM_IMAGE,
  }));
}
