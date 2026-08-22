import type { Order } from "@/lib/orders/types";
import type { VendorOrder } from "@/lib/mock/vendor";
import type { ReceiptOrder } from "./types";

/** Student `Order` (lib/orders/types.ts) -> normalized ReceiptOrder. */
export function studentOrderToReceipt(order: Order): ReceiptOrder {
  return {
    id: order.orderNumber,
    vendorName: order.canteenName,
    orderType: "PICKUP",
    status: order.status.toUpperCase(),
    createdAt: new Date(order.createdAt),
    paymentMethod: order.paymentMethod,
    items: order.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      price: it.price,
    })),
    subtotal: order.subtotal,
    tax: order.platformFee,
    total: order.totalAmount,
  };
}

/** Vendor `VendorOrder` (lib/mock/vendor.ts) -> normalized ReceiptOrder.
 * Never carries payment gateway/card/UPI reference details — only what's
 * needed to prepare and identify the order. */
export function vendorOrderToReceipt(order: VendorOrder, vendorName: string): ReceiptOrder {
  return {
    id: order.orderNumber,
    vendorName,
    orderType: "PICKUP",
    status: order.status.toUpperCase(),
    createdAt: new Date(order.createdAtIso),
    customerName: order.studentName,
    items: order.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      specialInstructions: it.notes,
    })),
    subtotal: order.totalAmount,
    total: order.totalAmount,
  };
}
