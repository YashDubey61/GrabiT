import type { VendorOrderStatus } from "@/lib/mock/vendor";

export type OrderActorRole = "student" | "vendor" | "admin" | "system";

export const ORDER_STATUS_TRANSITIONS: Record<VendorOrderStatus, VendorOrderStatus[]> = {
  placed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up", "completed"],
  picked_up: ["completed"],
  completed: [],
  cancelled: [],
};

// Per-role allowlist of transitions that role is permitted to trigger.
// (Actual actor-role transitions in production: the vendor dashboard
// drives placed->preparing/cancelled, preparing->ready/cancelled, and
// ready->picked_up / ready->completed / picked_up->completed; the student
// app self-confirms ready->picked_up. Extend here if new actors are added.)
const ROLE_ALLOWED_TRANSITIONS: Record<OrderActorRole, Set<string>> = {
  vendor: new Set([
    "placed->preparing",
    "placed->cancelled",
    "preparing->ready",
    "preparing->cancelled",
    "ready->picked_up",
    "ready->completed",
    "picked_up->completed",
  ]),
  student: new Set(["ready->picked_up"]),
  admin: new Set([]),
  system: new Set(["picked_up->completed"]),
};

export function isValidOrderStatusTransition(
  currentStatus: VendorOrderStatus,
  targetStatus: VendorOrderStatus,
): boolean {
  const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
  return allowed.includes(targetStatus);
}

export function validateOrderStatusTransition(
  currentStatus: VendorOrderStatus,
  targetStatus: VendorOrderStatus,
  actorRole: OrderActorRole,
): { ok: true } | { ok: false; error: string } {
  if (!isValidOrderStatusTransition(currentStatus, targetStatus)) {
    return {
      ok: false,
      error: `Invalid status transition from "${currentStatus}" to "${targetStatus}".`,
    };
  }

  const key = `${currentStatus}->${targetStatus}`;
  if (!ROLE_ALLOWED_TRANSITIONS[actorRole]?.has(key)) {
    return {
      ok: false,
      error: `Role "${actorRole}" is not permitted to move an order from "${currentStatus}" to "${targetStatus}".`,
    };
  }

  return { ok: true };
}
