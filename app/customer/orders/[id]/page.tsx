"use client";

import { use, useEffect, useState, useCallback } from "react";
import { OrderTrackerHeader } from "@/components/student/order/OrderTrackerHeader";
import { OrderLiveStatus } from "@/components/student/order/OrderLiveStatus";
import { PickupPassCard } from "@/components/student/order/PickupPassCard";
import { OrderItemsBento } from "@/components/student/order/OrderItemsBento";
import { OrderInfoTiles } from "@/components/student/order/OrderInfoTiles";
import { OrderContactActions } from "@/components/student/order/OrderContactActions";
import { DevOrderStatusControls } from "@/components/student/order/DevOrderStatusControls";
import { OrderNotFoundState } from "@/components/student/order/OrderNotFoundState";
import { useOrders } from "@/lib/orders/OrderContext";
import { getLiveOrderById } from "@/lib/supabase/orders";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/orders/types";
import { ReceiptPrinter } from "@/components/shared/receipt-printer/ReceiptPrinter";
import { studentOrderToReceipt } from "@/components/shared/receipt-printer/adapters";

export default function StudentTrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getOrder, updateOrderStatus } = useOrders();
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingPickup, setIsConfirmingPickup] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const localOrder = getOrder(id);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    const dbOrder = await getLiveOrderById(id);
    if (dbOrder) {
      setLiveOrder(dbOrder);
    } else if (localOrder) {
      setLiveOrder(localOrder);
    } else {
      setLiveOrder(null);
    }
    setIsLoading(false);
  }, [id, localOrder]);

  useEffect(() => {
    let isMounted = true;
    getLiveOrderById(id).then((dbOrder) => {
      if (isMounted) {
        if (dbOrder) {
          setLiveOrder(dbOrder);
        } else if (localOrder) {
          setLiveOrder(localOrder);
        } else {
          setLiveOrder(null);
        }
        setIsLoading(false);
      }
    });

    // Supabase Realtime Subscription for Student Order Tracking
    const supabase = createClient();
    const channel = supabase
      .channel(`student-order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          if (payload.new && (payload.new.id === id || payload.new.order_number === id)) {
            fetchOrder();
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [id, localOrder, fetchOrder]);

  const handleConfirmStudentPickup = async () => {
    if (!liveOrder) return;
    try {
      setIsConfirmingPickup(true);
      const res = await fetch(`/api/student/orders/${liveOrder.id}/pickup`, {
        method: "POST",
      });
      if (res.ok) {
        fetchOrder();
      }
    } catch {
      // Ignore
    } finally {
      setIsConfirmingPickup(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <OrderTrackerHeader />
        <main className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 px-5 pb-24 pt-32 text-center">
          <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
            progress_activity
          </span>
          <p className="font-display text-body font-semibold text-foreground">
            Loading order details from database...
          </p>
        </main>
      </>
    );
  }

  const order = liveOrder ?? localOrder;

  if (!order) {
    return <OrderNotFoundState />;
  }

  const validUntilLabel = new Date(
    new Date(order.estimatedReadyAt).getTime() + 30 * 60_000,
  ).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  const isCancelled = order.status === "cancelled";

  return (
    <>
      <OrderTrackerHeader />

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pb-24 pt-20 md:px-16 md:pt-24">
        {/* Cancellation Alert Banner */}
        {isCancelled && (
          <div className="flex flex-col gap-2 rounded-2xl border border-danger/40 bg-danger-soft/40 p-4 text-danger animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">block</span>
              <h3 className="font-display text-body font-bold">Order Cancelled by Store</h3>
            </div>
            <p className="font-body text-caption">
              The store was unable to process your order. If any amount was debited from your wallet, it will be automatically refunded.
            </p>
          </div>
        )}

        <OrderLiveStatus status={order.status} estimatedReadyAt={order.estimatedReadyAt} />

        {!isCancelled && (
          <button
            type="button"
            onClick={() => setIsReceiptOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated text-body-sm font-semibold text-foreground transition-colors hover:bg-surface"
          >
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
              receipt_long
            </span>
            Print Receipt
          </button>
        )}

        {/* Student Pickup Action Button when Order is Ready */}
        {order.status === "ready" && (
          <button
            type="button"
            onClick={handleConfirmStudentPickup}
            disabled={isConfirmingPickup}
            className="w-full rounded-2xl bg-success py-4 font-display text-body font-bold uppercase tracking-wider text-black shadow-lg shadow-success/20 transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{isConfirmingPickup ? "Confirming..." : "I've Picked Up My Order"}</span>
          </button>
        )}

        {!isCancelled && (
          <PickupPassCard
            orderNumber={order.orderNumber}
            validUntilLabel={validUntilLabel}
            pickupQrToken={order.pickupQrToken}
            pickupOtpCode={order.pickupOtpCode}
            status={order.status}
            completedAtLabel={
              order.completedAt
                ? new Date(order.completedAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : null
            }
          />
        )}

        <OrderItemsBento items={order.items} />
        <OrderInfoTiles
          canteenName={order.canteenName}
          paymentMethod={order.paymentMethod}
          totalAmount={order.totalAmount}
        />

        <OrderContactActions
          vendorName={order.canteenName}
          vendorPhone={order.vendorPhone}
          orderNumber={order.orderNumber}
        />

        <DevOrderStatusControls
          status={order.status}
          onSetStatus={(status) => {
            setLiveOrder((prev) => (prev ? { ...prev, status } : null));
            updateOrderStatus(order.id, status);
          }}
        />
      </main>

      <ReceiptPrinter
        mode="student"
        order={studentOrderToReceipt(order)}
        open={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onViewOrder={() => setIsReceiptOpen(false)}
        onDone={() => setIsReceiptOpen(false)}
      />
    </>
  );
}
