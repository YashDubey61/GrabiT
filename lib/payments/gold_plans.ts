/**
 * GRABIT Gold Pass pricing — single source of truth for both the client
 * (labels only) and every server route/RPC (authoritative amount).
 * The client sends only `planId`; the server always re-derives the price
 * from here, never trusting a client-supplied amount.
 */
export type GoldPlanId = "MONTHLY" | "SEMESTER";

export interface GoldPlanDetails {
  id: GoldPlanId;
  label: string;
  amount: number;
  durationDays: number;
}

export const GOLD_PASS_PLANS: Record<GoldPlanId, GoldPlanDetails> = {
  MONTHLY: { id: "MONTHLY", label: "Monthly Pass", amount: 49, durationDays: 30 },
  SEMESTER: { id: "SEMESTER", label: "Semester Pass", amount: 199, durationDays: 120 },
};

export function isGoldPlanId(value: unknown): value is GoldPlanId {
  return value === "MONTHLY" || value === "SEMESTER";
}
