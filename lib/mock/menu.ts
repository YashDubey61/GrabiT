/**
 * Mock data layer — Menu (single canteen: "The Main Canteen").
 *
 * Content and imagery taken directly from the approved Stitch export
 * (stitch_grabit_campus_canteen_os/grabit_menu_premium_black/code.html).
 *
 * Stand-in for a future `select * from menu_items where canteen_id = ...`
 * query (types/index.ts MenuItem). The `category` field the Stitch tabs
 * imply isn't part of that DB entity yet — it would need a category
 * column or join once menu categorization becomes a real feature; kept
 * here as a mock-only field so swapping in Supabase later means changing
 * this file, not the components that render it.
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

export const mockCanteenInfo = {
  name: "The Main Canteen",
  avgPrepMinutes: 10,
  rating: 4.5,
  ratingCount: "200+ ratings",
  isOpen: true,
  description:
    "Delicious campus classics, from steaming dosas to quick bites, prepared with stealth speed for students on the move.",
};

export const mockMenuCategories: { id: MockMenuCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "breakfast", label: "Breakfast" },
  { id: "main_course", label: "Main Course" },
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
];

export const mockMenuItems: MockMenuItem[] = [
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    description: "Crispy crepe filled with spiced potato mash, served with chutney.",
    price: 45,
    available: true,
    category: "breakfast",
    isVeg: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDX6JyNsv-GTLYokghVcMG4VNdnMvHrdEd9DyeW-t_AFllfu7qCx30rL8PzN-y0SlV0-15qqMfZbrvmTdVmPocOmS1PCJH3-eGXeiU6vDmnLZCijXEQVAGrFmV8digQ8B0Hz8LxkckHhiqn7M20Ze999D6GutXz4OzwwQOTE1H--omqYYoQXal3JiCyirL2gEA3W4OQ7flcVTS0ihFHDd33zxdqgSjd5vGAHVrmuOE2dUjWqk3A8xUr",
  },
  {
    id: "veg-burger",
    name: "Veg Burger",
    description: "Signature campus burger with special herb mayo and fries.",
    price: 80,
    available: true,
    category: "main_course",
    isVeg: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDZBzLTcW8jMglof_WJYCishy5utlKfXNXx-fTlOXX7hEvRNJPaSTWNOpM4cXPjrfaKLcIn9aUftSkcSNLIJna0JusFxXKpuaMNog2ErNm3n7wuG9OLaMZAZjnReZ8TFyk2AWt07t8jJOzUuy88-FvyMLC3In-UR1Lov7nFSKWvv8xONyeErA7Z3ex23x8c2voEdWYJBcWsb-Tj192p4EZc6477IIpd7g_C95TCG2ZOo505Ui8aXozl",
  },
  {
    id: "schezwan-rice",
    name: "Schezwan Rice",
    description: "Spicy Indo-Chinese style rice with exotic veggies.",
    price: 110,
    available: true,
    category: "main_course",
    isVeg: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDdNpt1gEzH4qcAuM8yKr5JWRqEBS0xxyfmem88ZYAU5j_mcq-ew8Jl3v9qBq87RHvxNdHbu3fZ4db2Lk_rIyYz6ku2lSBfce48Cf_h5h6vkaJE0sB-de4ji7ucebmLhfCuG5nQtWIHFqdDsuJyUOEOCdmyILthk0xNMaezgkELTWHaqItC32mXgtPdJ4-1Y_wNf5oRaIExq5EruV9PMPLO4ODQ2KJTEk6g10z-nbladCnhJ_hsDjcK",
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    description: "Chilled creamy coffee with a hint of dark chocolate.",
    price: 60,
    available: true,
    category: "drinks",
    isVeg: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAhKOJWRDHE5pHgAsBGCCXoNBOmE7bJJmrnw4tTzLXCa7eCU6qN5513PNZsOOCcATIqrLB-Zx1zq5Bd21hKjVBKTiea0cPn0u8Cd67Ws_lYJbhnd4ZMf51Cxfg_c0chou_X1e4llEh8hKC0WYVfpsMyLWIUYN9es7uIOdkPymbMyUMNqgCdxH4CoWIP8rggBDHghe8mXFA2qCjAX-wbUziWKentmo04z7Z62IT5mVSwuWgKU1rh04aq",
  },
];
