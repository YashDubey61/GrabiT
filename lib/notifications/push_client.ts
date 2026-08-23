"use client";

import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";

export interface OrderPushData {
  type?: string;
  orderId?: string;
  orderNumber?: string;
}

let listenersRegistered = false;
let lastKnownToken: string | null = null;

/**
 * There is no `android/app/google-services.json` in this build, so no
 * default FirebaseApp exists in the running process. Calling
 * `PushNotifications.register()` in that state doesn't fail gracefully —
 * it throws `IllegalStateException: Default FirebaseApp is not
 * initialized` from `FirebaseMessaging.getInstance()`, uncaught, on a
 * background Capacitor plugin thread, which kills the entire app
 * (confirmed via `adb logcat`: `FATAL EXCEPTION: CapacitorPlugins`,
 * originating in `PushNotificationsPlugin.register()`). A JS-side
 * try/catch around the call cannot save the process — the crash happens
 * natively before the JS Promise can even reject.
 *
 * Flip this to `true` only once a real `google-services.json` has been
 * added to the Android project (and `FCM_SERVER_KEY` is set server-side)
 * — until then, push must stay fully inert: no permission prompt (there
 * is nothing it would actually enable), no registration attempt.
 */
const FCM_TRANSPORT_CONFIGURED = false;

/** True only for an actual native Android/iOS shell with a working FCM
 * transport configured — never in the regular browser, and never while
 * Firebase isn't set up natively (see FCM_TRANSPORT_CONFIGURED above). */
export function isNativePushCapable(): boolean {
  return Capacitor.isNativePlatform() && FCM_TRANSPORT_CONFIGURED;
}

/**
 * Registers this device for order-status push notifications. Call this
 * lazily — after the student has a reason to expect notifications
 * (signed in, has viewed/placed an order) — never unconditionally on
 * cold app launch, per Android 13+ permission best practice.
 *
 * Registers listeners at most once per app session; safe to call this
 * function repeatedly (e.g. on every authenticated page mount).
 */
export async function initStudentPushNotifications(
  onOrderNotificationTap: (data: OrderPushData) => void,
): Promise<void> {
  if (!isNativePushCapable()) return;

  if (!listenersRegistered) {
    listenersRegistered = true;

    PushNotifications.addListener("registration", async (token: Token) => {
      lastKnownToken = token.value;
      try {
        await fetch("/api/student/notifications/device-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value, deviceType: "android" }),
        });
      } catch {
        // Non-critical — the next registration/app-resume cycle will retry.
      }
    });

    PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] FCM registration error:", err);
    });

    // Foreground: FCM does not auto-post a system-tray notification while
    // the app is in the foreground on Android, and we deliberately do not
    // spin up a second (local-notification) rendering path to fake one —
    // that would risk showing the same update twice once a real tray
    // notification also lands. Foreground delivery instead surfaces
    // through the existing in-app notification center (student_notifications),
    // which this event nudges to refresh immediately.
    PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
      window.dispatchEvent(new CustomEvent("grabit:push-received", { detail: notification }));
    });

    // Background/terminated: the OS already displayed the tray
    // notification before this fires; this only handles the tap.
    PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
      const data = action.notification?.data as OrderPushData | undefined;
      if (data?.orderId) {
        onOrderNotificationTap(data);
      }
    });
  }

  try {
    const permStatus = await PushNotifications.checkPermissions();
    let granted = permStatus.receive === "granted";

    if (permStatus.receive === "prompt" || permStatus.receive === "prompt-with-rationale") {
      const requested = await PushNotifications.requestPermissions();
      granted = requested.receive === "granted";
    }

    if (!granted) return; // Denied — never keep re-prompting on every mount.

    await PushNotifications.register();
  } catch (err) {
    console.warn("[push] Could not initialize push notifications:", err);
  }
}

/** Called on logout so a signed-out device stops receiving the next
 * signed-in student's order notifications on a shared device. Relies on
 * the token captured by the "registration" listener during this session
 * — if the app hasn't registered yet this session there is nothing to
 * unregister, and the row will simply go unused once no session can
 * read it. */
export async function unregisterStudentPushToken(): Promise<void> {
  if (!isNativePushCapable() || !lastKnownToken) return;
  try {
    await fetch("/api/student/notifications/device-token", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: lastKnownToken }),
    });
  } catch {
    // Non-critical.
  }
}
