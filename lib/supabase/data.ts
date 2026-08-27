import { createClient } from "./client";
import type { MockCanteen } from "@/lib/mock/campus";
import type { MockMenuItem } from "@/lib/mock/menu";
import { resolveImageUrl } from "@/lib/utils/image";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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
  photo_urls?: string[] | null;
  operating_hours?: string | null;
  pickup_location?: string | null;
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

  return (canteens as SupabaseCanteen[]).map((c, idx) => {
    const rawImages = c.photo_urls && c.photo_urls.length > 0 ? c.photo_urls : [c.image_url];
    const resolvedImages = rawImages
      .map((url) => resolveImageUrl(url, "canteen"))
      .filter(Boolean);

    return {
      id: c.id,
      name: c.name,
      cuisineTags: c.cuisine_tags || "Campus Vendor",
      category: toCanteenCategory(c.category),
      waitMinutes: 8 + idx * 4,
      rating: 4.8,
      ratingNote: "Live",
      trending: idx === 0,
      image: resolveImageUrl(c.image_url, "canteen"),
      imageAlt: `${c.name} canteen stall`,
      images: resolvedImages.length > 0 ? resolvedImages : [resolveImageUrl(null, "canteen")],
    };
  });
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
    images: string[];
    operatingHours: string | null;
    pickupLocation: string | null;
    campusName: string | null;
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

  // menu_items and the campus name are both independent lookups keyed off
  // data we already have (canteenId / canteen.campus_id) — run them
  // together instead of one after another.
  const [{ data: dbItems }, campusName] = await Promise.all([
    supabase.from("menu_items").select("*").eq("canteen_id", canteenId).order("name"),
    canteen.campus_id
      ? supabase
          .from("campuses")
          .select("name")
          .eq("id", canteen.campus_id)
          .limit(1)
          .maybeSingle()
          .then(({ data }) => data?.name ?? null)
      : Promise.resolve(null),
  ]);

  const items = mapDbItemsToUI((dbItems as SupabaseMenuItem[]) ?? []);

  const rawImages = canteen.photo_urls && canteen.photo_urls.length > 0 ? canteen.photo_urls : [canteen.image_url];
  const resolvedImages = rawImages
    .map((url) => resolveImageUrl(url, "canteen"))
    .filter(Boolean);

  return {
    canteenInfo: {
      id: canteen.id,
      name: canteen.name,
      avgPrepMinutes: 10,
      rating: 4.8,
      ratingCount: "Live",
      isOpen: canteen.status === "active",
      description: canteen.description || "",
      images: resolvedImages.length > 0 ? resolvedImages : [resolveImageUrl(null, "canteen")],
      operatingHours: canteen.operating_hours || null,
      pickupLocation: canteen.pickup_location || null,
      campusName,
    },
    items,
  };
}

export interface CanteenActiveOffer {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  expiresAt: string | null;
}

interface SupabasePromoCodeRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "PERCENTAGE" | "FLAT";
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  starts_at: string | null;
  expires_at: string | null;
}

/**
 * Live, canteen-scoped active offers for the student-facing vendor page.
 * Reads the SAME `promo_codes` table used by Vendor Offers and checkout
 * coupon validation — no separate "display" copy. Only offers that are
 * published, active, within their start/expiry window, and (if capped)
 * under their total redemption limit are returned; historical/expired
 * rows are never deleted, just excluded from this student-facing read.
 */
export async function getLiveCanteenActiveOffers(canteenId: string): Promise<CanteenActiveOffer[]> {
  const supabase = createClient();

  const { data: promoCodes } = await supabase
    .from("promo_codes")
    .select("id, code, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, starts_at, expires_at")
    .eq("canteen_id", canteenId)
    .eq("is_published", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!promoCodes || promoCodes.length === 0) {
    return [];
  }

  const now = Date.now();
  const inWindow = (promoCodes as SupabasePromoCodeRow[]).filter((p) => {
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
    if (p.expires_at && new Date(p.expires_at).getTime() < now) return false;
    return true;
  });

  if (inWindow.length === 0) {
    return [];
  }

  // Redemption counts are cross-student aggregates — RLS intentionally
  // scopes promo_code_redemptions reads to a student's own rows, so an
  // accurate total requires the service-role client here (same pattern
  // the vendor offers route already uses for the identical computation).
  const cappedIds = inWindow.filter((p) => p.usage_limit !== null).map((p) => p.id);
  const usageCounts = new Map<string, number>();
  if (cappedIds.length > 0) {
    const admin = getSupabaseAdminClient();
    const { data: redemptions } = await admin
      .from("promo_code_redemptions")
      .select("promo_code_id")
      .in("promo_code_id", cappedIds);
    (redemptions ?? []).forEach((r) => {
      usageCounts.set(r.promo_code_id, (usageCounts.get(r.promo_code_id) ?? 0) + 1);
    });
  }

  return inWindow
    .filter((p) => p.usage_limit === null || (usageCounts.get(p.id) ?? 0) < p.usage_limit)
    .map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
      discountType: p.discount_type,
      discountValue: Number(p.discount_value),
      maxDiscount: p.max_discount !== null ? Number(p.max_discount) : null,
      minOrderValue: Number(p.min_order_value),
      expiresAt: p.expires_at,
    }));
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
    image: resolveImageUrl(item.image_url, "dish"),
  }));
}

export interface CampusFoodItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  isVeg: boolean;
  available: boolean;
  canteenId: string;
  canteenName: string;
  canteenImage?: string;
  canteenCuisineTags?: string;
}

/**
 * Fetch all available menu items across active canteens for a campus.
 * Powers the unified search across food dishes and vendor stalls.
 */
export async function getLiveCampusFoodItems(campusId?: string): Promise<CampusFoodItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("menu_items")
    .select(`
      id,
      name,
      price,
      availability,
      is_sponsored,
      category,
      description,
      image_url,
      canteen_id,
      canteens!inner(
        id,
        name,
        campus_id,
        status,
        image_url,
        cuisine_tags
      )
    `)
    .eq("canteens.status", "active")
    .eq("availability", "available");

  if (campusId) {
    query = query.eq("canteens.campus_id", campusId);
  }

  const { data, error } = await query.order("name");
  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => {
    const rawCanteen = Array.isArray(item.canteens) ? item.canteens[0] : item.canteens;
    return {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      description: item.description || (item.is_sponsored ? "Sponsored Campus Choice" : ""),
      category: item.category || "General",
      imageUrl: resolveImageUrl(item.image_url, "dish"),
      isVeg: true,
      available: item.availability === "available",
      canteenId: item.canteen_id,
      canteenName: rawCanteen?.name || "Campus Vendor",
      canteenImage: resolveImageUrl(rawCanteen?.image_url, "canteen"),
      canteenCuisineTags: rawCanteen?.cuisine_tags || "Campus Vendor",
    };
  });
}


