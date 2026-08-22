import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl } from "@/lib/utils/image";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type RecommendationCategory =
  | "ORDER_AGAIN"
  | "POPULAR_AT_CAMPUS"
  | "TRENDING_NOW"
  | "POPULAR_AT_CANTEEN"
  | "TIME_OF_DAY"
  | "FREQUENTLY_ORDERED"
  | "NEW_DISCOVERY"
  | "BEST_SELLER";

export interface RecommendationItem {
  itemId: string;
  title: string;
  reason: string;
  category: RecommendationCategory;
  score: number; // 0 - 100
  canteenId: string;
  canteenName: string;
  price: number; // Current menu price (menu_items.price) for display
  isAvailable: boolean;
  itemCategory: string;
  imageUrl: string;
}

export interface StudentRecommendationsPayload {
  recommendations: RecommendationItem[];
  timeBucket: "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "LATE_NIGHT";
  isPersonalized: boolean;
  campusName: string;
  updatedAt: string;
}

function getTimeBucket():
  "BREAKFAST" | "LUNCH" | "SNACK" | "DINNER" | "LATE_NIGHT" {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 11) return "BREAKFAST";
  if (hour >= 11 && hour < 15) return "LUNCH";
  if (hour >= 15 && hour < 19) return "SNACK";
  if (hour >= 19 && hour < 23) return "DINNER";
  return "LATE_NIGHT";
}

/**
 * Derives deterministic, explainable Student Personalization & Recommendations for Student Platform.
 * Strictly uses authenticated auth.uid() identity. Ignores client-supplied student/user IDs.
 */
export async function getStudentRecommendations(): Promise<StudentRecommendationsPayload> {
  const adminSupabase = getSupabaseAdminClient();

  // 1. Authenticate student via server cookies
  const serverSupabase = await createClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  const studentUserId = user?.id ?? null;
  const timeBucket = getTimeBucket();

  // 2. Fetch all current menu items to get current prices and availability
  const { data: dbMenuItems } = await adminSupabase
    .from("menu_items")
    .select(
      "id, canteen_id, name, category, price, availability, image_url, canteens(id, name, campus_id, campuses(id, name))",
    );

  const menuItemsList = dbMenuItems ?? [];

  // Filter ONLY available items (Availability Filtering)
  const availableItemsMap = new Map<
    string,
    {
      id: string;
      canteenId: string;
      name: string;
      category: string;
      price: number;
      canteenName: string;
      campusName: string;
      imageUrl: string;
    }
  >();

  menuItemsList.forEach((m) => {
    if (m.availability === "available") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canteen = m.canteens as any;
      availableItemsMap.set(m.id, {
        id: m.id,
        canteenId: m.canteen_id,
        name: m.name,
        category: m.category || "General",
        price: Number(m.price) || 0,
        canteenName: canteen?.name || "Campus Canteen",
        campusName: canteen?.campuses?.name || "Campus",
        imageUrl: resolveImageUrl(m.image_url, "dish"),
      });
    }
  });

  const recommendationList: RecommendationItem[] = [];
  let isPersonalized = false;
  let campusName = "Campus";

  // 3. ORDER AGAIN ENGINE (If authenticated student has order history)
  if (studentUserId) {
    const { data: studentOrders } = await adminSupabase
      .from("orders")
      .select("id, status, created_at")
      .eq("student_id", studentUserId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(30);

    const completedOrderIds = (studentOrders ?? []).map((o) => o.id);

    if (completedOrderIds.length > 0) {
      const { data: studentItems } = await adminSupabase
        .from("order_items")
        .select("menu_item_id, quantity, created_at")
        .in("order_id", completedOrderIds);

      const itemFrequencyMap = new Map<
        string,
        { count: number; lastOrdered: string }
      >();

      (studentItems ?? []).forEach((si) => {
        const existing = itemFrequencyMap.get(si.menu_item_id) ?? {
          count: 0,
          lastOrdered: si.created_at || new Date().toISOString(),
        };
        existing.count += Number(si.quantity) || 1;
        if (new Date(si.created_at) > new Date(existing.lastOrdered)) {
          existing.lastOrdered = si.created_at;
        }
        itemFrequencyMap.set(si.menu_item_id, existing);
      });

      // Score and rank student's previous items
      Array.from(itemFrequencyMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([itemId, stats]) => {
          const item = availableItemsMap.get(itemId);
          if (item) {
            // Formula: frequencyScore * 0.45 + recencyScore * 0.35 + completionScore * 0.20
            const freqScore = Math.min(100, stats.count * 25);
            const score = Math.round(freqScore * 0.45 + 90 * 0.35 + 100 * 0.2);
            campusName = item.campusName;
            isPersonalized = true;

            recommendationList.push({
              itemId: item.id,
              title: item.name,
              reason: `Ordered ${stats.count} time${stats.count > 1 ? "s" : ""} by you`,
              category: "ORDER_AGAIN",
              score,
              canteenId: item.canteenId,
              canteenName: item.canteenName,
              price: item.price, // Current menu price (menu_items.price)
              isAvailable: true,
              itemCategory: item.category,
              imageUrl: item.imageUrl,
            });
          }
        });
    }
  }

  // 4. CAMPUS POPULARITY & CANTEEN POPULARITY ENGINE
  const { data: recentOrderItems } = await adminSupabase
    .from("order_items")
    .select("menu_item_id, quantity, price_at_order, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const globalPopularityMap = new Map<string, number>();
  (recentOrderItems ?? []).forEach((oi) => {
    const current = globalPopularityMap.get(oi.menu_item_id) ?? 0;
    globalPopularityMap.set(
      oi.menu_item_id,
      current + (Number(oi.quantity) || 1),
    );
  });

  const popularItems = Array.from(globalPopularityMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  // Add Popular at Campus items
  popularItems.forEach(([itemId, qty]) => {
    const item = availableItemsMap.get(itemId);
    if (item && !recommendationList.some((r) => r.itemId === item.id)) {
      recommendationList.push({
        itemId: item.id,
        title: item.name,
        reason: `Popular at ${item.campusName}`,
        category: "POPULAR_AT_CAMPUS",
        score: Math.min(95, 70 + qty * 2),
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        price: item.price,
        isAvailable: true,
        itemCategory: item.category,
        imageUrl: item.imageUrl,
      });
    }
  });

  // 5. TRENDING NOW ENGINE (Short-window demand velocity)
  popularItems.slice(0, 3).forEach(([itemId, qty]) => {
    const item = availableItemsMap.get(itemId);
    if (
      item &&
      !recommendationList.some(
        (r) => r.itemId === item.id && r.category === "TRENDING_NOW",
      )
    ) {
      recommendationList.push({
        itemId: item.id,
        title: item.name,
        reason: `Trending ${timeBucket.toLowerCase()} pick`,
        category: "TRENDING_NOW",
        score: Math.min(98, 80 + qty * 3),
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        price: item.price,
        isAvailable: true,
        itemCategory: item.category,
        imageUrl: item.imageUrl,
      });
    }
  });

  // 6. TIME-OF-DAY ENGINE
  availableItemsMap.forEach((item) => {
    let matchesTime = false;
    if (
      timeBucket === "BREAKFAST" &&
      (item.category.toLowerCase().includes("snack") ||
        item.name.toLowerCase().includes("tea") ||
        item.name.toLowerCase().includes("dosa"))
    )
      matchesTime = true;
    if (
      timeBucket === "LUNCH" &&
      (item.category.toLowerCase().includes("meal") ||
        item.name.toLowerCase().includes("thali") ||
        item.name.toLowerCase().includes("combo"))
    )
      matchesTime = true;
    if (
      timeBucket === "SNACK" &&
      (item.category.toLowerCase().includes("beverage") ||
        item.name.toLowerCase().includes("burger") ||
        item.name.toLowerCase().includes("coffee"))
    )
      matchesTime = true;
    if (
      timeBucket === "DINNER" &&
      (item.category.toLowerCase().includes("meal") ||
        item.name.toLowerCase().includes("paneer"))
    )
      matchesTime = true;

    if (matchesTime && !recommendationList.some((r) => r.itemId === item.id)) {
      recommendationList.push({
        itemId: item.id,
        title: item.name,
        reason: `Popular during ${timeBucket.toLowerCase()}`,
        category: "TIME_OF_DAY",
        score: 85,
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        price: item.price,
        isAvailable: true,
        itemCategory: item.category,
        imageUrl: item.imageUrl,
      });
    }
  });

  // 7. Fallback if no items in DB yet
  if (recommendationList.length === 0) {
    availableItemsMap.forEach((item) => {
      recommendationList.push({
        itemId: item.id,
        title: item.name,
        reason: `Best Seller at ${item.canteenName}`,
        category: "BEST_SELLER",
        score: 80,
        canteenId: item.canteenId,
        canteenName: item.canteenName,
        price: item.price,
        isAvailable: true,
        itemCategory: item.category,
        imageUrl: item.imageUrl,
      });
    });
  }

  // 8. RECOMMENDATION DIVERSITY RULES:
  // - Max 2 items from same category
  // - Max 3 items from same canteen
  const categoryCounts = new Map<string, number>();
  const canteenCounts = new Map<string, number>();
  const finalRecommendations: RecommendationItem[] = [];

  recommendationList.sort((a, b) => b.score - a.score);

  for (const rec of recommendationList) {
    const catCount = categoryCounts.get(rec.itemCategory) ?? 0;
    const cantCount = canteenCounts.get(rec.canteenId) ?? 0;

    if (catCount < 2 && cantCount < 3) {
      finalRecommendations.push(rec);
      categoryCounts.set(rec.itemCategory, catCount + 1);
      canteenCounts.set(rec.canteenId, cantCount + 1);
    }

    if (finalRecommendations.length >= 6) break;
  }

  return {
    recommendations: finalRecommendations,
    timeBucket,
    isPersonalized,
    campusName,
    updatedAt: new Date().toISOString(),
  };
}
