"use client";

// PRD §8 Monetization lists UPI and GrabIt Wallet as the two real payment
// paths. The approved Checkout Stitch export also renders a third "Card"
// option — kept here for visual fidelity to the locked design (removing
// it would be redesigning an approved screen), flagged as a product/design
// mismatch worth resolving before real payment integration lands.
export type PaymentMethod = "wallet" | "upi" | "card";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  icon: string;
  detail?: string;
}[] = [
  { id: "wallet", label: "GrabIt Wallet", icon: "account_balance_wallet", detail: "Balance: ₹450" },
  { id: "upi", label: "UPI", icon: "account_balance" },
  { id: "card", label: "Card", icon: "credit_card" },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
}: {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-label font-700 uppercase tracking-[0.08em] text-muted">
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
          payments
        </span>
        Payment Method
      </h2>
      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center justify-between rounded-xl border-2 bg-surface-elevated/80 p-4 backdrop-blur-md transition-all ${
                isSelected ? "border-primary" : "border-transparent hover:bg-surface-elevated"
              }`}
            >
              <span className="flex items-center gap-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSelected ? "bg-primary/20" : "bg-surface"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${isSelected ? "text-primary" : "text-muted"}`}
                    style={isSelected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>
                </span>
                <span className="text-left">
                  <span className="block text-body font-700 text-foreground">
                    {option.label}
                  </span>
                  {option.detail && (
                    <span className="block text-caption text-primary">{option.detail}</span>
                  )}
                </span>
              </span>
              <span
                className={`material-symbols-outlined ${isSelected ? "text-primary" : "text-muted/40"}`}
                aria-hidden="true"
              >
                {isSelected ? "check_circle" : "radio_button_unchecked"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
