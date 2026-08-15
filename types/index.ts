/**
 * Domain types and enums — GrabIt Canteen OS.
 * Terminology and state names are taken directly from GrabIt_PRD and
 * GrabIt_TRD (TRD §4 Data Model, §5 Key Flows). No states are invented
 * beyond what the specification describes.
 *
 * Product direction: PICKUP-ONLY for this build. The TRD's data model
 * includes a `delivery_runs` table and `fulfillment_type` field for
 * in-campus delivery — that is a specification inconsistency against the
 * current pickup-only direction and is intentionally NOT modeled here.
 * See the Day 1 foundation report, "Blockers" / spec inconsistencies.
 */

export type UserRole = "student" | "vendor" | "admin";

/** Order lifecycle. TRD §5.1 Student Order Flow, §7 API surface. */
export type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "completed"
  | "cancelled";

/** TRD §7: student picks a Short Break or Lunch time slot; orders in the
 * same slot are grouped for the vendor. */
export type OrderSlot = "short_break" | "lunch";

/** TRD §4 payments table: `method` distinguishes UPI (gateway fee applies)
 * from wallet (no gateway fee). */
export type PaymentMethod = "upi" | "wallet";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type CanteenStatus = "active" | "inactive";

/** TRD §4 menu_items: real-time availability toggle drives the student-facing
 * menu instantly — binary, not a stock count (out of PRD/TRD scope for Phase 1). */
export type MenuItemAvailability = "available" | "unavailable";

/** TRD §4 wallet_transactions: full ledger entry types, including the
 * top-up bonus credit from PRD §7 (Grabit Wallet). */
export type WalletTransactionType = "topup" | "spend" | "refund" | "bonus";

/** TRD §4 group_orders: a shareable join code/link other students join
 * before checkout locks the group. */
export type GroupOrderStatus = "open" | "locked" | "completed";

export type PayoutStatus = "requested" | "processing" | "settled" | "failed";

/** PRD §8 Monetization: Grabit Gold subscription tiers. */
export type SubscriptionPlan = "gold_monthly" | "gold_semester";
export type SubscriptionStatus = "active" | "expired" | "cancelled";

// ---------------------------------------------------------------------------
// Core entity shapes — mirror TRD §4 Data Model field-for-field.
// These are hand-written now; once supabase/migrations/ is applied, replace
// with `npx supabase gen types typescript` output and keep these as the
// pre-database contract for UI work that starts before the schema is live.
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  campus_id: string | null;
  created_at: string;
}

export interface Campus {
  id: string;
  name: string;
  city: string;
}

export interface Canteen {
  id: string;
  campus_id: string;
  name: string;
  status: CanteenStatus;
  qr_code_id: string;
}

export interface MenuItem {
  id: string;
  canteen_id: string;
  name: string;
  price: number;
  availability: MenuItemAvailability;
  is_sponsored: boolean;
}

export interface Order {
  id: string;
  student_id: string;
  canteen_id: string;
  slot: OrderSlot;
  status: OrderStatus;
  order_number: string;
  total_amount: number;
  group_order_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  contributed_by_user_id: string | null;
}

export interface GroupOrder {
  id: string;
  initiator_id: string;
  canteen_id: string;
  join_code: string;
  status: GroupOrderStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  razorpay_payment_id: string | null;
  amount: number;
  platform_fee: number;
  vendor_settlement: number;
  status: PaymentStatus;
}

export interface Payout {
  id: string;
  canteen_id: string;
  amount: number;
  status: PayoutStatus;
  requested_at: string;
  settled_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  renews_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  related_order_id: string | null;
  created_at: string;
}
