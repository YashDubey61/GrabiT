"use client";

import { useState } from "react";
import type { GoldSubscription } from "@/lib/mock/student";
import { GOLD_PASS_PLANS, type GoldPlanId } from "@/lib/payments/gold_plans";

interface GrabItGoldCardProps {
  subscription: GoldSubscription;
  isProcessing?: boolean;
  /** Set after a failed/cancelled/timed-out payment attempt — renders a
   * "Try Again" state instead of a silent failure. Cleared on next attempt. */
  error?: string | null;
  onPurchasePlan?: (planId: GoldPlanId) => void;
  onManage?: () => void;
}

export function GrabItGoldCard({
  subscription,
  isProcessing = false,
  error = null,
  onPurchasePlan,
  onManage,
}: GrabItGoldCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<GoldPlanId>("MONTHLY");
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const handlePurchase = (planId: GoldPlanId) => {
    if (onPurchasePlan) {
      onPurchasePlan(planId);
    }
  };

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl p-5 shadow-lg transition-all"
      style={{ background: "linear-gradient(135deg, #FF7A00 0%, #FF922B 100%)" }}
    >
      {/* Decorative background star */}
      <div className="pointer-events-none absolute -right-5 -top-5 rotate-12 opacity-20">
        <span className="material-symbols-outlined text-[130px] text-white" aria-hidden="true">
          stars
        </span>
      </div>

      <div className="relative z-10 text-white">
        {/* Card Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-0.5 font-display text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm">
              {subscription.active ? "Active" : "Inactive"}
            </span>
            <h3 className="font-display text-title font-bold text-white">
              {subscription.planName}
            </h3>
          </div>

          <span className="material-symbols-outlined text-[32px] text-white" aria-hidden="true">
            workspace_premium
          </span>
        </div>

        {/* Perks Description */}
        <p className="mb-4 text-body-sm font-normal text-white/95 leading-relaxed">
          {subscription.perksSummary}
        </p>

        {/* Plan Selector if Inactive or if Plan Picker toggled */}
        {(!subscription.active || showPlanPicker) && (
          <div className="mb-4 space-y-2 border-t border-white/20 pt-3">
            <p className="font-display text-caption font-bold tracking-wide uppercase text-white/90">
              Select Subscription Pass:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlan("MONTHLY")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  selectedPlan === "MONTHLY"
                    ? "border-white bg-black/40 shadow-inner"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-display text-caption font-bold text-white">
                  {GOLD_PASS_PLANS.MONTHLY.label}
                </span>
                <span className="block text-body-sm font-extrabold text-white">
                  ₹{GOLD_PASS_PLANS.MONTHLY.amount}{" "}
                  <span className="text-[11px] font-normal opacity-80">
                    / {GOLD_PASS_PLANS.MONTHLY.durationDays} days
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("SEMESTER")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  selectedPlan === "SEMESTER"
                    ? "border-white bg-black/40 shadow-inner"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-display text-caption font-bold text-white">
                  {GOLD_PASS_PLANS.SEMESTER.label}
                </span>
                <span className="block text-body-sm font-extrabold text-white">
                  ₹{GOLD_PASS_PLANS.SEMESTER.amount}{" "}
                  <span className="text-[11px] font-normal opacity-80">
                    / {GOLD_PASS_PLANS.SEMESTER.durationDays} days
                  </span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Payment failure state — shown instead of a silent failure */}
        {error && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white bg-black/40 px-3 py-2">
            <span className="text-caption font-semibold text-white">{error}</span>
            <button
              type="button"
              onClick={() => handlePurchase(selectedPlan)}
              disabled={isProcessing}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-display text-caption font-bold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-white/20 pt-3">
          <div className="font-display text-caption font-semibold text-white/90">
            {subscription.active ? (
              `Valid till: ${subscription.validUntil}`
            ) : (
              "Status: Inactive"
            )}
          </div>

          {subscription.active ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlanPicker(!showPlanPicker)}
                type="button"
                className="rounded-lg bg-black/30 border border-white/30 px-3 py-1.5 font-display text-caption font-bold text-white transition-all hover:bg-black/50"
              >
                {showPlanPicker ? "Cancel" : "Extend Pass"}
              </button>

              {showPlanPicker ? (
                <button
                  onClick={() => handlePurchase(selectedPlan)}
                  disabled={isProcessing}
                  type="button"
                  className="rounded-lg bg-black px-4 py-1.5 font-display text-caption font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Extend Now"}
                </button>
              ) : (
                <button
                  onClick={onManage}
                  type="button"
                  className="rounded-lg bg-black px-4 py-1.5 font-display text-caption font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-md"
                >
                  Manage
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => handlePurchase(selectedPlan)}
              disabled={isProcessing}
              type="button"
              className="rounded-lg bg-black px-4 py-1.5 font-display text-caption font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50"
            >
              {isProcessing ? "Opening checkout..." : "Get GrabIt Gold"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
