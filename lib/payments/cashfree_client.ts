"use client";

import { registerModalBackHandler } from "@/lib/navigation/backButtonManager";
import { App } from "@capacitor/app";
import { isNativePlatform } from "@/lib/capacitor/platform";

/**
 * Browser-side Cashfree Checkout loader. Contains no secrets — it only
 * ever receives a short-lived `payment_session_id` minted server-side,
 * exactly as Cashfree's drop-in checkout architecture requires.
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cashfree?: (config: { mode: "sandbox" | "production" }) => any;
  }
}

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser environment required for Cashfree SDK."));
      return;
    }
    if (window.Cashfree) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Cashfree SDK.")));
      return;
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK."));
    document.head.appendChild(script);
  });
}

/**
 * Safely removes any lingering Cashfree modal or iframe overlay from the DOM
 * and restores body scrolling.
 */
export function dismissCashfreeCheckoutDOM() {
  if (typeof document === "undefined") return;

  try {
    // 1. Remove Cashfree specific iframes
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>("iframe"));
    iframes.forEach((iframe) => {
      try {
        const src = iframe.src || "";
        const name = iframe.name || "";
        const id = iframe.id || "";
        if (
          src.includes("cashfree.com") ||
          name.includes("cashfree") ||
          id.includes("cashfree") ||
          id.includes("cf-") ||
          name.startsWith("ey") // Base64 encoded Cashfree iframe parent metadata
        ) {
          // If the direct parent is a Cashfree-created backdrop/overlay (z-index 2147483647 or cf- class), remove it
          const parent = iframe.parentElement;
          if (
            parent &&
            parent !== document.body &&
            parent !== document.documentElement &&
            !parent.hasAttribute("data-nextjs-scroll-focus-boundary") &&
            !parent.classList.contains("z-[100]") &&
            (parent.style.zIndex === "2147483647" ||
              parent.id?.includes("cf-") ||
              parent.className?.includes("cf-") ||
              parent.className?.includes("cashfree"))
          ) {
            parent.remove();
          } else {
            iframe.remove();
          }
        }
      } catch {}
    });

    // 2. Remove Cashfree backdrop/overlay elements by specific Cashfree selectors
    const cfOverlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        'div[id^="cf-"], div[class*="cf-modal"], div[class*="cf-backdrop"], div[class*="cashfree-modal"], div[id*="cashfree"]'
      )
    );
    cfOverlays.forEach((el) => {
      try {
        if (el !== document.body && el !== document.documentElement) {
          el.remove();
        }
      } catch {}
    });

    // 3. If there is a direct body child with the maximum z-index 2147483647 created by Cashfree
    const bodyChildren = Array.from(document.body.children) as HTMLElement[];
    bodyChildren.forEach((el) => {
      try {
        if (
          el &&
          el.style &&
          el.style.zIndex === "2147483647" &&
          el.tagName !== "SCRIPT" &&
          el.id !== "__next" &&
          !el.querySelector("#__next")
        ) {
          el.remove();
        }
      } catch {}
    });

    // 4. Restore body and html scroll
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.documentElement.style.overflow = "";
  } catch (err) {
    console.warn("[CashfreeClient] Cleanup error:", err);
  }
}

export interface CashfreeCheckoutResult {
  error?: { message: string; code?: string; type?: string };
  userCancelled?: boolean;
  paymentDetails?: { paymentMessage?: string; paymentStatus?: string };
  redirect?: boolean;
}

export async function openCashfreeCheckout(
  paymentSessionId: string,
  mode: "sandbox" | "production",
): Promise<CashfreeCheckoutResult> {
  if (!paymentSessionId || typeof paymentSessionId !== "string" || !paymentSessionId.trim()) {
    return { error: { message: "Payment couldn't be started (invalid session)." } };
  }

  try {
    await loadScript();
    if (!window.Cashfree) {
      return { error: { message: "Cashfree payment gateway unavailable." } };
    }

    const cashfree = window.Cashfree({ mode });

    return await new Promise<CashfreeCheckoutResult>((resolve) => {
      let isSettled = false;

      const finish = (result: CashfreeCheckoutResult) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        dismissCashfreeCheckoutDOM();
        resolve(result);
      };

      // 1. Android hardware back button handler registered on global modal stack
      const unregisterBack = registerModalBackHandler("cashfree-checkout-modal", () => {
        console.log("[CashfreeClient] Android Back pressed during Cashfree checkout");
        finish({
          userCancelled: true,
          error: {
            code: "user_aborted",
            message: "Payment cancelled by user.",
          },
        });
      });

      // 2. Window postMessage listener for Cashfree iframe events
      const handleWindowMessage = (event: MessageEvent) => {
        try {
          const rawData = event.data;
          if (!rawData) return;

          let data: any = rawData;
          if (typeof rawData === "string" && (rawData.startsWith("{") || rawData.startsWith("["))) {
            try {
              data = JSON.parse(rawData);
            } catch {}
          }

          // Check for abort / cancellation / drop messages
          if (
            data.closePopup ||
            data.userAborted ||
            data.eventType === "user_aborted" ||
            data.type === "USER_ABORTED" ||
            data.event_type === "cancel" ||
            data.event_type === "close" ||
            data.action === "close"
          ) {
            console.log("[CashfreeClient] Received Cashfree close / abort event");
            finish({
              userCancelled: true,
              error: {
                code: "user_aborted",
                message: "Payment cancelled.",
              },
            });
            return;
          }

          // Check for payment status events
          if (data.paymentStatus || data.eventType === "payment_status" || data.event_type === "payment_status") {
            console.log("[CashfreeClient] Received payment status event:", data.paymentStatus);
            finish({
              paymentDetails: {
                paymentStatus: data.paymentStatus || data.event_data?.paymentStatus,
                paymentMessage: data.paymentMessage || "Payment status updated",
              },
            });
            return;
          }
        } catch {}
      };

      window.addEventListener("message", handleWindowMessage);

      // 3. App resume listener: if user switched to UPI app and resumes
      let appStateHandle: any = null;
      if (isNativePlatform()) {
        try {
          appStateHandle = App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) {
              console.log("[CashfreeClient] App resumed from background");
              // Brief delay to allow iframe/SDK to process before checking
              setTimeout(() => {
                const hasIframe = !!document.querySelector('iframe[name*="cashfree"], iframe[src*="cashfree"]');
                if (!hasIframe && !isSettled) {
                  finish({
                    paymentDetails: { paymentMessage: "App resumed." },
                  });
                }
              }, 1000);
            }
          });
        } catch {}
      }

      const cleanup = () => {
        unregisterBack();
        window.removeEventListener("message", handleWindowMessage);
        if (appStateHandle) {
          appStateHandle.then?.((h: any) => h.remove?.()).catch?.(() => {});
        }
      };

      // 4. Launch Cashfree checkout
      cashfree
        .checkout({
          paymentSessionId,
          redirectTarget: "_modal",
        })
        .then((res: any) => {
          console.log("[CashfreeClient] checkout() promise resolved with:", res);
          if (res?.error) {
            const isUserAbort =
              res.error.code === "user_aborted" ||
              res.error.type === "user_aborted" ||
              res.error.message?.toLowerCase()?.includes("abort") ||
              res.error.message?.toLowerCase()?.includes("cancel");

            finish({
              error: res.error,
              userCancelled: isUserAbort,
            });
          } else {
            finish(res || {});
          }
        })
        .catch((err: any) => {
          console.warn("[CashfreeClient] checkout() promise error:", err);
          finish({
            error: {
              message: (err as Error)?.message || "Payment cancelled or couldn't be completed.",
            },
          });
        });
    });
  } catch (err) {
    dismissCashfreeCheckoutDOM();
    return {
      error: {
        message: (err as Error)?.message || "Payment cancelled or couldn't be completed.",
      },
    };
  }
}

