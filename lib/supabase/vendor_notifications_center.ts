import type { OperationalNotificationItem } from "@/lib/notifications/operational_notifications";

export type NotificationCategory =
  | "ALL"
  | "ORDERS"
  | "INVENTORY"
  | "PAYMENTS"
  | "PAYOUTS"
  | "REVIEWS"
  | "OFFERS"
  | "SYSTEM";

export interface VendorNotificationPreferences {
  orderAlerts: boolean;
  inventoryAlerts: boolean;
  payoutAlerts: boolean;
  reviewAlerts: boolean;
  systemAnnouncements: boolean;
}

export function getCategoryForType(type: string): NotificationCategory {
  if (
    type.includes("ORDER") ||
    type.includes("PENDING_HANDOVER") ||
    type.includes("BACKLOG")
  ) {
    return "ORDERS";
  }
  if (type.includes("STOCK") || type.includes("MENU_AVAILABILITY")) {
    return "INVENTORY";
  }
  if (type.includes("PAYMENT")) {
    return "PAYMENTS";
  }
  if (type.includes("PAYOUT") || type.includes("SETTLED")) {
    return "PAYOUTS";
  }
  if (type.includes("REVIEW") || type.includes("RATING")) {
    return "REVIEWS";
  }
  if (type.includes("OFFER")) {
    return "OFFERS";
  }
  return "SYSTEM";
}

export function getDeepLinkForNotification(item: OperationalNotificationItem): string {
  if (item.actionUrl) return item.actionUrl;

  const category = getCategoryForType(item.type);
  switch (category) {
    case "ORDERS":
      return "/vendor/orders";
    case "INVENTORY":
      return "/vendor/inventory";
    case "PAYOUTS":
    case "PAYMENTS":
      return "/vendor/payouts";
    case "REVIEWS":
      return "/vendor/reviews";
    case "OFFERS":
      return "/vendor/offers";
    default:
      return "/vendor";
  }
}

export function getIconForNotification(item: OperationalNotificationItem): string {
  const category = getCategoryForType(item.type);
  switch (category) {
    case "ORDERS":
      return "soup_kitchen";
    case "INVENTORY":
      return "inventory_2";
    case "PAYMENTS":
      return "payments";
    case "PAYOUTS":
      return "account_balance_wallet";
    case "REVIEWS":
      return "star";
    case "OFFERS":
      return "local_offer";
    default:
      return item.severity === "CRITICAL"
        ? "warning"
        : item.severity === "WARNING"
          ? "error_outline"
          : "campaign";
  }
}

export async function fetchVendorNotificationsApi(): Promise<{
  ok: boolean;
  notifications: OperationalNotificationItem[];
  unreadCount: number;
  error?: string;
}> {
  try {
    const res = await fetch("/api/vendor/notifications", {
      headers: { "Cache-Control": "no-cache" },
    });
    const result = await res.json();
    if (!res.ok) {
      return { ok: false, notifications: [], unreadCount: 0, error: result.error };
    }
    return {
      ok: true,
      notifications: result.notifications ?? [],
      unreadCount: result.openCount ?? 0,
    };
  } catch (err) {
    console.error("Fetch vendor notifications error:", err);
    return { ok: false, notifications: [], unreadCount: 0, error: "Network error loading notifications." };
  }
}

export async function markNotificationReadApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/vendor/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ACKNOWLEDGE" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markNotificationUnreadApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/vendor/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "UNACKNOWLEDGE" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllNotificationsReadApi(): Promise<boolean> {
  try {
    const res = await fetch("/api/vendor/notifications/read-all", {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}
