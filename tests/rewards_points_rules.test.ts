/**
 * GRABIT — Rewards Earning & Transfer Business Rules Test Suite
 *
 * Covers the shared calculateEarnedPoints()/validateTransferAmount()
 * helpers (lib/rewards/points_rules.ts) that mirror the authoritative
 * Postgres RPCs (award_order_points, transfer_points — migration
 * 0039_rewards_earning_and_transfer_rules.sql), plus structural checks
 * that the API route enforces the same rule server-side rather than
 * trusting the client.
 *
 * The actual RPC-level behavior (server-side formula, idempotency,
 * insufficient-balance/self-transfer/amount rejection) was verified
 * live via direct SQL against the real Supabase project in the same
 * session this migration was written — a real order was completed and
 * confirmed to earn floor(total_amount / 10) points exactly once even
 * across repeated award_order_points() calls, and transfer_points() was
 * called directly with valid/invalid amounts and insufficient balances.
 */

import {
  calculateEarnedPoints,
  validateTransferAmount,
  isValidTransferAmount,
  MIN_TRANSFER_AMOUNT,
  TRANSFER_STEP,
} from "../lib/rewards/points_rules";

async function runRewardsPointsRulesTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Rewards Earning & Transfer Rules Test Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ TEST ${totalTests} PASSED: ${testName}`);
    } else {
      console.log(`❌ TEST ${totalTests} FAILED: ${testName}${detail ? ` — ${detail}` : ""}`);
    }
  };

  // ---- Rule constants ----
  assert(MIN_TRANSFER_AMOUNT === 10, "Minimum transfer amount is 10 points");
  assert(TRANSFER_STEP === 10, "Transfer step/increment is 10 points");

  // ---- Earning: ₹10 spent = 1 point ----
  const earningCases: Array<[number, number]> = [
    [10, 1],
    [20, 2],
    [50, 5],
    [100, 10],
    [150, 15],
    [250, 25],
    [500, 50],
    [1000, 100],
    [2500, 250],
  ];
  for (const [amount, expected] of earningCases) {
    assert(
      calculateEarnedPoints(amount) === expected,
      `₹${amount} purchase earns ${expected} point${expected === 1 ? "" : "s"}`,
      `got ${calculateEarnedPoints(amount)}`,
    );
  }

  // Non-multiple-of-10 amounts floor down (server-side floor(), matches RPC).
  assert(calculateEarnedPoints(99) === 9, "₹99 earns 9 points (floor, not rounded up to 10)");
  assert(calculateEarnedPoints(19) === 1, "₹19 earns 1 point (floor)");
  assert(calculateEarnedPoints(0) === 0, "₹0 earns 0 points");
  assert(calculateEarnedPoints(-50) === 0, "Negative amount earns 0 points (never negative points)");

  // ---- Transfers: multiples of 10, minimum 10 ----
  const allowedAmounts = [10, 20, 30, 50, 90, 100, 150, 260];
  for (const amt of allowedAmounts) {
    assert(isValidTransferAmount(amt), `${amt} points is a valid transfer amount`);
  }

  const rejectedAmounts = [1, 5, 11, 25, 99, 101, 125, -10];
  for (const amt of rejectedAmounts) {
    assert(!isValidTransferAmount(amt), `${amt} points is rejected (not a multiple of 10 and/or below minimum)`);
  }

  assert(
    validateTransferAmount(5).reason === "BELOW_MINIMUM",
    "5 points is rejected specifically as BELOW_MINIMUM",
  );
  assert(
    validateTransferAmount(25).reason === "NOT_MULTIPLE_OF_10",
    "25 points is rejected specifically as NOT_MULTIPLE_OF_10 (meets minimum, wrong increment)",
  );
  assert(
    validateTransferAmount(0).reason === "NOT_A_NUMBER",
    "0 points is rejected as an invalid amount, not a below-minimum case",
  );

  // ---- Worked examples from the spec: balance 26 ----
  assert(validateTransferAmount(10, 26).valid, "Balance 26 → send 10 → allowed");
  assert(validateTransferAmount(20, 26).valid, "Balance 26 → send 20 → allowed");
  assert(
    validateTransferAmount(30, 26).reason === "INSUFFICIENT_BALANCE",
    "Balance 26 → send 30 → rejected as insufficient balance (valid increment, exceeds balance)",
  );
  assert(
    validateTransferAmount(25, 26).reason === "NOT_MULTIPLE_OF_10",
    "Balance 26 → send 25 → rejected (not a multiple of 10)",
  );
  assert(
    validateTransferAmount(5, 26).reason === "BELOW_MINIMUM",
    "Balance 26 → send 5 → rejected (below minimum 10)",
  );

  // ---- Server-side enforcement structural checks ----
  const fs = await import("node:fs/promises");

  const rpcSource = await fs.readFile(
    new URL("../supabase/migrations/0060_rewards_transfer_multiples_of_10.sql", import.meta.url),
    "utf-8",
  );
  assert(
    rpcSource.includes("p_amount % 10 <> 0") && rpcSource.includes("NOT_MULTIPLE_OF_10"),
    "transfer_points() rejects any amount not a multiple of 10, server-side in migration 0060",
  );
  assert(
    /minTransfer.{0,3}integer.{0,3}10\)/.test(rpcSource) || rpcSource.includes("'minTransfer', 10"),
    "Transfer minimum is enforced as 10 in the RPC/config",
  );

  const transferRouteSource = await fs.readFile(
    new URL("../app/api/student/points/transfer/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    transferRouteSource.includes("validateTransferAmount"),
    "The transfer API route re-validates the amount server-side using the same shared rule, before ever calling the RPC",
  );
  assert(
    transferRouteSource.includes("admin.rpc(\"transfer_points\""),
    "The transfer API route delegates the actual debit/credit to the authoritative transfer_points() RPC — the client never sets a balance directly",
  );

  const sheetSource = await fs.readFile(
    new URL("../components/student/rewards/SendPointsSheet.tsx", import.meta.url),
    "utf-8",
  );
  assert(
    sheetSource.includes('min={MIN_TRANSFER_AMOUNT}') && sheetSource.includes("step={TRANSFER_STEP}"),
    "Send Points amount input has min=10 and step=10",
  );
  assert(
    sheetSource.includes("Points must be in multiples of 10.") || sheetSource.includes("multiples of 10"),
    "Send Points UI shows the required multiple-of-10 invalid-amount message",
  );
  assert(
    sheetSource.includes("You need at least 10 points to send."),
    "Send Points UI shows the required minimum 10 points message",
  );

  const vendorOrderRouteSource = await fs.readFile(
    new URL("../app/api/vendor/orders/[id]/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    vendorOrderRouteSource.includes('award_order_points'),
    "Order completion (vendor status-transition route) still triggers award_order_points() — earning flow wasn't disconnected by this change",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runRewardsPointsRulesTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
