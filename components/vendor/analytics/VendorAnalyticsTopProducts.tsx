"use client";

import Image from "next/image";
import { useState } from "react";
import type { TopProductAnalytics } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsTopProductsProps {
  topProducts: TopProductAnalytics[];
  bestPerformers: TopProductAnalytics[];
  slowMovers: TopProductAnalytics[];
}

export function VendorAnalyticsTopProducts({
  topProducts,
  bestPerformers,
  slowMovers,
}: VendorAnalyticsTopProductsProps) {
  const [tab, setTab] = useState<"top" | "best" | "slow">("top");
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const list = tab === "top" ? topProducts : tab === "best" ? bestPerformers : slowMovers;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="font-display text-title font-bold text-foreground">
            Product Performance
          </h3>
          <p className="text-caption text-muted">
            Units sold, revenue contributions and demand analytics
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex rounded-xl bg-background p-1 border border-border">
          <button
            type="button"
            onClick={() => setTab("top")}
            className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
              tab === "top"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Top 10
          </button>
          <button
            type="button"
            onClick={() => setTab("best")}
            className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
              tab === "best"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Best Performers
          </button>
          <button
            type="button"
            onClick={() => setTab("slow")}
            className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
              tab === "slow"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Slow Movers
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-caption text-muted">
          No product sales recorded in this date range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm">
            <thead className="border-b border-border/60 font-display text-caption font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">% Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.map((p, idx) => (
                <tr key={p.id} className="transition-colors hover:bg-background/40">
                  {/* Rank & Image & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-extrabold text-muted text-caption w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
                        {!imgErrorMap[p.id] ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            onError={() =>
                              setImgErrorMap((prev) => ({ ...prev, [p.id]: true }))
                            }
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">
                              fastfood
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-foreground">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-faint">₹{p.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="rounded-md bg-background px-2.5 py-1 font-display text-caption font-bold text-muted border border-border">
                      {p.category}
                    </span>
                  </td>

                  {/* Units Sold */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                    {p.unitsSold}
                  </td>

                  {/* Revenue */}
                  <td className="py-3 px-3 text-right font-display font-bold text-emerald-400">
                    ₹{p.revenue.toFixed(2)}
                  </td>

                  {/* Share */}
                  <td className="py-3 px-3 text-right font-mono text-caption text-primary font-bold">
                    {p.percentageOfTotal.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
