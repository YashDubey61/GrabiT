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
  assert(MIN_TRANSFER_AMOUNT === 100, "Minimum transfer amount is 100 points");
  assert(TRANSFER_STEP === 100, "Transfer step/increment is 100 points");

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

  // ---- Transfers: multiples of 100, minimum 100 ----
  const allowedAmounts = [100, 200, 500, 1000];
  for (const amt of allowedAmounts) {
    assert(isValidTransferAmount(amt), `${amt} points is a valid transfer amount`);
  }

  const rejectedAmounts = [1, 50, 99, 101, 150, 250, 375, 999];
  for (const amt of rejectedAmounts) {
    assert(!isValidTransferAmount(amt), `${amt} points is rejected (not a multiple of 100 and/or below minimum)`);
  }

  assert(
    validateTransferAmount(50).reason === "BELOW_MINIMUM",
    "50 points is rejected specifically as BELOW_MINIMUM",
  );
  assert(
    validateTransferAmount(250).reason === "NOT_MULTIPLE_OF_100",
    "250 points is rejected specifically as NOT_MULTIPLE_OF_100 (meets minimum, wrong increment)",
  );
  assert(
    validateTransferAmount(0).reason === "NOT_A_NUMBER",
    "0 points is rejected as an invalid amount, not a below-minimum case",
  );

  // ---- Worked examples from the spec: balance 376 ----
  assert(validateTransferAmount(100, 376).valid, "Balance 376 → send 100 → allowed");
  assert(validateTransferAmount(200, 376).valid, "Balance 376 → send 200 → allowed");
  assert(validateTransferAmount(300, 376).valid, "Balance 376 → send 300 → allowed");
  assert(!validateTransferAmount(376, 376).valid, "Balance 376 → send 376 → rejected (not a multiple of 100)");
  assert(!validateTransferAmount(250, 376).valid, "Balance 376 → send 250 → rejected (not a multiple of 100)");
  assert(!validateTransferAmount(50, 376).valid, "Balance 376 → send 50 → rejected (below minimum)");
  assert(
    validateTransferAmount(400, 376).reason === "INSUFFICIENT_BALANCE",
    "Balance 376 → send 400 → rejected as insufficient balance (valid increment, just too much)",
  );
  assert(
    validateTransferAmount(100, 99).reason === "INSUFFICIENT_BALANCE",
    "Balance 99 → send 100 → rejected as insufficient balance",
  );
  assert(validateTransferAmount(100, 100).valid, "Balance 100 → send 100 → allowed (exact balance)");
  assert(validateTransferAmount(200, 200).valid, "Balance 200 → send 200 → allowed (exact balance)");

  // ---- Server-side enforcement structural checks ----
  const fs = await import("node:fs/promises");

  const rpcSource = await fs.readFile(
    new URL("../supabase/migrations/0039_rewards_earning_and_transfer_rules.sql", import.meta.url),
    "utf-8",
  );
  assert(
    rpcSource.includes("v_points := floor(v_order.total_amount / 10)"),
    "award_order_points() computes points server-side from the order's authoritative total_amount (÷10), not a client-supplied value",
  );
  assert(
    rpcSource.includes("p_amount % 100 <> 0") && rpcSource.includes("NOT_MULTIPLE_OF_100"),
    "transfer_points() rejects any amount not a multiple of 100, server-side",
  );
  assert(
    /minTransfer.{0,3}integer.{0,3}100\)/.test(rpcSource) || rpcSource.includes("'minTransfer', 100"),
    "Transfer minimum is enforced as 100 in the RPC/config, not left at the old default of 10",
  );
  assert(
    rpcSource.includes("idx_point_tx_earn_per_order"),
    "A hard unique index prevents a second EARN transaction for the same order (defense-in-depth beyond the idempotency_key check)",
  );
  assert(
    rpcSource.includes("related_order_id = p_order_id and type = 'EARN'"),
    "award_order_points() pre-checks for an existing EARN transaction before awarding — same qualifying order cannot earn points twice",
  );
  assert(
    rpcSource.includes("if v_order.status <> 'completed' then") && rpcSource.includes("raise exception 'ORDER_NOT_COMPLETED'"),
    "Points are only awarded for orders in 'completed' status — cancelled/failed/pending orders are never eligible",
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
    "Send Points amount input has min=100 and step=100",
  );
  assert(
    sheetSource.includes("Points can only be sent in multiples of 100."),
    "Send Points UI shows the required invalid-amount message",
  );
  assert(
    sheetSource.includes("You need at least 100 points to send."),
    "Send Points UI shows the required insufficient-points message",
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
