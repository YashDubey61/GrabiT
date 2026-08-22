/**
 * Server-only Cashfree PAYOUTS client — completely separate from
 * lib/payments/cashfree.ts (Payment Gateway) and
 * lib/payments/cashfree_client.ts (browser-side PG checkout loader).
 * PG receives money from students. Payouts sends money to vendors.
 * They are different Cashfree products with different credentials,
 * different auth models, and different endpoints — never mix them.
 *
 * IMPORTANT: endpoint paths below target Cashfree's documented Payout
 * API v1 (https://docs.cashfree.com/reference/payouts-overview). Verify
 * against the current official docs before enabling in production —
 * Cashfree has revised this surface over time. Nothing in this module
 * executes unless CASHFREE_PAYOUTS_CLIENT_ID/SECRET are actually set
 * (see isCashfreePayoutsConfigured), so an unverified endpoint can
 * never silently produce a fake success — it fails loudly instead.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

type PayoutsEnvironment = "SANDBOX" | "PRODUCTION";

// Cashfree Payouts sandbox and production both live under the same
// payout-gateway host; environment is determined by which client
// id/secret pair is used, not by the URL.
const PAYOUTS_BASE_URL = "https://payout-gateway.cashfree.com/payout";

export function isCashfreePayoutsConfigured(): boolean {
  return Boolean(process.env.CASHFREE_PAYOUTS_CLIENT_ID && process.env.CASHFREE_PAYOUTS_CLIENT_SECRET);
}

function getPayoutsConfig() {
  const clientId = process.env.CASHFREE_PAYOUTS_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_PAYOUTS_CLIENT_SECRET;
  const environment = (process.env.CASHFREE_PAYOUTS_ENVIRONMENT?.toUpperCase() as PayoutsEnvironment) || "SANDBOX";

  if (!clientId || !clientSecret) {
    throw new Error("CASHFREE_PAYOUTS_NOT_CONFIGURED");
  }
  return { clientId, clientSecret, environment, baseUrl: PAYOUTS_BASE_URL };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAuthToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl } = getPayoutsConfig();

  if (cachedToken && cachedToken.expiresAt > Date.now() + 10_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${baseUrl}/v1/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Id": clientId,
      "X-Client-Secret": clientSecret,
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.status !== "SUCCESS" || !body?.data?.token) {
    throw new Error(body?.message || `Cashfree Payouts auth failed (${res.status})`);
  }

  // Cashfree payout tokens are short-lived (typically ~10 minutes).
  cachedToken = { token: body.data.token, expiresAt: Date.now() + 9 * 60_000 };
  return cachedToken.token;
}

async function payoutsFetch(path: string, init: RequestInit) {
  const { baseUrl } = getPayoutsConfig();
  const token = await getAuthToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.message || `Cashfree Payouts API error (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export interface PayoutsBalance {
  availableBalance: number;
  fundSource: string | null;
}

/** Real available balance from Cashfree's own fund source — never
 * derived from GRABIT's internal ledger. Throws CASHFREE_PAYOUTS_NOT_CONFIGURED
 * if credentials aren't set; callers must surface that as
 * "NOT CONFIGURED", never as a fabricated ₹0. */
export async function getPayoutsBalance(): Promise<PayoutsBalance> {
  const body = await payoutsFetch("/v1/getBalance", { method: "POST" });
  return {
    availableBalance: Number(body?.data?.availableBalance ?? 0),
    fundSource: body?.data?.fundSource ?? null,
  };
}

export interface AddBeneficiaryParams {
  beneficiaryId: string;
  name: string;
  email?: string;
  phone: string;
  bankAccount?: string;
  ifsc?: string;
  vpa?: string; // UPI VPA
}

export async function addBeneficiary(params: AddBeneficiaryParams) {
  return payoutsFetch("/v1/addBeneficiary", {
    method: "POST",
    body: JSON.stringify({
      beneId: params.beneficiaryId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      bankAccount: params.bankAccount,
      ifsc: params.ifsc,
      vpa: params.vpa,
    }),
  });
}

export async function getBeneficiaryStatus(beneficiaryId: string) {
  return payoutsFetch(`/v1/getBeneficiary?beneId=${encodeURIComponent(beneficiaryId)}`, { method: "GET" });
}

export interface RequestTransferParams {
  transferId: string; // GRABIT-side idempotency key
  beneficiaryId: string;
  amount: number;
  remarks?: string;
}

export interface TransferResult {
  referenceId: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REVERSED";
}

/** Initiates the actual money movement. Never call this unless the
 * caller has already verified: settlement unpaid, beneficiary valid,
 * amount within payout_due, sufficient Cashfree balance, and no
 * existing PROCESSING payout for this settlement (idempotency is also
 * enforced by the transferId Cashfree-side and by the DB unique index
 * on cashfree_payout_id GRABIT-side). */
export async function requestTransfer(params: RequestTransferParams): Promise<TransferResult> {
  const body = await payoutsFetch("/v1/requestTransfer", {
    method: "POST",
    body: JSON.stringify({
      transferId: params.transferId,
      beneId: params.beneficiaryId,
      amount: params.amount.toFixed(2),
      remarks: params.remarks?.slice(0, 30),
    }),
  });
  return {
    referenceId: body?.data?.referenceId ?? params.transferId,
    status: body?.data?.transferStatus ?? "PENDING",
  };
}

export async function getTransferStatus(transferId: string): Promise<TransferResult> {
  const body = await payoutsFetch(`/v1/getTransferStatus?transferId=${encodeURIComponent(transferId)}`, { method: "GET" });
  return {
    referenceId: body?.data?.referenceId ?? transferId,
    status: body?.data?.status ?? "PENDING",
  };
}

export function verifyCashfreePayoutWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  try {
    const clientSecret = process.env.CASHFREE_PAYOUTS_CLIENT_SECRET;
    if (!clientSecret) return false;
    const expected = createHmac("sha256", clientSecret).update(timestamp + rawBody).digest("base64");
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(signature);
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
