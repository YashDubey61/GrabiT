/**
 * Shared cart types. This is UI/session state, not a DB entity — it will
 * eventually seed an `orders` + `order_items` insert (TRD §4), but until
 * Supabase is connected it lives in the browser only (React Context +
 * sessionStorage, see CartContext.tsx).
 */

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartState {
  canteenId: string | null;
  canteenName: string | null;
  items: CartItem[];
}

export const EMPTY_CART: CartState = {
  canteenId: null,
  canteenName: null,
  items: [],
};
