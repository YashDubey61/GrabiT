/**
 * UI type contracts for Campus Home — canteen shape used by
 * lib/supabase/data.ts (live Supabase queries) and the components that
 * render it. No sample/demo data lives here; every `MockCanteen` value
 * in the app is populated from the database.
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

export const mockCanteenCategories: { id: MockCanteenCategory; label: string }[] = [
  { id: "all", label: "All Stalls" },
  { id: "quick_snacks", label: "Quick Snacks" },
  { id: "beverages", label: "Beverages" },
  { id: "meal_bowls", label: "Meal Bowls" },
];
