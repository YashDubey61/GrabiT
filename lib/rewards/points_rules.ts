/**
 * GRABIT Rewards — core business rules shared between the frontend
 * (pre-submit validation/messaging) and the API route (defense-in-depth
 * before the RPC call). The database RPCs (award_order_points,
 * transfer_points — supabase/migrations/0039_rewards_earning_and_transfer_rules.sql)
 * remain the sole authority; these helpers exist so the client never has
 * to guess the rule or duplicate it inconsistently, not to replace
 * server-side enforcement.
 */

/** Earning: ₹10 spent = 1 point. */
export const POINTS_PER_RUPEE_DIVISOR = 10;

/** Sending: points can only be transferred in multiples of this amount (minimum 10). */
export const TRANSFER_STEP = 10;
export const MIN_TRANSFER_AMOUNT = 10;

/** Mirrors award_order_points()'s `floor(total_amount / 10)` — for
 * display/preview purposes only; the database always recalculates this
 * from the authoritative order amount, never trusting a client value. */
export function calculateEarnedPoints(qualifyingAmount: number): number {
  if (!Number.isFinite(qualifyingAmount) || qualifyingAmount <= 0) return 0;
  return Math.floor(qualifyingAmount / POINTS_PER_RUPEE_DIVISOR);
}

export interface TransferValidationResult {
  valid: boolean;
  reason?: "NOT_A_NUMBER" | "BELOW_MINIMUM" | "NOT_MULTIPLE_OF_10" | "INSUFFICIENT_BALANCE";
}

/** Mirrors transfer_points()'s amount checks — amount must be a positive
 * integer, at least 10, and a multiple of 10. Optionally checks against
 * a known balance too (the RPC re-checks this itself either way). */
export function validateTransferAmount(amount: number, currentBalance?: number): TransferValidationResult {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return { valid: false, reason: "NOT_A_NUMBER" };
  }
  if (amount < MIN_TRANSFER_AMOUNT) {
    return { valid: false, reason: "BELOW_MINIMUM" };
  }
  if (amount % TRANSFER_STEP !== 0) {
    return { valid: false, reason: "NOT_MULTIPLE_OF_10" };
  }
  if (currentBalance !== undefined && amount > currentBalance) {
    return { valid: false, reason: "INSUFFICIENT_BALANCE" };
  }
  return { valid: true };
}

export function isValidTransferAmount(amount: number): boolean {
  return validateTransferAmount(amount).valid;
}

