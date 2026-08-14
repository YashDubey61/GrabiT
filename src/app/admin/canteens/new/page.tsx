"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardCanteenPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    location: "",
    campus: "IIT Bombay",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    openingTime: "08:00",
    closingTime: "20:00",
  });

  const steps = [
    { num: 1, label: "Canteen Details" },
    { num: 2, label: "Vendor Info" },
    { num: 3, label: "Review & Activate" },
  ];

  return (
    <div className="px-4 pt-6 md:px-8 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-8">Onboard Canteen</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
                transition-all duration-300
                ${step >= s.num ? "bg-accent text-bg" : "bg-surface-2 text-text-muted"}
              `}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? "text-text" : "text-text-muted"}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${step > s.num ? "bg-accent" : "bg-surface-2"} transition-colors duration-300`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-5 animate-slide-up max-w-md">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Canteen Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Night Owls Café"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Hostel 10, Ground Floor"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Opening</label>
              <input type="time" value={form.openingTime} onChange={(e) => setForm({ ...form, openingTime: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-mono outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Closing</label>
              <input type="time" value={form.closingTime} onChange={(e) => setForm({ ...form, closingTime: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm font-mono outline-none focus:border-accent transition-colors" />
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!form.name || !form.location} className="w-full rounded-xl bg-accent px-6 py-3.5 text-bg font-semibold hover:bg-accent-dim active:scale-[0.98] transition-all disabled:opacity-40">
            Next →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5 animate-slide-up max-w-md">
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Vendor Name</label>
            <input type="text" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} placeholder="Full name" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Email</label>
            <input type="email" value={form.vendorEmail} onChange={(e) => setForm({ ...form, vendorEmail: e.target.value })} placeholder="vendor@example.com" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Phone</label>
            <input type="tel" value={form.vendorPhone} onChange={(e) => setForm({ ...form, vendorPhone: e.target.value })} placeholder="10-digit number" className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold hover:bg-surface-2 transition-colors">
              ← Back
            </button>
            <button onClick={() => setStep(3)} disabled={!form.vendorName || !form.vendorEmail} className="flex-1 rounded-xl bg-accent px-6 py-3.5 text-bg font-semibold hover:bg-accent-dim active:scale-[0.98] transition-all disabled:opacity-40">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="space-y-6 animate-slide-up max-w-md">
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold">Review</h3>
            {[
              ["Canteen", form.name],
              ["Location", form.location],
              ["Hours", `${form.openingTime} – ${form.closingTime}`],
              ["Vendor", form.vendorName],
              ["Email", form.vendorEmail],
              ["Phone", form.vendorPhone],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-text-secondary">{label}</span>
                <span className="text-text font-medium">{value || "—"}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold hover:bg-surface-2 transition-colors">
              ← Back
            </button>
            <button
              onClick={() => router.push("/admin/canteens")}
              className="flex-1 rounded-xl bg-success px-6 py-3.5 text-bg font-semibold hover:bg-success/80 active:scale-[0.98] transition-all"
            >
              ✓ Activate Canteen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
