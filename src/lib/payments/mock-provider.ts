import type { PaymentProvider } from "./interface";

/**
 * Mock payment provider for local development.
 * Every payment auto-succeeds after a simulated delay.
 */
export class MockPaymentProvider implements PaymentProvider {
  async createOrder(amount: number, receipt: string) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const orderId = `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[MockPayment] Created order: ${orderId} for ₹${(amount / 100).toFixed(2)} (receipt: ${receipt})`);
    return { orderId };
  }

  async verifyPayment(
    paymentId: string,
    orderId: string,
    _signature: string
  ) {
    await new Promise((r) => setTimeout(r, 400));
    console.log(`[MockPayment] Verified payment: ${paymentId} for order: ${orderId}`);
    return true; // Always succeed in dev
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
