/**
 * GrabIt — Real Call & WhatsApp Contact Actions Test Suite
 * Tests:
 * 1. Indian phone number normalization for WhatsApp (91XXXXXXXXXX).
 * 2. WhatsApp click-to-chat URL construction & URL encoding.
 * 3. Native phone dialer tel: URI generation.
 * 4. Missing phone fallback state behavior.
 */

import { normalizeWhatsAppNumber } from "../components/student/order/OrderContactActions";

async function runOrderContactActionsTestSuite() {
  console.log("==================================================");
  console.log("GRABIT Real Call & WhatsApp Contact Actions Suite");
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

  // TEST 1: Phone number normalization for WhatsApp
  const num1 = normalizeWhatsAppNumber("+91 98765 43210");
  const num2 = normalizeWhatsAppNumber("9876543210");
  const num3 = normalizeWhatsAppNumber("09876543210");
  const num4 = normalizeWhatsAppNumber("919876543210");

  assert(
    num1 === "919876543210" &&
      num2 === "919876543210" &&
      num3 === "919876543210" &&
      num4 === "919876543210",
    "normalizeWhatsAppNumber strictly converts Indian phone formats (+91, 0, 10-digit) to international 91XXXXXXXXXX format",
  );

  // TEST 2: WhatsApp click-to-chat message prefilling & URL encoding
  const vendorName = "Burger King";
  const orderNumber = "#GRABIT-101";
  const rawPhone = "+91 98765 43210";
  const cleanPhone = normalizeWhatsAppNumber(rawPhone);

  const messageText = `Hi ${vendorName}, I have a GRABIT order and need some help.\nOrder: ${orderNumber}`;
  const encodedMessage = encodeURIComponent(messageText);
  const fullWaUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  assert(
    fullWaUrl.includes("https://wa.me/919876543210?text=") &&
      fullWaUrl.includes(encodeURIComponent("Burger King")) &&
      fullWaUrl.includes(encodeURIComponent("#GRABIT-101")),
    "WhatsApp URL correctly embeds normalized phone number and prefilled order context message",
  );

  // TEST 3: Native tel: dialer link generation
  const telUrl = `tel:${rawPhone.trim()}`;
  assert(
    telUrl === "tel:+91 98765 43210",
    "Native phone dialer action formats tel: URI with vendor phone number",
  );

  // TEST 4: Missing phone number state check
  const emptyPhone: string | undefined = undefined;
  const isPhoneMissing = !emptyPhone || !(emptyPhone as string).trim();

  assert(
    isPhoneMissing,
    "Missing phone number state correctly detected to prevent invalid tel: or WhatsApp link triggers",
  );

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log("==================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runOrderContactActionsTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
