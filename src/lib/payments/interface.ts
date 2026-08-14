export interface PaymentProvider {
  createOrder(amount: number, receipt: string): Promise<{ orderId: string }>;
  verifyPayment(
    paymentId: string,
    orderId: string,
    signature: string
  ): Promise<boolean>;
}
