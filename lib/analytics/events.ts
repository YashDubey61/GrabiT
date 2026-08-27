export type ProductEventName =
  | "student_home_viewed"
  | "menu_viewed"
  | "menu_item_viewed"
  | "cart_item_added"
  | "cart_viewed"
  | "checkout_started"
  | "checkout_submitted"
  | "order_created"
  | "payment_started"
  | "payment_succeeded"
  | "payment_failed"
  | "order_completed"
  | "gold_plan_viewed"
  | "gold_purchase_started"
  | "gold_purchase_succeeded"
  | "wallet_viewed"
  | "wallet_topup_started"
  | "recommendation_viewed"
  | "recommendation_clicked"
  | "recommendation_added_to_cart"
  | "notification_viewed"
  | "notification_clicked"
  | "notification_marked_read"
  | "operational_notification_viewed"
  | "operational_notification_clicked"
  | "operational_notification_acknowledged"
  | "operational_notification_resolved"
  | "workflow_executed"
  | "workflow_rule_toggled"
  | "workflow_manual_run"
  | "incident_created"
  | "incident_acknowledged"
  | "incident_escalated"
  | "incident_resolved";

export interface TrackProductEventPayload {
  eventName: ProductEventName;
  anonymousSessionId?: string;
  campusId?: string;
  canteenId?: string;
  menuItemId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Non-blocking, best-effort first-party product analytics event tracking helper.
 * Analytics failures will NEVER throw exceptions or block core product functionality.
 */
export async function trackProductEvent(payload: TrackProductEventPayload): Promise<void> {
  try {
    const isBrowser = typeof window !== "undefined";
    const endpoint = isBrowser
      ? "/api/analytics/events"
      : `${process.env.NEXT_PUBLIC_SITE_URL || "https://grabit.ventures"}/api/analytics/events`;

    const body = JSON.stringify({
      event_name: payload.eventName,
      anonymous_session_id: payload.anonymousSessionId,
      campus_id: payload.campusId,
      canteen_id: payload.canteenId,
      menu_item_id: payload.menuItemId,
      order_id: payload.orderId,
      metadata: payload.metadata ?? {},
    });

    if (isBrowser) {
      // Fire-and-forget fetch in browser
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // Silent failure - analytics must be non-blocking
      });
    } else {
      // Server-side call (best effort)
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => {
        // Silent failure
      });
    }
  } catch {
    // Best-effort guarantee: ignore any error during analytics tracking
  }
}
