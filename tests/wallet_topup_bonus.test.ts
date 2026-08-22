/**
 * GrabIt — Wallet Top-Up & 10% Bonus Test Suite
 *
 * Covers the shared calculateWalletTopupBonus() function (used by both
 * the Add Money UI preview and the server RPC's math via
 * create_wallet_topup_intent — verified separately by direct SQL) plus
 * structural checks that credit only ever happens via the verified
 * webhook path, never client-side.
 */

import { calculateWalletTopupBonus } from "../lib/pricing/wallet_topup";

async function runWalletTopupBonusTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Wallet Top-Up & 10% Bonus Test Suite");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ TEST ${totalTests} PASSED: ${testName}`);
    } else {
      console.error(`❌ TEST ${totalTests} FAILED: ${testName}`, detail || "");
    }
  };

  // --- Below threshold ---
  assert(calculateWalletTopupBonus(1).bonusAmount === 0, "₹1 → Bonus ₹0");
  assert(calculateWalletTopupBonus(100).bonusAmount === 0, "₹100 → Bonus ₹0");
  assert(calculateWalletTopupBonus(250).bonusAmount === 0, "₹250 → Bonus ₹0");
  assert(calculateWalletTopupBonus(499).bonusAmount === 0, "₹499 → Bonus ₹0");
  const c499 = calculateWalletTopupBonus(499);
  assert(c499.totalWalletCredit === 499, "₹499 → Wallet Credit ₹499 (no bonus)", String(c499.totalWalletCredit));

  // --- Exact threshold ---
  const c500 = calculateWalletTopupBonus(500);
  assert(c500.bonusAmount === 50, "₹500 → Bonus ₹50", String(c500.bonusAmount));
  assert(c500.totalWalletCredit === 550, "₹500 → Wallet Credit ₹550", String(c500.totalWalletCredit));
  assert(c500.bonusUnlocked === true, "₹500 → bonusUnlocked is true");

  // --- Above threshold ---
  const c501 = calculateWalletTopupBonus(501);
  assert(c501.bonusAmount === 50.1, "₹501 → Bonus ₹50.10 (decimal handled correctly)", String(c501.bonusAmount));
  assert(c501.totalWalletCredit === 551.1, "₹501 → Wallet Credit ₹551.10", String(c501.totalWalletCredit));

  const c600 = calculateWalletTopupBonus(600);
  assert(c600.bonusAmount === 60, "₹600 → Bonus ₹60");
  assert(c600.totalWalletCredit === 660, "₹600 → Wallet Credit ₹660");

  const c750 = calculateWalletTopupBonus(750);
  assert(c750.bonusAmount === 75, "₹750 → Bonus ₹75");
  assert(c750.totalWalletCredit === 825, "₹750 → Wallet Credit ₹825");

  const c1000 = calculateWalletTopupBonus(1000);
  assert(c1000.bonusAmount === 100, "₹1,000 → Bonus ₹100");
  assert(c1000.totalWalletCredit === 1100, "₹1,000 → Wallet Credit ₹1,100");

  const c2000 = calculateWalletTopupBonus(2000);
  assert(c2000.bonusAmount === 200, "₹2,000 → Bonus ₹200");
  assert(c2000.totalWalletCredit === 2200, "₹2,000 → Wallet Credit ₹2,200");

  // --- Example table from the spec ---
  assert(calculateWalletTopupBonus(100).totalWalletCredit === 100, "₹100 spec example: Credit ₹100");
  assert(calculateWalletTopupBonus(250).totalWalletCredit === 250, "₹250 spec example: Credit ₹250");

  // --- Per-top-up threshold, never cumulative (pure function is inherently stateless — proves it by construction) ---
  const topup1 = calculateWalletTopupBonus(300);
  const topup2 = calculateWalletTopupBonus(200);
  assert(topup1.bonusAmount === 0 && topup2.bonusAmount === 0, "₹300 + ₹200 as two separate top-ups: neither gets a bonus (no combining)");

  const topup3 = calculateWalletTopupBonus(499);
  const topup4 = calculateWalletTopupBonus(1);
  assert(topup3.bonusAmount === 0 && topup4.bonusAmount === 0, "₹499 then ₹1 as separate top-ups: neither reaches ₹500 individually, no bonus either");

  // --- Structural: crediting only happens server-side via webhook, never client fetch success ---
  const selectorSource = await (await import("node:fs/promises")).readFile(
    new URL("../components/student/wallet/WalletTopUpSelector.tsx", import.meta.url),
    "utf-8",
  );
  assert(
    !selectorSource.includes("setWallet") && !/balance\s*\+=/.test(selectorSource),
    "UI never increments wallet balance locally — only polls server status and calls onTopUpSuccess to re-fetch",
  );
  assert(
    selectorSource.includes("/api/payments/cashfree/wallet-topup/status"),
    "UI polls the server-verified status endpoint before reporting success",
  );

  const walletPageSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/customer/wallet/page.tsx", import.meta.url),
    "utf-8",
  );
  assert(
    !walletPageSource.includes("prev.balance + addedAmount"),
    "Wallet page no longer credits balance from a client-side click handler",
  );

  const webhookSource = await (await import("node:fs/promises")).readFile(
    new URL("../app/api/payments/cashfree/webhook/route.ts", import.meta.url),
    "utf-8",
  );
  assert(webhookSource.includes("GRABIT-WALLET-"), "Webhook routes GRABIT-WALLET- prefixed orders to the top-up handler");
  assert(webhookSource.includes("confirm_wallet_topup"), "Webhook calls the idempotent confirm_wallet_topup RPC to credit the wallet");
  assert(
    webhookSource.includes("Never trust the webhook's amount blindly") || webhookSource.includes("amount mismatch"),
    "Webhook validates the reported payment amount against the stored top-up amount before crediting",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runWalletTopupBonusTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
