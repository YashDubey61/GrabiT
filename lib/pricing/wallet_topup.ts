/**
 * Single authoritative wallet top-up bonus calculation. Client-safe
 * (pure math) so the Add Money preview shows exactly what the server
 * will credit — the frontend is never trusted to determine the bonus.
 *
 * Rule: 10% bonus when topupAmount >= ₹500, else no bonus. The
 * threshold applies per individual top-up, never cumulative.
 */

const BONUS_THRESHOLD = 500;
const BONUS_RATE = 0.1;

export interface WalletTopupPreview {
  topupAmount: number;
  bonusAmount: number;
  totalWalletCredit: number;
  bonusUnlocked: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateWalletTopupBonus(topupAmount: number): WalletTopupPreview {
  const amount = Math.max(0, round2(topupAmount));
  const bonusUnlocked = amount >= BONUS_THRESHOLD;
  const bonusAmount = bonusUnlocked ? round2(amount * BONUS_RATE) : 0;
  const totalWalletCredit = round2(amount + bonusAmount);

  return { topupAmount: amount, bonusAmount, totalWalletCredit, bonusUnlocked };
}
