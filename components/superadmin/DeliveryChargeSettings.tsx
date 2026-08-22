"use client";

import { useEffect, useState } from "react";
import { DELIVERY_CHARGE_REASONS, type DeliveryChargeConfig } from "@/lib/orders/delivery_charge";

export function DeliveryChargeSettings() {
  const [config, setConfig] = useState<DeliveryChargeConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/superadmin/settings/delivery-charge")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setConfig(d.config);
      });
  }, []);

  if (!config) {
    return (
      <div className="rounded-2xl border border-border bg-surface-elevated p-6 text-body-sm text-muted">
        Loading delivery charge settings...
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/superadmin/settings/delivery-charge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Unable to save changes.");
        return;
      }
      setMessage("Saved.");
      setTimeout(() => setMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-6">
      <h3 className="font-display text-title font-bold text-foreground">Delivery Charges</h3>
      <p className="mb-4 text-body-sm text-faint">
        Current charge applied to every order at checkout.
      </p>

      <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
        <span className="font-display text-caption font-bold uppercase tracking-wider text-primary">
          Current Charge
        </span>
        <p className="font-display text-heading font-extrabold text-foreground">
          ₹{config.amount.toFixed(2)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Charge Type
          </label>
          <div className="flex gap-4">
            {(["fixed", "rule_based"] as const).map((type) => (
              <label key={type} className="flex items-center gap-2 text-body-sm text-foreground">
                <input
                  type="radio"
                  checked={config.chargeType === type}
                  onChange={() => setConfig({ ...config, chargeType: type })}
                  className="accent-primary"
                />
                {type === "fixed" ? "Fixed" : "Rule Based"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Amount (₹)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={config.amount}
            onChange={(e) => setConfig({ ...config, amount: Number(e.target.value) })}
            className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Reason
          </label>
          <select
            value={config.reason}
            onChange={(e) => setConfig({ ...config, reason: e.target.value as DeliveryChargeConfig["reason"] })}
            className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            {DELIVERY_CHARGE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Description
          </label>
          <textarea
            rows={2}
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="w-full resize-none rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {message && <p className="text-caption font-semibold text-primary">{message}</p>}

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="rounded-xl bg-primary py-3 font-display text-body-sm font-extrabold uppercase tracking-wider text-on-primary disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
