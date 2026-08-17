import type { OrderStatus } from "@/types";
export type { OrderStatus };
import type { PickupSlot } from "@/components/student/PickupSlotSelector";
import type { PaymentMethod } from "@/components/student/PaymentMethodSelector";

/**
 * Local order domain model. Field names deliberately mirror TRD §4's
 * `orders` and `order_items` tables so this maps cleanly onto a real
 * Supabase insert later — see the field-by-field note below.
 *
 * KNOWN SPEC MISMATCH (flagged, not silently resolved): TRD §4 defines
 * `orders.slot` as the OrderSlot enum ("short_break" | "lunch"), but the
 * approved Checkout Stitch screen collects a concrete pickup time (ASAP /
 * 12:30 PM / ...) via PickupSlotSelector, not one of those two named
 * slots. This model uses `PickupSlot` (what the UI actually collects)
 * rather than `OrderSlot` (what the TRD's schema expects) — reconciling
 * the two is a product decision for a later phase, not something to
 * paper over here.
 *
 * `status` reuses types/index.ts's existing `OrderStatus` rather than a
 * duplicate enum. Day 4 only drives `placed` → `preparing` → `ready`;
 * `completed`/`cancelled` already exist on that type from Day 1 but are
 * out of scope for Track Order today (no screen renders them yet).
 */
export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  lineTotal: number;
}

export interface Order {
  /** Internal id, e.g. "order_8f31a2..." — never shown to the student. */
  id: string;
  /** Human-readable, e.g. "#41" — PRD §7.1's example format. What the UI shows. */
  orderNumber: string;
  canteenId: string;
  canteenName: string;
  /** Always null until real auth exists (TRD §8: OTP-gated, not implemented yet). */
  studentId: string | null;
  slot: PickupSlot;
  status: OrderStatus;
  /** Same "Card" mismatch as the slot note above — see PaymentMethodSelector.tsx. */
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  createdAt: string;
  /** ISO timestamp — drives Track Order's "Ready in ~N mins" while preparing. */
  estimatedReadyAt: string;
  /** Opaque per-order pickup-verification token encoded into the QR. */
  pickupQrToken?: string | null;
  /** Non-null once a vendor has scanned and consumed the pickup QR. */
  pickupQrUsedAt?: string | null;
  completedAt?: string | null;
}
