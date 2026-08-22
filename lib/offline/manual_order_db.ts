"use client";

export interface OfflineManualOrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OfflineManualOrder {
  clientOrderId: string; // Idempotency UUID
  canteenId: string;
  customerName: string;
  studentIdentifier?: string;
  customerPhone?: string;
  items: OfflineManualOrderItem[];
  totalAmount: number;
  paymentMethod: "CASH";
  orderType: "MANUAL_CASH_ORDER";
  createdAt: string;
  syncStatus: "LOCAL_PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  syncError?: string;
  syncAttempts?: number;
  // A status change (e.g. Mark Ready) the vendor made before this order
  // finished syncing to the server. Applied automatically the moment sync
  // succeeds, so the action is never lost while offline.
  desiredStatus?: "placed" | "preparing" | "ready" | "picked_up" | "completed" | "cancelled" | null;
  serverOrderId?: string;
  serverOrderNumber?: string;
}

// After this many failed sync attempts against a reachable server (i.e. the
// server responded but rejected the order), stop auto-retrying so a
// permanently invalid record doesn't retry forever. It still stays visible
// to the vendor as "Sync Failed — Needs Attention" — never silently dropped.
export const MAX_SYNC_ATTEMPTS = 5;

export interface CachedMenuItem {
  id: string;
  canteenId: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

const DB_NAME = "grabit_manual_orders_db";
const DB_VERSION = 1;
const STORE_ORDERS = "manual_orders";
const STORE_MENU_CACHE = "menu_cache";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment."));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ORDERS)) {
        const orderStore = db.createObjectStore(STORE_ORDERS, { keyPath: "clientOrderId" });
        orderStore.createIndex("syncStatus", "syncStatus", { unique: false });
        orderStore.createIndex("canteenId", "canteenId", { unique: false });
        orderStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MENU_CACHE)) {
        const menuStore = db.createObjectStore(STORE_MENU_CACHE, { keyPath: "id" });
        menuStore.createIndex("canteenId", "canteenId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update a manual order in local IndexedDB offline storage.
 */
export async function saveOfflineManualOrder(order: OfflineManualOrder): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, "readwrite");
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.put(order);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB saveOfflineManualOrder error:", err);
    // Fallback to localStorage if IndexedDB fails
    if (typeof window !== "undefined") {
      try {
        const key = `grabit_offline_orders`;
        const existingStr = localStorage.getItem(key) || "[]";
        const existing: OfflineManualOrder[] = JSON.parse(existingStr);
        const idx = existing.findIndex((o) => o.clientOrderId === order.clientOrderId);
        if (idx >= 0) {
          existing[idx] = order;
        } else {
          existing.push(order);
        }
        localStorage.setItem(key, JSON.stringify(existing));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Get all pending/failed manual orders that need synchronization.
 */
export async function getPendingOfflineManualOrders(canteenId?: string): Promise<OfflineManualOrder[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, "readonly");
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.getAll();

      req.onsuccess = () => {
        let orders: OfflineManualOrder[] = req.result || [];
        if (canteenId) {
          orders = orders.filter((o) => o.canteenId === canteenId);
        }
        const pending = orders.filter(
          (o) => o.syncStatus === "LOCAL_PENDING" || o.syncStatus === "FAILED" || o.syncStatus === "SYNCING"
        );
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB getPendingOfflineManualOrders error:", err);
    if (typeof window !== "undefined") {
      try {
        const key = `grabit_offline_orders`;
        const existing: OfflineManualOrder[] = JSON.parse(localStorage.getItem(key) || "[]");
        return existing.filter(
          (o) =>
            (!canteenId || o.canteenId === canteenId) &&
            (o.syncStatus === "LOCAL_PENDING" || o.syncStatus === "FAILED" || o.syncStatus === "SYNCING")
        );
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Get all local offline manual orders for a canteen (including synced).
 */
export async function getAllOfflineManualOrders(canteenId?: string): Promise<OfflineManualOrder[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, "readonly");
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.getAll();

      req.onsuccess = () => {
        let orders: OfflineManualOrder[] = req.result || [];
        if (canteenId) {
          orders = orders.filter((o) => o.canteenId === canteenId);
        }
        orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(orders);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB getAllOfflineManualOrders error:", err);
    if (typeof window !== "undefined") {
      try {
        const key = `grabit_offline_orders`;
        const existing: OfflineManualOrder[] = JSON.parse(localStorage.getItem(key) || "[]");
        return existing.filter((o) => !canteenId || o.canteenId === canteenId);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Get a single local offline manual order by its client order id.
 */
export async function getOfflineManualOrder(
  clientOrderId: string
): Promise<OfflineManualOrder | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, "readonly");
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.get(clientOrderId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB getOfflineManualOrder error:", err);
    if (typeof window !== "undefined") {
      try {
        const existing: OfflineManualOrder[] = JSON.parse(
          localStorage.getItem("grabit_offline_orders") || "[]"
        );
        return existing.find((o) => o.clientOrderId === clientOrderId);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/**
 * Queue a status change (e.g. Mark Ready) for a manual order that hasn't
 * finished syncing to the server yet. Applied automatically once sync
 * succeeds — see syncSingleManualOrder in manual_order_sync.ts.
 */
export async function setDesiredStatus(
  clientOrderId: string,
  desiredStatus: OfflineManualOrder["desiredStatus"]
): Promise<boolean> {
  const order = await getOfflineManualOrder(clientOrderId);
  if (!order) return false;
  order.desiredStatus = desiredStatus;
  return saveOfflineManualOrder(order);
}

/**
 * Record a failed sync attempt count so the retry loop can stop trying a
 * permanently invalid record after MAX_SYNC_ATTEMPTS.
 */
export async function incrementSyncAttempts(clientOrderId: string): Promise<number> {
  const order = await getOfflineManualOrder(clientOrderId);
  if (!order) return 0;
  const attempts = (order.syncAttempts ?? 0) + 1;
  order.syncAttempts = attempts;
  await saveOfflineManualOrder(order);
  return attempts;
}

/**
 * Update sync status of a local offline manual order.
 */
export async function updateOfflineOrderStatus(
  clientOrderId: string,
  syncStatus: OfflineManualOrder["syncStatus"],
  serverData?: { serverOrderId?: string; serverOrderNumber?: string },
  syncError?: string
): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, "readwrite");
      const store = tx.objectStore(STORE_ORDERS);
      const getReq = store.get(clientOrderId);

      getReq.onsuccess = () => {
        const order: OfflineManualOrder | undefined = getReq.result;
        if (!order) return resolve(false);

        order.syncStatus = syncStatus;
        if (serverData?.serverOrderId) order.serverOrderId = serverData.serverOrderId;
        if (serverData?.serverOrderNumber) order.serverOrderNumber = serverData.serverOrderNumber;
        if (syncError) order.syncError = syncError;

        const putReq = store.put(order);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.error("IndexedDB updateOfflineOrderStatus error:", err);
    if (typeof window !== "undefined") {
      try {
        const key = `grabit_offline_orders`;
        const existing: OfflineManualOrder[] = JSON.parse(localStorage.getItem(key) || "[]");
        const idx = existing.findIndex((o) => o.clientOrderId === clientOrderId);
        if (idx >= 0) {
          existing[idx].syncStatus = syncStatus;
          if (serverData?.serverOrderId) existing[idx].serverOrderId = serverData.serverOrderId;
          if (serverData?.serverOrderNumber) existing[idx].serverOrderNumber = serverData.serverOrderNumber;
          if (syncError) existing[idx].syncError = syncError;
          localStorage.setItem(key, JSON.stringify(existing));
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Cache vendor menu items locally in IndexedDB for offline menu availability.
 */
export async function cacheVendorMenuLocally(canteenId: string, items: CachedMenuItem[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MENU_CACHE, "readwrite");
      const store = tx.objectStore(STORE_MENU_CACHE);
      items.forEach((item) => store.put({ ...item, canteenId }));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("IndexedDB cacheVendorMenuLocally error:", err);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`grabit_cached_menu_${canteenId}`, JSON.stringify(items));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Get cached vendor menu items from local IndexedDB storage.
 */
export async function getCachedVendorMenu(canteenId: string): Promise<CachedMenuItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MENU_CACHE, "readonly");
      const store = tx.objectStore(STORE_MENU_CACHE);
      const index = store.index("canteenId");
      const req = index.getAll(canteenId);

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("IndexedDB getCachedVendorMenu error:", err);
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem(`grabit_cached_menu_${canteenId}`) || "[]");
      } catch {
        return [];
      }
    }
    return [];
  }
}
