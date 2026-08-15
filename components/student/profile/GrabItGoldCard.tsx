"use client";

import { useState } from "react";
import type { GoldSubscription } from "@/lib/mock/student";
import type { GoldPlanId } from "@/lib/payments/razorpay";

interface GrabItGoldCardProps {
  subscription: GoldSubscription;
  isProcessing?: boolean;
  onPurchasePlan?: (planId: GoldPlanId) => void;
  onManage?: () => void;
}

export function GrabItGoldCard({
  subscription,
  isProcessing = false,
  onPurchasePlan,
  onManage,
}: GrabItGoldCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<GoldPlanId>("gold_monthly");
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const handlePurchase = (planId: GoldPlanId) => {
    if (onPurchasePlan) {
      onPurchasePlan(planId);
    }
  };

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl p-5 shadow-lg transition-all"
      style={{ background: "linear-gradient(135deg, #FF6D00 0%, #FFB692 100%)" }}
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
                onClick={() => setSelectedPlan("gold_monthly")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  selectedPlan === "gold_monthly"
                    ? "border-white bg-black/40 shadow-inner"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-display text-caption font-bold text-white">
                  Monthly Pass
                </span>
                <span className="block text-body-sm font-extrabold text-white">
                  ₹49 <span className="text-[11px] font-normal opacity-80">/ 30 days</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("gold_semester")}
                className={`rounded-xl border p-2.5 text-left transition-all ${
                  selectedPlan === "gold_semester"
                    ? "border-white bg-black/40 shadow-inner"
                    : "border-white/20 bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="block font-display text-caption font-bold text-white">
                  Semester Pass
                </span>
                <span className="block text-body-sm font-extrabold text-white">
                  ₹199 <span className="text-[11px] font-normal opacity-80">/ 120 days</span>
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-white/20 pt-3">
          <div className="font-display text-caption font-semibold text-white/90">
            {subscription.active ? (
              `Valid till: ${subscription.validUntil}`
            ) : (
              `Status: ${subscription.validUntil}`
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
                  {isProcessing ? "Processing..." : "Pay with Razorpay"}
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
              {isProcessing ? "Opening Razorpay..." : "Get GrabIt Gold"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
