"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { calculateItemCount, calculateSubtotal } from "@/lib/cart/calculations";
import { EMPTY_CART, type CartItem, type CartState } from "@/lib/cart/types";

const STORAGE_KEY = "grabit_student_cart_v1";

interface AddItemInput {
  canteenId: string;
  canteenName: string;
  menuItemId: string;
  name: string;
  price: number;
  image: string;
}

interface CanteenConflict {
  attemptedCanteenName: string;
  pendingItem: AddItemInput;
}

interface CartContextValue extends CartState {
  itemCount: number;
  subtotal: number;
  conflict: CanteenConflict | null;
  addItem: (input: AddItemInput) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  clearCart: () => void;
  dismissConflict: () => void;
  /** Clears the current cart and adds the item that triggered the conflict. */
  resolveConflictByStartingOver: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadFromSession(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.items)) return EMPTY_CART;
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

/**
 * Owns the student's cart for the lifetime of the /student route group
 * (mounted once in app/student/layout.tsx) so Menu and Checkout read the
 * same state instead of each keeping their own copy.
 *
 * Persistence: sessionStorage only — survives client-side navigation and a
 * tab refresh, cleared when the tab closes. No Supabase, no server sync;
 * this is explicitly session-local per the Day 3 brief.
 *
 * Canteen consistency: a cart holds items from exactly one canteen. Adding
 * from a second canteen doesn't silently merge — it surfaces `conflict`,
 * which the calling screen renders as a message with a way to start over.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [conflict, setConflict] = useState<CanteenConflict | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client-only — sessionStorage doesn't exist during
  // SSR, so this can't be a lazy useState initializer without a
  // server/client hydration mismatch). This is exactly the "subscribe to
  // an external system" case the set-state-in-effect rule's own docs
  // describe as correct; suppressed with that justification rather than
  // restructured around it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(loadFromSession());
    setHydrated(true);
  }, []);

  // Persist on every change, once the initial load has happened (otherwise
  // the empty initial state would overwrite a real saved cart on mount).
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    setCart((prev) => {
      if (prev.canteenId && prev.canteenId !== input.canteenId) {
        setConflict({
          attemptedCanteenName: input.canteenName,
          pendingItem: input,
        });
        return prev;
      }

      const existing = prev.items.find((i) => i.menuItemId === input.menuItemId);
      const items: CartItem[] = existing
        ? prev.items.map((i) =>
            i.menuItemId === input.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [
            ...prev.items,
            {
              menuItemId: input.menuItemId,
              name: input.name,
              price: input.price,
              image: input.image,
              quantity: 1,
            },
          ];

      return { canteenId: input.canteenId, canteenName: input.canteenName, items };
    });
  }, []);

  const increment = useCallback((menuItemId: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    }));
  }, []);

  const decrement = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const items = prev.items
        .map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0);

      return items.length === 0 ? EMPTY_CART : { ...prev, items };
    });
  }, []);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);
  const dismissConflict = useCallback(() => setConflict(null), []);

  const resolveConflictByStartingOver = useCallback(() => {
    setConflict((current) => {
      if (!current) return null;
      const { pendingItem } = current;
      setCart({
        canteenId: pendingItem.canteenId,
        canteenName: pendingItem.canteenName,
        items: [
          {
            menuItemId: pendingItem.menuItemId,
            name: pendingItem.name,
            price: pendingItem.price,
            image: pendingItem.image,
            quantity: 1,
          },
        ],
      });
      return null;
    });
  }, []);

  const itemCount = useMemo(() => calculateItemCount(cart.items), [cart.items]);
  const subtotal = useMemo(() => calculateSubtotal(cart.items), [cart.items]);

  const value: CartContextValue = {
    ...cart,
    itemCount,
    subtotal,
    conflict,
    addItem,
    increment,
    decrement,
    clearCart,
    dismissConflict,
    resolveConflictByStartingOver,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
