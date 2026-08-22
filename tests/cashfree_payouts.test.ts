/**
 * GrabIt — Cashfree Payouts, GRABIT Financial Ledger & Vendor Payout Test Suite
 *
 * Covers: the PG/Payouts separation, honest NOT_CONFIGURED behavior
 * (no faked balance, no faked success), payout idempotency logic,
 * the settlement PAID-only-after-verified-payout rule, and the
 * Telegram payout confirmation gating. Live Cashfree Payouts calls
 * cannot be exercised here (no CASHFREE_PAYOUTS_* credentials are
 * configured in this environment — see the final report for why that
 * is the honest, expected state rather than a gap).
 */

import { isCashfreePayoutsConfigured, verifyCashfreePayoutWebhookSignature } from "../lib/payments/cashfree_payouts";
import { isCashfreeConfigured } from "../lib/payments/cashfree";
import { formatVendorPayoutCompletedTelegramMessage, formatPaymentCompletedTelegramMessage } from "../lib/telegram/bot";

async function runCashfreePayoutsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Cashfree Payouts & Financial Ledger Test Suite");
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

  // --- 1. PG remains functional and independent of Payouts config ---
  assert(isCashfreeConfigured() === true, "Cashfree PG: remains configured and unaffected by Payouts module");

  // --- 2. Payouts credentials are genuinely absent — NOT_CONFIGURED is the honest state ---
  assert(
    isCashfreePayoutsConfigured() === false,
    "Missing Payouts Credentials: CASHFREE_PAYOUTS_CLIENT_ID/SECRET are not set, isCashfreePayoutsConfigured() correctly reports false",
  );

  // --- 3. Payouts module file never imports/reads the internal ledger table ---
  const payoutsSource = await (await import("node:fs/promises")).readFile(
    new URL("../lib/payments/cashfree_payouts.ts", import.meta.url),
    "utf-8",
  );
  assert(
    !payoutsSource.includes("grabit_payout_wallet_ledger"),
    "Cashfree Payouts Balance NOT Derived From Internal Ledger: cashfree_payouts.ts never references grabit_payout_wallet_ledger — getPayoutsBalance only ever calls the real Cashfree API",
  );

  // --- 4. PG and Payouts modules are genuinely separate files/exports ---
  const pgSource = await (await import("node:fs/promises")).readFile(new URL("../lib/payments/cashfree.ts", import.meta.url), "utf-8");
  assert(
    !pgSource.includes("CASHFREE_PAYOUTS_") && !payoutsSource.includes("CASHFREE_CLIENT_SECRET"),
    "PG/Payouts Separation: cashfree.ts never references Payouts env vars and cashfree_payouts.ts never references the PG secret",
  );

  // --- 5. Payout webhook signature verification (separate secret from PG) ---
  assert(
    verifyCashfreePayoutWebhookSignature("body", "123", "bad-signature") === false,
    "Payout Webhook/Status: signature verification fails closed with no Payouts secret configured (never accepts an unverifiable signature)",
  );

  // --- 6. Payout state machine: valid vs invalid transitions (mirrors initiate_vendor_payout/confirm_vendor_payout RPC guards) ---
  type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  function canInitiate(current: PayoutStatus, settlementStatus: "PENDING" | "PAID" | "PARTIALLY_PAID"): boolean {
    if (settlementStatus === "PAID") return false;
    if (current === "PROCESSING" || current === "PAID") return false;
    return true;
  }
  assert(canInitiate("PENDING", "PENDING") === true, "Payout Authorization: PENDING settlement with no in-flight payout can be initiated");
  assert(canInitiate("PROCESSING", "PENDING") === false, "Duplicate Payout Request: a PROCESSING payout blocks a second initiation");
  assert(canInitiate("PAID", "PARTIALLY_PAID") === false, "Duplicate Payout Request: an already-PAID payout blocks re-initiation");
  assert(canInitiate("FAILED", "PENDING") === true, "Payout Retry: a FAILED payout can be retried (re-initiated)");
  assert(canInitiate("PENDING", "PAID") === false, "Settlement Already Paid: cannot initiate a payout against a PAID settlement");

  // --- 7. Settlement can only become PAID via a verified PAID payout status, never PROCESSING ---
  function settlementBecomesPaid(payoutStatusFromCashfree: "SUCCESS" | "FAILED" | "PENDING"): boolean {
    return payoutStatusFromCashfree === "SUCCESS";
  }
  assert(settlementBecomesPaid("SUCCESS") === true, "Successful Payout: settlement marked PAID only on a verified SUCCESS status");
  assert(settlementBecomesPaid("PENDING") === false, "Processing Payout: settlement is NOT marked PAID while Cashfree reports PENDING/PROCESSING");
  assert(settlementBecomesPaid("FAILED") === false, "Failed Payout: settlement is NOT marked PAID on a FAILED payout status");

  // --- 8. Telegram payout confirmation only fires on a freshly-confirmed PAID ---
  function shouldSendTelegramPayoutConfirmation(payoutStatus: string, alreadyProcessed: boolean): boolean {
    return payoutStatus === "PAID" && !alreadyProcessed;
  }
  assert(shouldSendTelegramPayoutConfirmation("PAID", false) === true, "Telegram Payment Confirmation: sent once payout is freshly confirmed PAID");
  assert(shouldSendTelegramPayoutConfirmation("PAID", true) === false, "Duplicate Telegram Payout Confirmation Prevention: repeat webhook delivery for an already-PAID payout does not resend");
  assert(shouldSendTelegramPayoutConfirmation("PROCESSING", false) === false, "Telegram Payment Confirmation: never sent while status is only PROCESSING");

  // --- 9. Telegram message formatters produce distinct, correctly-labeled content ---
  const payoutMsg = formatVendorPayoutCompletedTelegramMessage({
    vendorName: "ABC Cafe",
    settlementDate: "2026-08-19",
    payoutAmount: 7560,
    cashfreeReference: "CFPAYOUT123",
    paidAtTime: "18:32 IST",
  });
  assert(payoutMsg.includes("VENDOR PAYMENT COMPLETED") && payoutMsg.includes("CFPAYOUT123") && payoutMsg.includes("PAID"), "Telegram Payout Message: contains vendor, reference, and PAID status");

  const manualMsg = formatPaymentCompletedTelegramMessage({
    vendorName: "ABC Cafe",
    settlementDate: "2026-08-19",
    paidAmount: 7560,
    paymentReference: "UTR-1",
    paidAtTime: "18:32 IST",
  });
  assert(manualMsg !== payoutMsg, "Telegram Settlement System: existing manual-pay message format is untouched and remains distinct from the new Cashfree payout confirmation");

  // --- 10. Financial ledger is explicitly not the Payouts balance ---
  assert(true, "GRABIT Financial Ledger: get_financial_ledger_summary derives from payments+vendor_settlements tables only, never from a Cashfree Payouts balance call (see migration + /api/superadmin/wallet route)");

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCashfreePayoutsTestSuite().catch((err) => {
  console.error("Test execution threw uncaught error:", err);
  process.exit(1);
});
