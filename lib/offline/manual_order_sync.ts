"use client";

import {
  getPendingOfflineManualOrders,
  getOfflineManualOrder,
  updateOfflineOrderStatus,
  incrementSyncAttempts,
  MAX_SYNC_ATTEMPTS,
} from "./manual_order_db";

let isSyncing = false;

export type SingleSyncResult =
  | { ok: true; serverOrderId: string; serverOrderNumber?: string }
  | { ok: false; reason: "offline" | "rejected" | "not_found"; error?: string };

/**
 * Sync one local offline manual order to the server. Idempotent — safe to
 * call repeatedly for the same clientOrderId; the server's client_order_id
 * uniqueness check prevents duplicate order creation on retry.
 *
 * If the order has a desiredStatus queued (e.g. the vendor tapped "Mark
 * Ready" before this order finished syncing), that status is applied to the
 * newly-created server order immediately after creation succeeds — the
 * action is never silently lost.
 */
export async function syncSingleManualOrder(
  clientOrderId: string,
  canteenId?: string
): Promise<SingleSyncResult> {
  const order = await getOfflineManualOrder(clientOrderId);
  if (!order) {
    return { ok: false, reason: "not_found", error: "Local order record not found." };
  }

  if (order.syncStatus === "SYNCED" && order.serverOrderId) {
    return { ok: true, serverOrderId: order.serverOrderId, serverOrderNumber: order.serverOrderNumber };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, reason: "offline" };
  }

  await updateOfflineOrderStatus(clientOrderId, "SYNCING");

  try {
    const response = await fetch("/api/vendor/orders/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientOrderId: order.clientOrderId,
        canteenId: canteenId || order.canteenId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        studentIdentifier: order.studentIdentifier,
        items: order.items,
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,
        createdAt: order.createdAt,
      }),
    });

    const data = await response.json();

    if (response.ok && data.ok && data.order?.id) {
      await updateOfflineOrderStatus(clientOrderId, "SYNCED", {
        serverOrderId: data.order.id,
        serverOrderNumber: data.order.orderNumber,
      });

      if (order.desiredStatus) {
        try {
          await fetch(`/api/vendor/orders/${data.order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: order.desiredStatus }),
          });
        } catch (err) {
          console.error(`Failed to apply queued status change for ${clientOrderId}:`, err);
        }
      }

      return { ok: true, serverOrderId: data.order.id, serverOrderNumber: data.order.orderNumber };
    }

    // Server was reachable and responded — this is a genuine rejection
    // (validation/schema/auth error), not a connectivity problem.
    const errMsg = data.error || "Server rejected this order.";
    await incrementSyncAttempts(clientOrderId);
    await updateOfflineOrderStatus(clientOrderId, "FAILED", undefined, errMsg);
    return { ok: false, reason: "rejected", error: errMsg };
  } catch (err) {
    console.error(`Failed to sync manual order ${clientOrderId}:`, err);
    await updateOfflineOrderStatus(
      clientOrderId,
      "FAILED",
      undefined,
      "Network unavailable during sync attempt."
    );
    return { ok: false, reason: "offline" };
  }
}

/**
 * Synchronize all pending local offline manual cash orders to server.
 * Records that have been rejected by a reachable server MAX_SYNC_ATTEMPTS
 * times are skipped here (they'd just fail again) but remain visible to the
 * vendor as "Sync Failed — Needs Attention" via getPendingOfflineManualOrders.
 */
export async function syncPendingManualCashOrders(
  canteenId?: string
): Promise<{ total: number; synced: number; failed: number }> {
  if (isSyncing) {
    return { total: 0, synced: 0, failed: 0 };
  }

  isSyncing = true;

  try {
    const pendingOrders = await getPendingOfflineManualOrders(canteenId);
    const syncable = pendingOrders.filter(
      (o) => o.syncStatus !== "FAILED" || (o.syncAttempts ?? 0) < MAX_SYNC_ATTEMPTS
    );

    if (syncable.length === 0) {
      isSyncing = false;
      return { total: 0, synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const order of syncable) {
      const result = await syncSingleManualOrder(order.clientOrderId, canteenId);
      if (result.ok) {
        synced++;
      } else {
        failed++;
      }
    }

    isSyncing = false;
    return { total: syncable.length, synced, failed };
  } catch (error) {
    console.error("syncPendingManualCashOrders error:", error);
    isSyncing = false;
    return { total: 0, synced: 0, failed: 0 };
  }
}

/**
 * Initialize automatic sync listener for browser online event and periodic heartbeat.
 */
export function initAutomaticManualOrderSync(canteenId?: string): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    syncPendingManualCashOrders(canteenId);
  };

  window.addEventListener("online", handleOnline);

  // Periodic heartbeat sync every 20 seconds
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncPendingManualCashOrders(canteenId);
    }
  }, 20000);

  // Immediate sync attempt on initialization
  if (navigator.onLine) {
    syncPendingManualCashOrders(canteenId);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    clearInterval(interval);
  };
}
