"use client";

import { useState } from "react";
import Link from "next/link";

const CANTEENS = [
  { id: "ca1", name: "Café Central", location: "Main Building", isActive: true, orders: 62, lastActive: "2 min ago" },
  { id: "ca2", name: "South Side Bites", location: "Hostel 4 Basement", isActive: true, orders: 53, lastActive: "5 min ago" },
  { id: "ca3", name: "Quick Bites Corner", location: "Near Library", isActive: false, orders: 32, lastActive: "2 hours ago" },
];

export default function AdminCanteensPage() {
  const [canteens, setCanteens] = useState(CANTEENS);

  const toggleActive = (id: string) => {
    setCanteens(prev =>
      prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
    );
  };

  return (
    <div className="px-4 pt-6 md:px-8 pb-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Canteens</h1>
        <Link
          href="/admin/canteens/new"
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
        >
          + Onboard
        </Link>
      </div>

      <div className="space-y-3 stagger-children">
        {canteens.map((canteen) => (
          <div
            key={canteen.id}
            className={`
              rounded-2xl border bg-surface p-5 transition-all duration-200
              ${canteen.isActive ? "border-border" : "border-border/50 opacity-60"}
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{canteen.name}</h3>
                  <span
                    className={`h-2 w-2 rounded-full ${canteen.isActive ? "bg-success" : "bg-text-muted"}`}
                  />
                </div>
                <p className="text-sm text-text-secondary mt-0.5">{canteen.location}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-text-muted font-mono">
                    {canteen.orders} orders today
                  </span>
                  <span className="text-xs text-text-muted">
                    Last active: {canteen.lastActive}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleActive(canteen.id)}
                className={`
                  relative h-7 w-12 rounded-full transition-colors duration-300
                  ${canteen.isActive ? "bg-success" : "bg-surface-3"}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300
                    ${canteen.isActive ? "translate-x-5" : "translate-x-0.5"}
                  `}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
