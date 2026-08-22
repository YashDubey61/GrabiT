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
import { CanteenConflictModal } from "@/components/student/CanteenConflictModal";

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

function loadFromStorage(): CartState {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return EMPTY_CART;
    }
    return parsed;
  } catch {
    return EMPTY_CART;
  }
}

/**
 * Owns the student's cart for the lifetime of the /customer route group
 * (mounted once in app/customer/layout.tsx) so Menu and Checkout read the
 * same state instead of each keeping their own copy.
 *
 * Persistence: localStorage + sessionStorage — survives client-side navigation,
 * tab refresh, window re-open, and session restoration.
 *
 * Canteen consistency: a cart holds items from exactly ONE vendor. Adding
 * from a second vendor doesn't silently merge or wipe — it surfaces `conflict`,
 * which renders the global vendor-conflict modal for explicit user choice.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [conflict, setConflict] = useState<CanteenConflict | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const json = JSON.stringify(cart);
    try {
      window.localStorage.setItem(STORAGE_KEY, json);
      window.sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
      // Storage quota or restriction protection
    }
  }, [cart, hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    setCart((prev) => {
      // Strict one-vendor-per-order check
      if (prev.canteenId && prev.items.length > 0 && prev.canteenId !== input.canteenId) {
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

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }, []);

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

  return (
    <CartContext.Provider value={value}>
      {children}
      {conflict && (
        <CanteenConflictModal
          currentCanteenName={cart.canteenName ?? "Current Vendor"}
          attemptedCanteenName={conflict.attemptedCanteenName}
          onKeepCurrentCart={dismissConflict}
          onStartOver={resolveConflictByStartingOver}
        />
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
