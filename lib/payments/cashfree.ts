import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-only Cashfree Payment Gateway client. CASHFREE_CLIENT_SECRET
 * must never reach frontend/client/mobile code — everything here runs
 * in API routes, never imported by a "use client" component.
 */

type CashfreeEnvironment = "SANDBOX" | "PRODUCTION";

function getBaseUrl(env: CashfreeEnvironment): string {
  return env === "PRODUCTION" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

export function getCashfreeConfig() {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  const environment = (process.env.CASHFREE_ENVIRONMENT?.toUpperCase() as CashfreeEnvironment) || "SANDBOX";
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";

  if (!clientId || !clientSecret) {
    throw new Error("Cashfree is not configured. Set CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET.");
  }
  if (environment !== "SANDBOX" && environment !== "PRODUCTION") {
    throw new Error("CASHFREE_ENVIRONMENT must be SANDBOX or PRODUCTION.");
  }

  return { clientId, clientSecret, environment, apiVersion, baseUrl: getBaseUrl(environment) };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET);
}

interface CustomerDetails {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone: string;
}

interface CreateCashfreeOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerDetails: CustomerDetails;
  returnUrl?: string;
  orderNote?: string;
}

export interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  payment_session_id: string;
  order_status: string;
}

async function cashfreeFetch(path: string, init: RequestInit) {
  const { clientId, clientSecret, apiVersion, baseUrl } = getCashfreeConfig();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-client-id": clientId,
      "x-client-secret": clientSecret,
      "x-api-version": apiVersion,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.message || body?.error_description || `Cashfree API error (${res.status})`;
    throw new Error(message);
  }
  return body;
}

/** Creates a Cashfree order server-side. The amount here MUST already be
 * the server-trusted, fully-computed payable amount — callers must never
 * forward a client-supplied amount directly. */
export async function createCashfreeOrder(params: CreateCashfreeOrderParams): Promise<CashfreeOrderResponse> {
  const body = await cashfreeFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: Number(params.orderAmount.toFixed(2)),
      order_currency: params.orderCurrency ?? "INR",
      customer_details: {
        customer_id: params.customerDetails.customerId,
        customer_name: params.customerDetails.customerName,
        customer_email: params.customerDetails.customerEmail,
        customer_phone: params.customerDetails.customerPhone,
      },
      order_meta: params.returnUrl ? { return_url: params.returnUrl } : undefined,
      order_note: params.orderNote,
    }),
  });
  return body as CashfreeOrderResponse;
}

/** Server-side status fetch — used to reconcile an order when a webhook
 * is delayed or missed, never as a substitute for webhook verification
 * on the primary path. */
export async function getCashfreeOrderStatus(cashfreeOrderId: string) {
  return cashfreeFetch(`/orders/${encodeURIComponent(cashfreeOrderId)}`, { method: "GET" });
}

export async function getCashfreeOrderPayments(cashfreeOrderId: string) {
  return cashfreeFetch(`/orders/${encodeURIComponent(cashfreeOrderId)}/payments`, { method: "GET" });
}

/** Cashfree webhook signature: base64(HMAC_SHA256(timestamp + rawBody, client_secret)),
 * compared against the `x-webhook-signature` header. Uses a constant-time
 * comparison to avoid timing side-channels. */
export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  try {
    const { clientSecret } = getCashfreeConfig();
    const expected = createHmac("sha256", clientSecret).update(timestamp + rawBody).digest("base64");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

export function getPaymentModeLabel(): "SANDBOX" | "PRODUCTION" {
  return (process.env.CASHFREE_ENVIRONMENT?.toUpperCase() as CashfreeEnvironment) === "PRODUCTION"
    ? "PRODUCTION"
    : "SANDBOX";
}
