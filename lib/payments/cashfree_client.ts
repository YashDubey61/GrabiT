"use client";

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

export type CashfreeCheckoutResult = { error?: { message: string } } | undefined;

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
    const res = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: "_modal",
    });
    return res;
  } catch (err) {
    return {
      error: {
        message: (err as Error)?.message || "Payment cancelled or couldn't be completed.",
      },
    };
  }
}
