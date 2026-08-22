export type SupportCategoryId =
  | "ORDERS"
  | "PAYMENTS"
  | "REFUNDS"
  | "GOLD"
  | "REWARDS"
  | "ACCOUNT"
  | "VENDOR"
  | "TECHNICAL";

export interface SupportCategory {
  id: SupportCategoryId;
  label: string;
  icon: string; // Material Symbols glyph
}

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  { id: "ORDERS", label: "Orders", icon: "receipt_long" },
  { id: "PAYMENTS", label: "Payments", icon: "credit_card" },
  { id: "REFUNDS", label: "Refunds", icon: "currency_rupee" },
  { id: "GOLD", label: "GRABIT Gold", icon: "workspace_premium" },
  { id: "REWARDS", label: "Rewards", icon: "redeem" },
  { id: "ACCOUNT", label: "Account & Profile", icon: "person" },
  { id: "VENDOR", label: "Canteen / Vendor", icon: "storefront" },
  { id: "TECHNICAL", label: "Technical Issues", icon: "bug_report" },
];

export function isSupportCategoryId(value: unknown): value is SupportCategoryId {
  return SUPPORT_CATEGORIES.some((c) => c.id === value);
}
