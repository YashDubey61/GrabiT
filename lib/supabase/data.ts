import { createClient } from "./client";
import type { MockCanteen } from "@/lib/mock/campus";
import type { MockMenuItem } from "@/lib/mock/menu";

export interface SupabaseCampus {
  id: string;
  name: string;
  city: string;
}

export interface SupabaseCanteen {
  id: string;
  campus_id: string;
  name: string;
  status: "active" | "inactive";
  qr_code_id: string;
}

export interface SupabaseMenuItem {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  availability: "available" | "unavailable";
  is_sponsored: boolean;
}

/**
 * Fetch campus header metrics from live Supabase database.
 */
export async function getLiveCampusDetails() {
  try {
    const supabase = createClient();
    const { data: campuses } = await supabase.from("campuses").select("*").limit(1);
    const { data: canteens } = await supabase
      .from("canteens")
      .select("*")
      .eq("status", "active");

    const campusName = campuses && campuses.length > 0 ? campuses[0].name : "PSIT Kanpur";
    const canteensOpen = canteens ? canteens.length : 8;

    return {
      name: campusName,
      canteensOpen,
      estWaitMinutes: 12,
    };
  } catch {
    return {
      name: "PSIT Kanpur",
      canteensOpen: 8,
      estWaitMinutes: 12,
    };
  }
}

/**
 * Fetch active canteens from live Supabase database mapped to UI model.
 */
export async function getLiveCampusCanteens(): Promise<MockCanteen[]> {
  try {
    const supabase = createClient();
    const { data: canteens, error } = await supabase
      .from("canteens")
      .select("*")
      .eq("status", "active");

    if (error || !canteens || canteens.length === 0) {
      return getFallbackCanteens();
    }

    // Default images and cuisine tags for UI rendering
    const canteenMetaMap: Record<
      string,
      { cuisine: string; cat: MockCanteen["category"]; img: string }
    > = {
      "Central Food Court": {
        cuisine: "North Indian • Snacks",
        cat: "quick_snacks",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgRixve2LcP9nMuEG2ZzwwvTVjMBY7QkkPz27PRjshIPvgDsDdMAVJF-9J1yRXRheb5raDcXWHFm7y9vah85uGpnV6mjM_9ZstijKOwPQuSaJojOJaTkbHH5CtEGFjS9R7zckFUePqrw0sPv8iC8oEtZA2G73mrPp4M67zpMduZirTDNdAG3u7a8VTRKiE3N4-iAz_AzuPWMiF-mdHkYc4QPZqRACl-9gaQEEe2lyB6rtm9gd_-A8",
      },
      "South Block Canteen": {
        cuisine: "Beverages • Healthy",
        cat: "beverages",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCe8noNaVudY1yjOx4drKkuX49660V9AKcfGM3Knbx0qb1Y-mmor3uLWXqX7USHVDcTT7rCU223rAaF29ybXbUbOqtmvWhZOQlXJUWkgSgz-JkmiGBEpivPjCZXfhZ5srtYw39qIT5g3qsISF-kWVZ48LKHeatRkFmvsJKHCdmggoptAZ-dT2VnpYlqukdhU1AlNC_Bhk2ns_qXKcwnVnG1-3jASmTEpTwrdhsJihGdMDWwGsIkrNI8",
      },
      "Galgotias Main Mess": {
        cuisine: "Chinese • Bowls",
        cat: "meal_bowls",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJo0aeHfYekY6B06PF_t-PG16QdTXhjAGMBiihPYSAYXzDqVZKqnfHnCd1Lbvo44DrLJDTCxzXa2tJZlLnvQkK4VcEAVS-8RG58hopiUX-8GkmhSujNqnFrB4eGi3nuALpELu8qC66X6bl9-NxYzztb4QhjQ0n8J1B2oBt69CxmWPLtBk3kvlGNSDaNRmrSwogfm9YuassXNnL3_SEyia7SeqZ6IJIEK1bv1kXZwbcahpR4c_HAnsE",
      },
    };

    return canteens.map((c, idx) => {
      const meta = canteenMetaMap[c.name] ?? {
        cuisine: "Campus Canteen • Snacks",
        cat: "quick_snacks",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgRixve2LcP9nMuEG2ZzwwvTVjMBY7QkkPz27PRjshIPvgDsDdMAVJF-9J1yRXRheb5raDcXWHFm7y9vah85uGpnV6mjM_9ZstijKOwPQuSaJojOJaTkbHH5CtEGFjS9R7zckFUePqrw0sPv8iC8oEtZA2G73mrPp4M67zpMduZirTDNdAG3u7a8VTRKiE3N4-iAz_AzuPWMiF-mdHkYc4QPZqRACl-9gaQEEe2lyB6rtm9gd_-A8",
      };

      return {
        id: c.id,
        name: c.name,
        cuisineTags: meta.cuisine,
        category: meta.cat,
        waitMinutes: 8 + idx * 4,
        rating: 4.8,
        ratingNote: "Live Supabase",
        trending: idx === 0,
        image: meta.img,
        imageAlt: `${c.name} canteen stall`,
      };
    });
  } catch {
    return getFallbackCanteens();
  }
}

function getFallbackCanteens(): MockCanteen[] {
  return [
    {
      id: "main-canteen",
      name: "Main Canteen",
      cuisineTags: "North Indian • Snacks",
      category: "quick_snacks",
      waitMinutes: 8,
      rating: 4.8,
      ratingNote: "500+ orders today",
      trending: true,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDbgRixve2LcP9nMuEG2ZzwwvTVjMBY7QkkPz27PRjshIPvgDsDdMAVJF-9J1yRXRheb5raDcXWHFm7y9vah85uGpnV6mjM_9ZstijKOwPQuSaJojOJaTkbHH5CtEGFjS9R7zckFUePqrw0sPv8iC8oEtZA2G73mrPp4M67zpMduZirTDNdAG3u7a8VTRKiE3N4-iAz_AzuPWMiF-mdHkYc4QPZqRACl-9gaQEEe2lyB6rtm9gd_-A8",
      imageAlt: "Main Canteen stall serving North Indian snacks",
    },
  ];
}

/**
 * Fetch live menu items from Supabase database mapped to UI model.
 */
export async function getLiveCanteenMenuItems(canteenId?: string): Promise<{
  canteenInfo: {
    id: string;
    name: string;
    avgPrepMinutes: number;
    rating: number;
    ratingCount: string;
    isOpen: boolean;
    description: string;
  };
  items: MockMenuItem[];
}> {
  try {
    const supabase = createClient();

    // 1. Fetch canteen details
    let canteenQuery = supabase.from("canteens").select("*");
    if (canteenId) {
      canteenQuery = canteenQuery.eq("id", canteenId);
    }
    const { data: canteens } = await canteenQuery.limit(1);
    const canteen = canteens && canteens.length > 0 ? canteens[0] : null;

    const targetCanteenId = canteen ? canteen.id : "ca000001-1111-1111-1111-111111111111";
    const canteenName = canteen ? canteen.name : "Central Food Court";

    // 2. Fetch menu items for canteen
    const { data: dbItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("canteen_id", targetCanteenId);

    if (error || !dbItems || dbItems.length === 0) {
      // Fetch all menu items if canteen filter has no items
      const { data: allDbItems } = await supabase.from("menu_items").select("*");
      if (allDbItems && allDbItems.length > 0) {
        return {
          canteenInfo: {
            id: targetCanteenId,
            name: canteenName,
            avgPrepMinutes: 10,
            rating: 4.8,
            ratingCount: "Live Supabase",
            isOpen: true,
            description: "Fresh campus meals served live from Supabase.",
          },
          items: mapDbItemsToUI(allDbItems as SupabaseMenuItem[]),
        };
      }
    }

    const items = mapDbItemsToUI((dbItems as SupabaseMenuItem[]) ?? []);

    return {
      canteenInfo: {
        id: targetCanteenId,
        name: canteenName,
        avgPrepMinutes: 10,
        rating: 4.8,
        ratingCount: "Live Supabase",
        isOpen: true,
        description: "Fresh campus meals served live from Supabase.",
      },
      items,
    };
  } catch {
    return {
      canteenInfo: {
        id: "ca000001-1111-1111-1111-111111111111",
        name: "Central Food Court",
        avgPrepMinutes: 10,
        rating: 4.8,
        ratingCount: "Live Supabase",
        isOpen: true,
        description: "Fresh campus meals served live from Supabase.",
      },
      items: [],
    };
  }
}

function mapDbItemsToUI(dbItems: SupabaseMenuItem[]): MockMenuItem[] {
  const itemImageMap: Record<string, { img: string; cat: MockMenuItem["category"] }> = {
    "Butter Paneer Meal Box": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
      cat: "main_course",
    },
    "Cold Coffee Float": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhKOJWRDHE5pHgAsBGCCXoNBOmE7bJJmrnw4tTzLXCa7eCU6qN5513PNZsOOCcATIqrLB-Zx1zq5Bd21hKjVBKTiea0cPn0u8Cd67Ws_lYJbhnd4ZMf51Cxfg_c0chou_X1e4llEh8hKC0WYVfpsMyLWIUYN9es7uIOdkPymbMyUMNqgCdxH4CoWIP8rggBDHghe8mXFA2qCjAX-wbUziWKentmo04z7Z62IT5mVSwuWgKU1rh04aq",
      cat: "drinks",
    },
    "Special Masala Dosa": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDX6JyNsv-GTLYokghVcMG4VNdnMvHrdEd9DyeW-t_AFllfu7qCx30rL8PzN-y0SlV0-15qqMfZbrvmTdVmPocOmS1PCJH3-eGXeiU6vDmnLZCijXEQVAGrFmV8digQ8B0Hz8LxkckHhiqn7M20Ze999D6GutXz4OzwwQOTE1H--omqYYoQXal3JiCyirL2gEA3W4OQ7flcVTS0ihFHDd33zxdqgSjd5vGAHVrmuOE2dUjWqk3A8xUr",
      cat: "breakfast",
    },
    "Veg Cheese Grilled Sandwich": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdNpt1gEzH4qcAuM8yKr5JWRqEBS0xxyfmem88ZYAU5j_mcq-ew8Jl3v9qBq87RHvxNdHbu3fZ4db2Lk_rIyYz6ku2lSBfce48Cf_h5h6vkaJE0sB-de4ji7ucebmLhfCuG5nQtWIHFqdDsuJyUOEOCdmyILthk0xNMaezgkELTWHaqItC32mXgtPdJ4-1Y_wNf5oRaIExq5EruV9PMPLO4ODQ2KJTEk6g10z-nbladCnhJ_hsDjcK",
      cat: "snacks",
    },
    "Desi Chai (Kulhad)": {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhKOJWRDHE5pHgAsBGCCXoNBOmE7bJJmrnw4tTzLXCa7eCU6qN5513PNZsOOCcATIqrLB-Zx1zq5Bd21hKjVBKTiea0cPn0u8Cd67Ws_lYJbhnd4ZMf51Cxfg_c0chou_X1e4llEh8hKC0WYVfpsMyLWIUYN9es7uIOdkPymbMyUMNqgCdxH4CoWIP8rggBDHghe8mXFA2qCjAX-wbUziWKentmo04z7Z62IT5mVSwuWgKU1rh04aq",
      cat: "drinks",
    },
  };

  return dbItems.map((item) => {
    const meta = itemImageMap[item.name] ?? {
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
      cat: "main_course",
    };

    return {
      id: item.id,
      name: item.name,
      description: item.is_sponsored ? "⭐ Sponsored Campus Choice" : "Freshly prepared canteen item.",
      price: Number(item.price),
      available: item.availability === "available",
      category: meta.cat,
      isVeg: true,
      image: meta.img,
    };
  });
}
