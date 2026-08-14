"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { formatPrice } from "@/lib/constants";
import { PriceTag } from "@/components/ui/PriceTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toast";

type GroupOrderItem = {
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
};

type GroupParticipant = {
  student_id: string;
  student_name: string;
  items: GroupOrderItem[];
};

type GroupOrder = {
  id: string;
  share_code: string;
  creator_id: string;
  canteen_id: string;
  time_slot_id: string;
  status: "open" | "locked" | "checked_out";
  participants: GroupParticipant[];
};

export default function GroupOrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const { student } = useAuth();
  const router = useRouter();

  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchGroupOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/group-orders?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setGroupOrder(data.groupOrder);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchGroupOrder();
    const interval = setInterval(fetchGroupOrder, 3000);
    return () => clearInterval(interval);
  }, [fetchGroupOrder]);

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast("Link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckoutGroup = async () => {
    if (!groupOrder || !student) return;

    // Build combined order items
    const allItems = groupOrder.participants.flatMap((p) => p.items);
    if (allItems.length === 0) {
      toast("No items added to group order yet!", "error");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student.id,
          canteen_id: groupOrder.canteen_id,
          time_slot_id: groupOrder.time_slot_id,
          payment_method: "upi",
          is_gold: student.is_gold_subscriber,
          items: allItems,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast("Group Order placed successfully!", "success");
        router.push(`/app/orders/${data.order.id}`);
      }
    } catch {
      toast("Failed to checkout group order", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="h-8 w-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!groupOrder) {
    return (
      <EmptyState
        icon="❓"
        title="Group order not found"
        description="Double check the share code or ask the creator for a new link."
        action={
          <Link
            href="/app/group/create"
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-bg"
          >
            Create New Group
          </Link>
        }
      />
    );
  }

  const grandTotal = groupOrder.participants.reduce((sum, p) => {
    return sum + p.items.reduce((iSum, item) => iSum + item.unit_price * item.quantity, 0);
  }, 0);

  return (
    <div className="flex flex-col min-h-dvh px-4 pt-6 pb-24 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Group Order</h1>
            <p className="text-xs font-mono text-text-muted">Code: #{groupOrder.share_code}</p>
          </div>
        </div>

        <button
          onClick={copyShareLink}
          className="
            flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10
            px-3.5 py-1.5 text-xs font-semibold text-accent
            hover:bg-accent/20 active:scale-95 transition-all
          "
        >
          {copied ? "✓ Copied!" : "🔗 Share Link"}
        </button>
      </header>

      {/* Canteen Browse CTA */}
      <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Add Your Items</p>
          <p className="text-xs text-text-secondary">Browse canteen menu to add to group cart</p>
        </div>
        <Link
          href={`/app/canteen/${groupOrder.canteen_id}`}
          className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-bg hover:bg-accent-dim transition-colors"
        >
          + Add Items
        </Link>
      </div>

      {/* Participants & Combined Items */}
      <div>
        <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
          Group Members ({groupOrder.participants.length})
        </h2>

        {groupOrder.participants.length === 0 ? (
          <p className="text-sm text-text-muted">No items added yet. Share the code to invite friends!</p>
        ) : (
          <div className="space-y-4">
            {groupOrder.participants.map((p, idx) => {
              const pTotal = p.items.reduce((s, item) => s + item.unit_price * item.quantity, 0);
              return (
                <div key={idx} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-accent">
                        {p.student_name.charAt(0)}
                      </span>
                      <span className="text-sm font-semibold">{p.student_name}</span>
                    </div>
                    <PriceTag paise={pTotal} size="sm" />
                  </div>

                  {p.items.length === 0 ? (
                    <p className="text-xs text-text-muted italic">No items picked yet</p>
                  ) : (
                    <div className="space-y-1 pt-1 border-t border-border/50">
                      {p.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-text-secondary">
                          <span>
                            {item.quantity}× {item.name}
                          </span>
                          <span className="font-mono">{formatPrice(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grand Total & Checkout */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-xl p-4 safe-bottom">
        <div className="mx-auto max-w-lg flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">Combined Total</span>
          <PriceTag paise={grandTotal} size="lg" />
        </div>

        <button
          onClick={handleCheckoutGroup}
          disabled={grandTotal === 0}
          className="
            w-full rounded-2xl bg-accent py-3.5
            text-bg font-semibold text-base
            hover:bg-accent-dim active:scale-[0.98]
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-[0_8px_32px_rgba(255,109,0,0.3)]
          "
        >
          Checkout Combined Order ({formatPrice(grandTotal)})
        </button>
      </div>
    </div>
  );
}
