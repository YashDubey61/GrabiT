import { getMockPlatformFee } from "@/lib/cart/calculations";

// getMockPlatformFee moved to lib/cart/calculations.ts on Day 4 so order
// creation (lib/orders/OrderContext.tsx) uses the identical number this
// component displays — see that file for the "not the real PRD formula" note.
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
