// ── Order States ────────────────────────────────────
export const ORDER_STATES = {
  PLACED: "placed",
  PREPARING: "preparing",
  READY: "ready",
} as const;

export type OrderState = (typeof ORDER_STATES)[keyof typeof ORDER_STATES];

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  placed: "Order Placed",
  preparing: "Preparing",
  ready: "Ready for Pickup",
};

export const ORDER_STATE_SEQUENCE: OrderState[] = [
  ORDER_STATES.PLACED,
  ORDER_STATES.PREPARING,
  ORDER_STATES.READY,
];

// ── Fee Logic ───────────────────────────────────────
export const FEE_THRESHOLD = 30_00; // ₹30 in paise
export const TOTAL_PLATFORM_FEE = 3_50; // ₹3.50
export const STUDENT_FEE_SHARE = 2_50; // ₹2.50
export const VENDOR_FEE_SHARE = 1_00; // ₹1.00

// ── Time Slots ──────────────────────────────────────
export const TIME_SLOT_NAMES = {
  SHORT_BREAK: "Short Break",
  LUNCH: "Lunch Slot",
} as const;

// ── Payment Methods ─────────────────────────────────
export const PAYMENT_METHODS = {
  UPI: "upi",
  WALLET: "wallet",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

// ── Roles ───────────────────────────────────────────
export const ROLES = {
  STUDENT: "student",
  VENDOR: "vendor",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ── Wallet Bonus (default, overridden by admin config) ──
export const DEFAULT_WALLET_BONUSES = [
  { min_amount: 200_00, bonus_amount: 10_00 },
  { min_amount: 500_00, bonus_amount: 50_00 },
  { min_amount: 1000_00, bonus_amount: 100_00 },
];

// ── Currency ────────────────────────────────────────
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(paise % 100 === 0 ? 0 : 2)}`;
}

// ── Mock OTP ────────────────────────────────────────
export const MOCK_OTP = "123456";
