export const DELIVERY_CHARGE_REASONS = [
  "Standard Delivery",
  "High Demand",
  "Peak Hours",
  "Long Distance",
  "Bad Weather",
  "Special Event",
  "Custom Reason",
] as const;

export type DeliveryChargeReason = (typeof DELIVERY_CHARGE_REASONS)[number];

export interface DeliveryChargeConfig {
  amount: number;
  chargeType: "fixed" | "rule_based";
  reason: DeliveryChargeReason;
  description: string;
}

export const DEFAULT_DELIVERY_CHARGE: DeliveryChargeConfig = {
  amount: 2.5,
  chargeType: "fixed",
  reason: "Standard Delivery",
  description: "Standard delivery charge",
};
