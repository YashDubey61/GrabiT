/**
 * Mock data layer — Campus Home.
 *
 * Content and imagery are taken directly from the approved Stitch export
 * (stitch_grabit_campus_canteen_os/grabit_campus_home_premium_black/code.html)
 * so the screen is faithful to the reviewed design, not placeholder copy.
 *
 * This is a stand-in for a future Supabase query
 * (`select * from canteens where campus_id = ...`, joined with a
 * derived "wait time" / rating read model). Fields beyond the core
 * `Canteen` entity (types/index.ts) — rating, waitMinutes, cuisineTags,
 * trending, image — are display-layer only and don't belong in the DB
 * schema; they'd come from a joined view once real data exists.
 */

export type MockCanteenCategory =
  | "all"
  | "quick_snacks"
  | "beverages"
  | "meal_bowls";

export interface MockCanteen {
  id: string;
  name: string;
  cuisineTags: string;
  category: Exclude<MockCanteenCategory, "all">;
  waitMinutes: number;
  rating: number;
  ratingNote: string;
  trending?: boolean;
  image: string;
  imageAlt: string;
}

export const mockCampus = {
  name: "PSIT Kanpur",
  canteensOpen: 8,
  estWaitMinutes: 12,
};

export const mockCanteenCategories: { id: MockCanteenCategory; label: string }[] = [
  { id: "all", label: "All Stalls" },
  { id: "quick_snacks", label: "Quick Snacks" },
  { id: "beverages", label: "Beverages" },
  { id: "meal_bowls", label: "Meal Bowls" },
];

export const mockCanteens: MockCanteen[] = [
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
  {
    id: "the-juice-box",
    name: "The Juice Box",
    cuisineTags: "Beverages • Healthy",
    category: "beverages",
    waitMinutes: 4,
    rating: 4.9,
    ratingNote: "Eco-friendly",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCe8noNaVudY1yjOx4drKkuX49660V9AKcfGM3Knbx0qb1Y-mmor3uLWXqX7USHVDcTT7rCU223rAaF29ybXbUbOqtmvWhZOQlXJUWkgSgz-JkmiGBEpivPjCZXfhZ5srtYw39qIT5g3qsISF-kWVZ48LKHeatRkFmvsJKHCdmggoptAZ-dT2VnpYlqukdhU1AlNC_Bhk2ns_qXKcwnVnG1-3jASmTEpTwrdhsJihGdMDWwGsIkrNI8",
    imageAlt: "The Juice Box beverage stall with fresh fruit juices",
  },
  {
    id: "noodle-ninja",
    name: "Noodle Ninja",
    cuisineTags: "Chinese • Bowls",
    category: "meal_bowls",
    waitMinutes: 12,
    rating: 4.5,
    ratingNote: "Student Favorite",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJo0aeHfYekY6B06PF_t-PG16QdTXhjAGMBiihPYSAYXzDqVZKqnfHnCd1Lbvo44DrLJDTCxzXa2tJZlLnvQkK4VcEAVS-8RG58hopiUX-8GkmhSujNqnFrB4eGi3nuALpELu8qC66X6bl9-NxYzztb4QhjQ0n8J1B2oBt69CxmWPLtBk3kvlGNSDaNRmrSwogfm9YuassXNnL3_SEyia7SeqZ6IJIEK1bv1kXZwbcahpR4c_HAnsE",
    imageAlt: "Noodle Ninja bowl of pan-Asian noodles",
  },
];
