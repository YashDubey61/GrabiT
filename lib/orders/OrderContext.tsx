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
import { calculateSubtotal, getMockPlatformFee } from "@/lib/cart/calculations";
import type { CartItem } from "@/lib/cart/types";
import type { PickupSlot } from "@/components/student/PickupSlotSelector";
import type { PaymentMethod } from "@/components/student/PaymentMethodSelector";
import type { Order } from "@/lib/orders/types";

const STORAGE_KEY = "grabit_student_orders_v1";
/** PRD §7.1's own example order number is "#41" — starting the mock
 * counter there rather than at 1 so it reads like a live campus, not a
 * freshly-seeded demo. */
const FIRST_ORDER_NUMBER = 41;
/** Matches mockCanteenInfo.avgPrepMinutes (lib/mock/menu.ts) — the only
 * canteen in the current mock data, so this is a reasonable stand-in
 * until orders carry a real per-canteen prep time. */
const DEFAULT_PREP_MINUTES = 10;

interface StoredState {
  orders: Order[];
  nextOrderNumber: number;
}

const EMPTY_STATE: StoredState = { orders: [], nextOrderNumber: FIRST_ORDER_NUMBER };

interface CreateOrderInput {
  canteenId: string;
  canteenName: string;
  items: CartItem[];
  slot: PickupSlot;
  paymentMethod: PaymentMethod;
}

type CreateOrderResult = { ok: true; order: Order } | { ok: false; error: string };

interface OrderContextValue {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => CreateOrderResult;
  getOrder: (id: string) => Order | undefined;
  getCurrentOrder: () => Order | undefined;
  getOrdersForStudent: () => Order[];
  /** Dev-only status progression — see DevOrderStatusControls. Not a
   * stand-in for the real Vendor → Supabase Realtime → Student path. */
  updateOrderStatus: (id: string, status: Order["status"]) => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

function loadFromSession(): StoredState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed || !Array.isArray(parsed.orders)) return EMPTY_STATE;
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

/**
 * Local order repository — the mock stand-in for TRD §7's `/api/orders`
 * + Supabase `orders`/`order_items` tables. Mounted once in
 * app/student/layout.tsx, next to CartProvider, so Checkout and Track
 * Order (and Day 5's Order History) all read the same store.
 *
 * Persistence: sessionStorage, same pattern as CartContext — survives a
 * refresh within the tab, cleared when the tab closes. No cross-device
 * sync, no Supabase, by design (Day 4 scope).
 */
export function OrderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Loading persisted state from sessionStorage on mount; see
    // CartContext.tsx for the identical, already-justified pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadFromSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const createOrder = useCallback((input: CreateOrderInput): CreateOrderResult => {
    if (input.items.length === 0) {
      return { ok: false, error: "Your cart is empty." };
    }
    if (input.items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      return { ok: false, error: "One of your items has an invalid quantity." };
    }
    const subtotal = calculateSubtotal(input.items);
    if (subtotal <= 0) {
      return { ok: false, error: "Order total must be greater than zero." };
    }

    const platformFee = getMockPlatformFee(subtotal);
    const now = new Date();
    const estimatedReadyAt = new Date(
      now.getTime() + DEFAULT_PREP_MINUTES * 60_000,
    ).toISOString();

    let created!: Order;
    setState((prev) => {
      created = {
        id: `order_${crypto.randomUUID()}`,
        orderNumber: `#${prev.nextOrderNumber}`,
        canteenId: input.canteenId,
        canteenName: input.canteenName,
        studentId: null,
        slot: input.slot,
        status: "placed",
        paymentMethod: input.paymentMethod,
        items: input.items.map((item) => ({
          id: item.menuItemId,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          lineTotal: item.price * item.quantity,
        })),
        subtotal,
        platformFee,
        totalAmount: subtotal + platformFee,
        createdAt: now.toISOString(),
        estimatedReadyAt,
      };
      return {
        orders: [...prev.orders, created],
        nextOrderNumber: prev.nextOrderNumber + 1,
      };
    });

    return { ok: true, order: created };
  }, []);

  const getOrder = useCallback(
    (id: string) => state.orders.find((o) => o.id === id),
    [state.orders],
  );

  const getCurrentOrder = useCallback(
    () => state.orders[state.orders.length - 1],
    [state.orders],
  );

  const getOrdersForStudent = useCallback(() => state.orders, [state.orders]);

  const updateOrderStatus = useCallback((id: string, status: Order["status"]) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  }, []);

  const value = useMemo<OrderContextValue>(
    () => ({
      orders: state.orders,
      createOrder,
      getOrder,
      getCurrentOrder,
      getOrdersForStudent,
      updateOrderStatus,
    }),
    [state.orders, createOrder, getOrder, getCurrentOrder, getOrdersForStudent, updateOrderStatus],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return ctx;
}
