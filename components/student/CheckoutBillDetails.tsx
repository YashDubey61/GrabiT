/**
 * The approved Checkout export shows a flat "Platform Fee ₹5" line
 * regardless of order size. This is a display-only mock value — explicitly
 * NOT the PRD §8 platform-fee formula (free ≤₹30, flat ₹3.50 split above
 * that). Per the Day 3 brief, the real fee logic is not implemented yet;
 * this constant exists only so the approved screen's bill breakdown
 * renders correctly in the mock flow.
 */
const MOCK_PLATFORM_FEE = 5;

export function getMockPlatformFee(subtotal: number): number {
  return subtotal > 0 ? MOCK_PLATFORM_FEE : 0;
}

export function CheckoutBillDetails({ subtotal }: { subtotal: number }) {
  const fee = getMockPlatformFee(subtotal);
  const total = subtotal + fee;

  return (
    <section id="bill-details" className="scroll-mt-20 space-y-2 border-t border-border-subtle pt-6">
      <div className="flex justify-between text-caption text-muted">
        <span>Item Total</span>
        <span className="tabular-nums">₹{subtotal}</span>
      </div>
      <div className="flex justify-between text-caption text-muted">
        <span>Platform Fee</span>
        <span className="tabular-nums">₹{fee}</span>
      </div>
      <div className="flex justify-between pt-2 text-body font-700 text-foreground">
        <span>Total Amount</span>
        <span className="tabular-nums text-primary">₹{total}</span>
      </div>
    </section>
  );
}
