"use client";

import { useState, useEffect } from "react";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";
import { WalletBalanceCard } from "@/components/student/wallet/WalletBalanceCard";
import { WalletQuickTiles } from "@/components/student/wallet/WalletQuickTiles";
import { WalletTransactionList } from "@/components/student/wallet/WalletTransactionList";
import { WalletTopUpSelector } from "@/components/student/wallet/WalletTopUpSelector";
import { MOCK_WALLET, MOCK_TRANSACTIONS, type Wallet, type WalletTransaction } from "@/lib/mock/wallet";
import { getLiveWalletForStudent, getLiveWalletTransactions } from "@/lib/supabase/wallet";

export default function StudentWalletPage() {
  const [wallet, setWallet] = useState<Wallet>(MOCK_WALLET);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  const loadLiveWallet = async () => {
    const liveWallet = await getLiveWalletForStudent();
    const liveTxs = await getLiveWalletTransactions();
    if (liveWallet) setWallet(liveWallet);
    if (liveTxs && liveTxs.length > 0) setTransactions(liveTxs);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const liveWallet = await getLiveWalletForStudent();
      const liveTxs = await getLiveWalletTransactions();
      if (isMounted) {
        if (liveWallet) setWallet(liveWallet);
        if (liveTxs && liveTxs.length > 0) setTransactions(liveTxs);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast(null);
    }, 3000);
  };

  // Wallet balance/transactions are only ever updated by re-fetching
  // from the server after a webhook-verified top-up — never by
  // incrementing local state here.
  const handleTopUpSuccess = async () => {
    await loadLiveWallet();
    showToast("Top-up successful! Your wallet has been credited.");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <TrackEventOnMount payload={{ eventName: "wallet_viewed" }} />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px] text-primary" aria-hidden="true">
            location_on
          </span>
          <span className="font-display text-title font-extrabold tracking-tight text-primary">
            GrabIt
          </span>
        </div>
        <button
          type="button"
          onClick={() => showToast("Scan QR Code scanner ready")}
          className="rounded-full p-2 text-muted transition-transform active:scale-95 hover:text-foreground"
          aria-label="Scan QR Code"
        >
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
            qr_code_scanner
          </span>
        </button>
      </header>

      {/* Main Wallet Content */}
      <main className="mx-auto max-w-lg px-4 pt-6 pb-24">
        {/* Balance Card */}
        <WalletBalanceCard
          wallet={wallet}
          onAddMoney={() => setIsTopUpOpen(true)}
          onTransfer={() => showToast("Peer-to-peer student wallet transfer ready.")}
        />

        {/* Quick Info Tiles */}
        <WalletQuickTiles
          wallet={wallet}
          onTileClick={(tile) => {
            if (tile === "bank") {
              showToast(`Linked Bank: ${wallet.linkedBank}`);
            } else {
              showToast(`Total cashback earned: ₹${wallet.cashbackBalance.toFixed(2)}`);
            }
          }}
        />

        {/* Transactions List */}
        <WalletTransactionList
          transactions={transactions}
          onTransactionClick={(tx) => {
            showToast(`${tx.title}: ${tx.type === "credit" ? "+" : "-"} ₹${tx.amount.toFixed(2)} (${tx.subtitle})`);
          }}
        />
      </main>

      {/* Top Up Modal */}
      <WalletTopUpSelector
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onTopUpSuccess={handleTopUpSuccess}
      />

      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/30 bg-surface-elevated px-5 py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <p className="font-display text-caption font-bold text-primary">{activeToast}</p>
        </div>
      )}
    </div>
  );
}
