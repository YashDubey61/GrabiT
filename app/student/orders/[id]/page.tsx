"use client";

import { use } from "react";
import { OrderTrackerHeader } from "@/components/student/order/OrderTrackerHeader";
import { OrderLiveStatus } from "@/components/student/order/OrderLiveStatus";
import { PickupPassCard } from "@/components/student/order/PickupPassCard";
import { OrderItemsBento } from "@/components/student/order/OrderItemsBento";
import { OrderInfoTiles } from "@/components/student/order/OrderInfoTiles";
import { OrderContactActions } from "@/components/student/order/OrderContactActions";
import { DevOrderStatusControls } from "@/components/student/order/DevOrderStatusControls";
import { OrderNotFoundState } from "@/components/student/order/OrderNotFoundState";
import { useOrders } from "@/lib/orders/OrderContext";

// Client Component — converted from
// stitch_grabit_campus_canteen_os/grabit_track_order_premium_black/code.html.
// `params` is a Promise even in this client page (Next.js App Router
// convention) — unwrapped with React's `use()`, matching the pattern the
// Day 1 stub used with `await` in its Server Component version.
export default function StudentTrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getOrder, updateOrderStatus } = useOrders();
  const order = getOrder(id);

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
          onSetStatus={(status) => updateOrderStatus(order.id, status)}
        />
      </main>
    </>
  );
}
