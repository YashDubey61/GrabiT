"use client";

import Link from "next/link";
import { MOCK_LANDING_DATA } from "@/lib/mock/landing";

export function LandingVendorSection() {
  const { metrics } = MOCK_LANDING_DATA;

  return (
    <section className="py-20 bg-background px-6 md:px-12 border-t border-border/40">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Vendor Dashboard Mockup */}
        <div className="order-2 lg:order-1">
          <div className="rounded-3xl border border-white/10 bg-surface-elevated p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[24px]">
                    dashboard
                  </span>
                </div>
                <div>
                  <h4 className="font-display text-body-sm font-bold text-foreground">
                    Vendor Dashboard
                  </h4>
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-faint">
                    Live Kitchen Analytics
                  </p>
                </div>
              </div>

              <div className="rounded-full bg-success/20 px-3 py-1 font-display text-[10px] font-bold text-success border border-success/30">
                SYSTEM ACTIVE
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-[10px] font-display font-bold uppercase text-faint mb-1">
                    Orders
                  </div>
                  <div className="font-display text-heading font-extrabold text-primary">
                    {metrics.dailyOrders}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-[10px] font-display font-bold uppercase text-faint mb-1">
                    Revenue
                  </div>
                  <div className="font-display text-heading font-extrabold text-primary">
                    {metrics.revenue}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface-elevated p-3 text-center">
                  <div className="text-[10px] font-display font-bold uppercase text-faint mb-1">
                    Growth
                  </div>
                  <div className="font-display text-heading font-extrabold text-primary">
                    {metrics.growth}
                  </div>
                </div>
              </div>

              {/* Bar graph visualization mockup */}
              <div className="flex h-36 items-end gap-2 rounded-xl border border-border bg-surface-elevated p-4">
                <div className="h-[40%] flex-1 rounded-t bg-primary/30" />
                <div className="h-[65%] flex-1 rounded-t bg-primary/30" />
                <div className="h-[50%] flex-1 rounded-t bg-primary/30" />
                <div className="h-[95%] flex-1 rounded-t bg-primary shadow-glow-primary" />
                <div className="h-[75%] flex-1 rounded-t bg-primary/40" />
                <div className="h-[85%] flex-1 rounded-t bg-primary/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Content */}
        <div className="order-1 lg:order-2 space-y-6">
          <h2 className="font-display text-[36px] sm:text-[48px] font-black leading-tight text-foreground">
            Scale Your <span className="text-primary">Campus Canteen</span>
          </h2>

          <p className="text-body-lg text-muted leading-relaxed">
            Ditch paper token tickets and chaotic break rush queues. GrabIt Vendor Console gives you full control over kitchen order flows, prep times, and daily payouts.
          </p>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] text-primary shrink-0">
                check_circle
              </span>
              <div>
                <p className="font-display text-body-sm font-bold text-foreground">
                  Automated Order Throttling
                </p>
                <p className="text-body-sm text-faint">
                  Prevent kitchen overload during short break rushes.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] text-primary shrink-0">
                check_circle
              </span>
              <div>
                <p className="font-display text-body-sm font-bold text-foreground">
                  Direct Daily Payouts
                </p>
                <p className="text-body-sm text-faint">
                  Access your canteen earnings with zero hidden commissions.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] text-primary shrink-0">
                check_circle
              </span>
              <div>
                <p className="font-display text-body-sm font-bold text-foreground">
                  Live Menu Toggle
                </p>
                <p className="text-body-sm text-faint">
                  Turn items out of stock instantly across all student phones.
                </p>
              </div>
            </li>
          </ul>

          <div className="pt-2">
            <Link
              href="/vendor"
              className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-8 py-4 font-display text-body font-extrabold text-black transition-all duration-150 active:scale-95 hover:bg-primary hover:text-on-primary"
            >
              Become a Partner Vendor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
