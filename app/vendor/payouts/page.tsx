"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MOCK_VENDOR_STORE } from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import {
  getLiveVendorFinance,
  saveVendorBankAccount,
  exportVendorFinanceCsv,
  type VendorFinanceData,
} from "@/lib/supabase/vendor_payouts";
import {
  getLiveVendorCanteenId,
  getLiveVendorShopName,
} from "@/lib/supabase/vendor_context";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

import { VendorFinanceOverviewCards } from "@/components/vendor/payouts/VendorFinanceOverviewCards";
import { VendorEarningsSummary } from "@/components/vendor/payouts/VendorEarningsSummary";
import { VendorSettlementStatus } from "@/components/vendor/payouts/VendorSettlementStatus";
import { VendorPayoutHistoryTable } from "@/components/vendor/payouts/VendorPayoutHistoryTable";
import { VendorFinancialLedger } from "@/components/vendor/payouts/VendorFinancialLedger";
import { VendorPayoutAccountCard } from "@/components/vendor/payouts/VendorPayoutAccountCard";

export default function VendorPayoutsPage() {
  const sound = useOrderAlertSound();
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [timeframe, setTimeframe] = useState("7d");

  const [data, setData] = useState<VendorFinanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const canteenIdRef = useRef<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadFinanceData = useCallback(
    async (tf = timeframe) => {
      setIsError(false);
      const res = await getLiveVendorFinance(tf);
      if (res.ok && res.data) {
        setData(res.data);
      } else {
        setIsError(true);
      }
      setIsLoading(false);
    },
    [timeframe],
  );

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorShopName().then((name) => {
      if (isMounted && name) {
        setStore((prev) => ({ ...prev, name }));
      }
    });

    getLiveVendorCanteenId().then((canteenId) => {
      if (!isMounted) return;
      canteenIdRef.current = canteenId;

      loadFinanceData();

      if (!canteenId) return;

      channel = supabase
        .channel(`vendor-payouts-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "vendor_settlements", filter: `canteen_id=eq.${canteenId}` },
          () => {
            loadFinanceData();
          },
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadFinanceData]);

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    setIsLoading(true);
    loadFinanceData(newTf);
  };

  const handleSaveBankAccount = async (payload: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  }) => {
    const res = await saveVendorBankAccount(payload);
    if (res.ok) {
      showNotification("Bank payout account updated & verified successfully.");
      loadFinanceData();
    } else {
      showNotification(res.error ?? "Failed to save bank account details.");
    }
    return res;
  };

  const handleExportCsv = () => {
    if (!data) return;
    exportVendorFinanceCsv(data);
    showNotification("Financial statement CSV generated and downloaded.");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMobileNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        items={VENDOR_NAV}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMoreFeaturesSheet
        isOpen={isMoreFeaturesOpen}
        onClose={() => setIsMoreFeaturesOpen(false)}
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8 flex flex-col gap-6">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Title & Top Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
              Payouts & Finance Dashboard
            </h1>
            <p className="text-caption text-muted">
              Earnings breakdown, daily settlements, payout status & financial ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Pills */}
            <div className="flex rounded-xl bg-surface-elevated p-1 border border-border">
              {[
                { label: "Today", value: "today" },
                { label: "Yesterday", value: "yesterday" },
                { label: "7 Days", value: "7d" },
                { label: "30 Days", value: "30d" },
                { label: "This Month", value: "this_month" },
              ].map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => handleTimeframeChange(tf.value)}
                  className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold transition-all ${
                    timeframe === tf.value
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!data}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 font-display text-body-sm font-bold text-muted hover:border-primary/40 hover:text-foreground active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Statement
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Fetching financial statements & settlements from Supabase...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-12 text-center">
            <span className="material-symbols-outlined text-[40px] text-danger">error</span>
            <h3 className="font-display text-title font-bold text-foreground">
              Unable to load financial statements
            </h3>
            <p className="text-caption text-muted">
              Check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => loadFinanceData()}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-bold text-on-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Top Metrics Cards */}
            <VendorFinanceOverviewCards summary={data.summary} />

            {/* Earnings Formula & Deductions Breakdown */}
            <VendorEarningsSummary
              summary={data.summary}
              settlementSchedule={data.settlementSchedule}
            />

            {/* Bank Payout Account Details Card */}
            <VendorPayoutAccountCard
              bankAccount={data.bankAccount}
              onSaveBankAccount={handleSaveBankAccount}
            />

            {/* Daily Settlements & Payout History */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <VendorSettlementStatus settlements={data.settlements} />
              <VendorPayoutHistoryTable payouts={data.payouts} />
            </div>

            {/* Financial Transaction Ledger */}
            <VendorFinancialLedger transactions={data.transactions} />
          </>
        )}
      </main>

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
