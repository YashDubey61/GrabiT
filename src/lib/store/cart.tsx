"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CartItem, MenuItem } from "@/lib/types/database";

type CartState = {
  canteenId: string | null;
  items: CartItem[];
  timeSlotId: string | null;
};

type CartContextType = CartState & {
  addItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setTimeSlot: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalPaise: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({
    canteenId: null,
    items: [],
    timeSlotId: null,
  });

  const addItem = useCallback((menuItem: MenuItem) => {
    setCart((prev) => {
      // If adding from a different canteen, clear cart
      if (prev.canteenId && prev.canteenId !== menuItem.canteen_id) {
        return {
          canteenId: menuItem.canteen_id,
          items: [{ menu_item: menuItem, quantity: 1 }],
          timeSlotId: null,
        };
      }

      const existing = prev.items.find(
        (i) => i.menu_item.id === menuItem.id
      );
      if (existing) {
        return {
          ...prev,
          canteenId: menuItem.canteen_id,
          items: prev.items.map((i) =>
            i.menu_item.id === menuItem.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      return {
        ...prev,
        canteenId: menuItem.canteen_id,
        items: [...prev.items, { menu_item: menuItem, quantity: 1 }],
      };
    });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.menu_item.id !== menuItemId);
      return {
        ...prev,
        items,
        canteenId: items.length === 0 ? null : prev.canteenId,
      };
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(menuItemId);
    }
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.menu_item.id === menuItemId ? { ...i, quantity } : i
      ),
    }));
  }, [removeItem]);

  const setTimeSlot = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, timeSlotId: id }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ canteenId: null, items: [], timeSlotId: null });
  }, []);

  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalPaise = cart.items.reduce(
    (sum, i) => sum + i.menu_item.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        ...cart,
        addItem,
        removeItem,
        updateQuantity,
        setTimeSlot,
        clearCart,
        totalItems,
        subtotalPaise,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
