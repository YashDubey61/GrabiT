"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/constants";

export default function ManualOrderPage() {
  const [items, setItems] = useState([{ name: "", qty: 1, price: "" }]);
  const [submitted, setSubmitted] = useState(false);

  const addRow = () => setItems([...items, { name: "", qty: 1, price: "" }]);

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => {
    const price = parseInt(item.price || "0") * 100;
    return sum + price * item.qty;
  }, 0);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setItems([{ name: "", qty: 1, price: "" }]);
    }, 2000);
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h1 className="text-xl font-bold tracking-tight mb-2">Manual Order</h1>
      <p className="text-sm text-text-muted mb-6">Cash order fallback entry</p>

      <div className="space-y-3 mb-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 animate-slide-up">
            <input
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors"
            />
            <input
              type="number"
              placeholder="₹"
              value={item.price}
              onChange={(e) => updateItem(i, "price", e.target.value)}
              className="w-20 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent transition-colors font-mono"
            />
            <input
              type="number"
              min="1"
              value={item.qty}
              onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)}
              className="w-14 rounded-xl border border-border bg-surface px-2 py-2.5 text-sm text-center outline-none focus:border-accent transition-colors font-mono"
            />
            {items.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-text-muted hover:text-error transition-colors">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="text-sm text-accent hover:text-accent-dim transition-colors mb-6"
      >
        + Add item
      </button>

      {total > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 mb-6 flex justify-between items-center">
          <span className="text-sm text-text-secondary">Total</span>
          <span className="font-mono font-semibold text-lg">{formatPrice(total)}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!items.some(i => i.name && i.price)}
        className={`
          w-full rounded-xl px-6 py-3.5 font-semibold text-base transition-all duration-200
          ${submitted
            ? "bg-success text-bg"
            : "bg-accent text-bg hover:bg-accent-dim active:scale-[0.98]"
          }
          disabled:opacity-40 disabled:cursor-not-allowed
        `}
      >
        {submitted ? "✓ Order Recorded" : "Record Cash Order"}
      </button>
    </div>
  );
}
