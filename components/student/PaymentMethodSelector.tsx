"use client";

// GRABIT checkout has exactly two payment options: pay from the
// GrabIt Wallet, or "Pay Online" via Cashfree — which itself offers
// UPI, cards, netbanking, etc. inside the Cashfree checkout. UPI is
// deliberately NOT a separate selectable GRABIT payment method.
export type PaymentMethod = "wallet" | "card";

export function PaymentMethodSelector({
  selected,
  onSelect,
  walletBalance,
}: {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  /** Real balance fetched server-side by the caller; undefined while loading. */
  walletBalance: number | undefined;
}) {
  const walletDetail =
    walletBalance === undefined ? "Loading balance…" : `Balance: ₹${walletBalance.toFixed(2)}`;

  const PAYMENT_OPTIONS: {
    id: PaymentMethod;
    label: string;
    icon: string;
    detail?: string;
  }[] = [
    { id: "wallet", label: "GrabIt Wallet", icon: "account_balance_wallet", detail: walletDetail },
    { id: "card", label: "Pay Online", icon: "credit_card", detail: "Cards, UPI & more via Cashfree" },
  ];

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
