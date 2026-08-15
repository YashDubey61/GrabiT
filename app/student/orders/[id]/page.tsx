"use client";

import { use, useEffect, useState } from "react";
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
import type { Order } from "@/lib/orders/types";

export default function StudentTrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getOrder, updateOrderStatus } = useOrders();
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const localOrder = getOrder(id);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      setIsLoading(true);
      const dbOrder = await getLiveOrderById(id);
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
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id, localOrder]);

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

  return (
    <>
      <OrderTrackerHeader />

      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 pb-24 pt-20 md:px-16 md:pt-24">
        <OrderLiveStatus status={order.status} estimatedReadyAt={order.estimatedReadyAt} />

        <PickupPassCard orderNumber={order.orderNumber} validUntilLabel={validUntilLabel} />

        <OrderItemsBento items={order.items} />
        <OrderInfoTiles
          canteenName={order.canteenName}
          paymentMethod={order.paymentMethod}
          totalAmount={order.totalAmount}
        />

        <OrderContactActions />

        <DevOrderStatusControls
          status={order.status}
          onSetStatus={(status) => {
            setLiveOrder((prev) => (prev ? { ...prev, status } : null));
            updateOrderStatus(order.id, status);
          }}
        />
      </main>
    </>
  );
}
