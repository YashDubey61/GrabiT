/**
 * Automated Verification Test Suite — Order Cancellation Refund & Ledger Integrity
 * Run with: npx tsx tests/order_cancellation_refund.test.ts
 */

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { processOrderCancellationRefund } from "@/lib/payments/refund_service";
import { validateOrderStatusTransition } from "@/lib/orders/status_transitions";

async function runOrderCancellationRefundTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Order Cancellation Refund Test Suite");
  console.log("==================================================\n");

  const admin = getSupabaseAdminClient();
  const testStudentId = "9c89a4ee-5f6c-4fc4-a9a7-dd8da59052fa";
  const testCanteenId = "b1000000-0000-0000-0000-000000000001";

  let passed = 0;
  let total = 0;

  const assert = (condition: any, title: string, detail?: any) => {
    total++;
    if (condition) {
      console.log(`✅ TEST ${total} PASSED: ${title}`);
      passed++;
    } else {
      console.error(`❌ TEST ${total} FAILED: ${title}`, detail || "");
    }
  };

  // Helper: Setup test wallet with initial balance
  async function setStudentWalletBalance(balance: number) {
    const { data: wallet } = await admin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", testStudentId)
      .maybeSingle();

    if (!wallet) {
      await admin.from("wallets").insert({ user_id: testStudentId, balance });
    } else {
      await admin.from("wallets").update({ balance }).eq("id", wallet.id);
    }
  }

  async function getStudentWalletBalance(): Promise<number> {
    const { data: wallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", testStudentId)
      .single();
    return Number(wallet?.balance ?? 0);
  }

  // --- SCENARIO 1: Standard Wallet-Paid Order Cancellation & Refund ---
  console.log("--- SCENARIO 1: Wallet-Paid Order Cancellation & Refund ---");
  const initialBalance = 65.0;
  await setStudentWalletBalance(initialBalance);

  const orderAmount = 20.0;
  const orderNumber = `#TESTREF-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create order
  const { data: order1 } = await admin
    .from("orders")
    .insert({
      student_id: testStudentId,
      canteen_id: testCanteenId,
      order_number: orderNumber,
      status: "placed",
      total_amount: orderAmount,
      slot: "lunch",
    })
    .select()
    .single();

  // Simulate wallet debit
  const postDebitBalance = initialBalance - orderAmount; // 45.00
  await admin
    .from("wallets")
    .update({ balance: postDebitBalance })
    .eq("user_id", testStudentId);

  const { data: walletRow } = await admin.from("wallets").select("id").eq("user_id", testStudentId).single();
  assert(walletRow, "Wallet row exists");

  // Insert payment record & debit transaction
  await admin.from("payments").insert({
    order_id: order1.id,
    method: "wallet",
    amount: orderAmount,
    status: "success",
    platform_fee: 0,
    vendor_settlement: orderAmount,
  });

  await admin.from("wallet_transactions").insert({
    wallet_id: walletRow?.id,
    type: "spend",
    amount: orderAmount,
    related_order_id: order1.id,
  });

  const currentBalanceBeforeCancel = await getStudentWalletBalance();
  assert(currentBalanceBeforeCancel === 45.0, "Wallet balance is ₹45.00 after payment debit");

  // Vendor cancels the order
  await admin
    .from("orders")
    .update({ status: "cancelled", cancellation_reason: "Item out of stock" })
    .eq("id", order1.id);

  // Process refund
  const refundResult1 = await processOrderCancellationRefund({
    orderId: order1.id,
    reason: "Item out of stock",
  });

  assert(refundResult1.success && refundResult1.refunded, "processOrderCancellationRefund succeeded and issued refund");
  assert(refundResult1.amount === 20.0, "Refund amount is exactly ₹20.00");

  const finalBalanceAfterRefund = await getStudentWalletBalance();
  assert(finalBalanceAfterRefund === 65.0, "Wallet balance restored to ₹65.00 (+₹20.00 refund)", { finalBalanceAfterRefund });

  // Verify payment status in DB
  const { data: payment1 } = await admin.from("payments").select("status").eq("order_id", order1.id).single();
  assert(payment1 && payment1.status === "refunded", "Payment record status updated to 'refunded'");

  // Verify ledger transactions
  const { data: txs1 } = await admin
    .from("wallet_transactions")
    .select("type, amount")
    .eq("related_order_id", order1.id);

  assert(txs1 && txs1.length === 2, "Exactly 2 transactions exist for order (1 spend, 1 refund)");
  assert(txs1?.some((t: any) => t.type === "spend" && Number(t.amount) === 20), "Original spend transaction (-₹20) remains intact");
  assert(txs1?.some((t: any) => t.type === "refund" && Number(t.amount) === 20), "Refund credit transaction (+₹20) is recorded");

  // --- SCENARIO 2: Idempotency Protection (Duplicate Cancellation Requests) ---
  console.log("\n--- SCENARIO 2: Idempotency Protection ---");
  const refundResult2 = await processOrderCancellationRefund({
    orderId: order1.id,
    reason: "Duplicate cancellation call",
  });

  assert(Boolean(refundResult2.success && !refundResult2.refunded && refundResult2.alreadyRefunded), "Duplicate call detected alreadyRefunded=true and did NOT refund again");
  const balanceAfterDuplicateCall = await getStudentWalletBalance();
  assert(balanceAfterDuplicateCall === 65.0, "Wallet balance remained strictly ₹65.00 (NO duplicate refund)", { balanceAfterDuplicateCall });

  const { data: txsAfterDuplicate } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("related_order_id", order1.id)
    .eq("type", "refund");

  assert(txsAfterDuplicate && txsAfterDuplicate.length === 1, "Ledger strictly contains only 1 refund transaction");

  // --- SCENARIO 3: Order Cancelled Before Payment ---
  console.log("\n--- SCENARIO 3: Order Cancelled Before Payment ---");
  const { data: unpaidOrder } = await admin
    .from("orders")
    .insert({
      student_id: testStudentId,
      canteen_id: testCanteenId,
      order_number: `#TESTUNPAID-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "placed",
      total_amount: 30,
      slot: "lunch",
    })
    .select()
    .single();

  await admin.from("payments").insert({
    order_id: unpaidOrder.id,
    method: "wallet",
    amount: 30,
    status: "pending",
  });

  const unpaidRefundResult = await processOrderCancellationRefund({
    orderId: unpaidOrder.id,
    reason: "Cancelled before payment",
  });

  assert(unpaidRefundResult.success && !unpaidRefundResult.refunded, "No refund issued for unpaid pending order");
  const balanceAfterUnpaidCancel = await getStudentWalletBalance();
  assert(balanceAfterUnpaidCancel === 65.0, "Wallet balance unchanged when cancelling unpaid order");

  // --- SCENARIO 4: Status Transition Safety Guard ---
  console.log("\n--- SCENARIO 4: Transition Validator Rejection for Completed Orders ---");
  const completedTransition = validateOrderStatusTransition("completed", "cancelled", "vendor");
  assert(!completedTransition.ok, "Status transition validator correctly rejects cancelling an already completed order");

  // Clean up test records
  await admin.from("wallet_transactions").delete().eq("related_order_id", order1.id);
  await admin.from("payments").delete().eq("order_id", order1.id);
  await admin.from("orders").delete().eq("id", order1.id);
  await admin.from("payments").delete().eq("order_id", unpaidOrder.id);
  await admin.from("orders").delete().eq("id", unpaidOrder.id);

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${total - passed} FAILED`);
  console.log("==================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runOrderCancellationRefundTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
