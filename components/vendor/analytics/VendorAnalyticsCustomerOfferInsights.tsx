"use client";

import type { VendorAnalyticsData } from "@/lib/supabase/vendor_analytics";

export interface VendorAnalyticsCustomerOfferInsightsProps {
  customerInsights: VendorAnalyticsData["customerInsights"];
  offerPerformance: VendorAnalyticsData["offerPerformance"];
}

export function VendorAnalyticsCustomerOfferInsights({
  customerInsights,
  offerPerformance,
}: VendorAnalyticsCustomerOfferInsightsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Customer Loyalty Insights */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Customer Loyalty & Retention
            </h3>
            <p className="text-caption text-muted">
              Aggregated student ordering habits
            </p>
          </div>
          <span className="material-symbols-outlined text-primary text-[24px]">group</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Unique Customers</span>
            <span className="font-display text-title font-extrabold text-foreground">
              {customerInsights.uniqueCustomersCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Returning Students</span>
            <span className="font-display text-title font-extrabold text-emerald-400">
              {customerInsights.returningCustomersCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Repeat Order Rate</span>
            <span className="font-display text-title font-extrabold text-primary">
              {customerInsights.repeatOrderRate.toFixed(1)}%
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Avg Orders / Student</span>
            <span className="font-display text-title font-extrabold text-blue-400">
              {customerInsights.avgOrdersPerCustomer.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Offer Performance */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-lg">
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-title font-bold text-foreground">
              Offer & Promo Analytics
            </h3>
            <p className="text-caption text-muted">
              Redemptions, savings & offer revenue
            </p>
          </div>
          <span className="material-symbols-outlined text-purple-400 text-[24px]">local_offer</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Promo Orders</span>
            <span className="font-display text-title font-extrabold text-foreground">
              {offerPerformance.ordersUsingOffersCount}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Total Discount Given</span>
            <span className="font-display text-title font-extrabold text-purple-400">
              ₹{offerPerformance.totalDiscountGiven.toFixed(2)}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Promo Order Revenue</span>
            <span className="font-display text-title font-extrabold text-emerald-400">
              ₹{offerPerformance.revenueFromOfferOrders.toFixed(2)}
            </span>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-caption text-faint block">Top Coupon Code</span>
            <span className="font-mono text-title font-extrabold text-primary">
              {offerPerformance.mostUsedOfferCode ?? "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
