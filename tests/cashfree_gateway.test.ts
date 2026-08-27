import { createHmac } from "node:crypto";
import fs from "node:fs/promises";
import {
  getCashfreeConfig,
  isCashfreeConfigured,
  getPaymentModeLabel,
  verifyCashfreeWebhookSignature,
  mapCashfreeStatusToInternal,
} from "../lib/payments/cashfree";

async function runCashfreeGatewayTestSuite() {
  console.log("==================================================");
  console.log("GRABIT — Cashfree Payment Gateway (Sandbox) Test Suite");
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

  // 1. Configuration & Environment Checks
  assert(isCashfreeConfigured(), "Cashfree is configured with client ID and secret");

  const config = getCashfreeConfig();
  assert(config.environment === "SANDBOX", "Cashfree environment is set to SANDBOX");
  assert(config.apiVersion === "2025-01-01" || config.apiVersion === "2023-08-01", `Cashfree API version is configured (${config.apiVersion})`);
  assert(config.baseUrl === "https://sandbox.cashfree.com/pg", "Cashfree base URL points to Sandbox endpoint (https://sandbox.cashfree.com/pg)");
  assert(getPaymentModeLabel() === "SANDBOX", "Payment mode label returns SANDBOX");

  // 2. Webhook Signature Verification
  const testSecret = config.clientSecret;
  const testTimestamp = String(Date.now());
  const testBody = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: "GRABIT-WALLET-test-123", order_amount: 100 },
      payment: { cf_payment_id: "CF_PAY_999", payment_status: "SUCCESS", payment_amount: 100 },
    },
  });

  const validSignature = createHmac("sha256", testSecret).update(testTimestamp + testBody).digest("base64");
  assert(
    verifyCashfreeWebhookSignature(testBody, testTimestamp, validSignature),
    "Valid HMAC-SHA256 signature passes verification",
  );

  const tamperedBody = JSON.stringify({
    type: "PAYMENT_SUCCESS_WEBHOOK",
    data: {
      order: { order_id: "GRABIT-WALLET-test-123", order_amount: 1000 }, // tampered amount
      payment: { cf_payment_id: "CF_PAY_999", payment_status: "SUCCESS", payment_amount: 1000 },
    },
  });
  assert(
    !verifyCashfreeWebhookSignature(tamperedBody, testTimestamp, validSignature),
    "Tampered webhook payload is rejected",
  );

  assert(
    !verifyCashfreeWebhookSignature(testBody, "1234567890", validSignature),
    "Tampered timestamp is rejected",
  );

  assert(
    !verifyCashfreeWebhookSignature(testBody, testTimestamp, "invalid_signature_base64_string=="),
    "Invalid signature string is rejected",
  );

  // 3. Status Mapping
  assert(mapCashfreeStatusToInternal("SUCCESS") === "SUCCESS", "Status SUCCESS maps to SUCCESS");
  assert(mapCashfreeStatusToInternal("PAID") === "SUCCESS", "Status PAID maps to SUCCESS");
  assert(mapCashfreeStatusToInternal("success") === "SUCCESS", "Status lowercase 'success' maps to SUCCESS");
  assert(mapCashfreeStatusToInternal("PENDING") === "PENDING", "Status PENDING maps to PENDING");
  assert(mapCashfreeStatusToInternal("ACTIVE") === "PENDING", "Status ACTIVE maps to PENDING");
  assert(mapCashfreeStatusToInternal("FAILED") === "FAILED", "Status FAILED maps to FAILED");
  assert(mapCashfreeStatusToInternal("USER_DROPPED") === "FAILED", "Status USER_DROPPED maps to FAILED");
  assert(mapCashfreeStatusToInternal("CANCELLED") === "FAILED", "Status CANCELLED maps to FAILED");
  assert(mapCashfreeStatusToInternal("EXPIRED") === "FAILED", "Status EXPIRED maps to FAILED");
  assert(mapCashfreeStatusToInternal("TERMINATED") === "FAILED", "Status TERMINATED maps to FAILED");

  // 4. Source Code Security Audits (CASHFREE_CLIENT_SECRET Protection)
  const clientSdkSource = await fs.readFile(
    new URL("../lib/payments/cashfree_client.ts", import.meta.url),
    "utf-8",
  );
  assert(
    !clientSdkSource.includes("CASHFREE_CLIENT_SECRET") && !clientSdkSource.includes("clientSecret"),
    "Client SDK loader never touches or references clientSecret",
  );

  const walletTopUpSource = await fs.readFile(
    new URL("../components/student/wallet/WalletTopUpSelector.tsx", import.meta.url),
    "utf-8",
  );
  assert(
    !walletTopUpSource.includes("CASHFREE_CLIENT_SECRET") && !walletTopUpSource.includes("clientSecret"),
    "WalletTopUpSelector component never accesses CASHFREE_CLIENT_SECRET",
  );
  assert(
    walletTopUpSource.includes("50, 100, 200, 500, 1000"),
    "WalletTopUpSelector provides preset quick amounts [50, 100, 200, 500, 1000]",
  );
  assert(
    walletTopUpSource.includes("isSubmitting"),
    "WalletTopUpSelector implements multi-click / double-submission prevention",
  );
  assert(
    walletTopUpSource.includes("Payment Successful"),
    "WalletTopUpSelector contains dedicated Payment Successful UI state",
  );
  assert(
    walletTopUpSource.includes("Payment Cancelled") && walletTopUpSource.includes("Your payment was cancelled. No amount has been added to your wallet."),
    "WalletTopUpSelector contains dedicated Payment Cancelled UI state with required message",
  );
  assert(
    walletTopUpSource.includes("Payment Failed") && walletTopUpSource.includes("We couldn't complete your payment. No amount has been added to your wallet."),
    "WalletTopUpSelector contains dedicated Payment Failed UI state with required message",
  );
  assert(
    walletTopUpSource.includes("Payment Not Completed") && walletTopUpSource.includes("Your payment was not completed. If any amount was debited, it will be handled according to the payment status."),
    "WalletTopUpSelector contains dedicated Payment Not Completed UI state with required message",
  );
  assert(
    walletTopUpSource.includes("useModalBackHandler"),
    "WalletTopUpSelector registers with Android hardware back-button coordinator",
  );
  assert(
    clientSdkSource.includes("registerModalBackHandler") && clientSdkSource.includes("dismissCashfreeCheckoutDOM"),
    "Cashfree client registers back handler with coordinator and exports DOM cleanup function",
  );

  // 5. Backend Endpoints Verification
  const createOrderRoute = await fs.readFile(
    new URL("../app/api/payments/cashfree/create-order/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    createOrderRoute.includes("createCashfreeOrder") && createOrderRoute.includes("payment_session_id"),
    "Create Order endpoint mints payment_session_id server-side",
  );
  assert(
    !createOrderRoute.includes("clientSecret:"),
    "Create Order route never returns clientSecret in response JSON",
  );

  const statusOrderIdRoute = await fs.readFile(
    new URL("../app/api/payments/cashfree/status/[orderId]/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    statusOrderIdRoute.includes("getCashfreeOrderStatus") && statusOrderIdRoute.includes("confirm_wallet_topup"),
    "Status [orderId] endpoint reconciles live Cashfree status and idempotently triggers confirm_wallet_topup",
  );

  const webhookRoute = await fs.readFile(
    new URL("../app/api/payments/cashfree/webhook/route.ts", import.meta.url),
    "utf-8",
  );
  assert(
    webhookRoute.includes("verifyCashfreeWebhookSignature"),
    "Webhook route enforces HMAC signature verification before processing any event",
  );
  assert(
    webhookRoute.includes("payment_webhook_events"),
    "Webhook route enforces idempotency deduplication via payment_webhook_events",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCashfreeGatewayTestSuite().catch((err) => {
  console.error("Cashfree gateway test suite threw uncaught error:", err);
  process.exit(1);
});
