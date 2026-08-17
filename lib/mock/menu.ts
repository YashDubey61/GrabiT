/**
 * UI type contracts for the Menu screen — used by
 * lib/supabase/data.ts (live Supabase queries) and the components that
 * render it. No sample/demo menu data lives here; every `MockMenuItem`
 * value in the app is populated from the database.
 */

export type MockMenuCategory =
  | "all"
  | "breakfast"
  | "main_course"
  | "drinks"
  | "snacks";

export interface MockMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: Exclude<MockMenuCategory, "all">;
  isVeg: boolean;
}

export const mockMenuCategories: { id: MockMenuCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "breakfast", label: "Breakfast" },
  { id: "main_course", label: "Main Course" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
];
