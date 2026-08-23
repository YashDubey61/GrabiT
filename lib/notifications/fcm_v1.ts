import { createSign } from "node:crypto";

/**
 * Server-only FCM HTTP v1 client. Mints its own OAuth2 access token from a
 * service account (RS256-signed JWT bearer grant) using only Node's
 * built-in `crypto` — no external JWT/OAuth library needed for this one
 * flow. Never imported by client code; the service account key must never
 * reach the browser/WebView.
 *
 * Required env var (server-side only):
 *   FCM_SERVICE_ACCOUNT_JSON — the full service account JSON (as a
 *     single-line string) downloaded from Firebase Console → Project
 *     Settings → Service Accounts → Generate new private key. Its
 *     `project_id` field is used directly to build the send URL.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cachedToken: CachedToken | null = null;

function base64url(input: Buffer | string): string {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    return parsed as ServiceAccount;
  } catch {
    return null;
  }
}

export function isFcmV1Configured(): boolean {
  return getServiceAccount() !== null;
}

async function mintAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(account.private_key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FCM OAuth2 token request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data.access_token;
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  // Refresh a little before actual expiry to avoid a request racing an
  // expired token.
  if (cachedToken && cachedToken.expiresAtMs > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }
  const accessToken = await mintAccessToken(account);
  cachedToken = { accessToken, expiresAtMs: Date.now() + 3500 * 1000 };
  return accessToken;
}

export interface FcmV1SendParams {
  token: string;
  title: string;
  body: string;
  channelId: string;
  data: Record<string, string>;
}

export type FcmV1SendResult =
  | { ok: true }
  | { ok: false; tokenInvalid: boolean; error: string };

/** Sends a single FCM HTTP v1 message. Never throws — callers get a typed
 * result so a delivery failure to one device can never take down an
 * order-status transition. */
export async function sendFcmV1Message(params: FcmV1SendParams): Promise<FcmV1SendResult> {
  const account = getServiceAccount();
  if (!account) {
    return { ok: false, tokenInvalid: false, error: "FCM_SERVICE_ACCOUNT_JSON not configured" };
  }

  try {
    const accessToken = await getAccessToken(account);
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: params.token,
            notification: { title: params.title, body: params.body },
            data: params.data,
            android: {
              priority: "high",
              notification: { channel_id: params.channelId },
            },
          },
        }),
      },
    );

    if (res.ok) return { ok: true };

    const errorBody = (await res.json().catch(() => null)) as
      | { error?: { status?: string; message?: string } }
      | null;
    const status = errorBody?.error?.status;
    // FCM v1's equivalent of the legacy "NotRegistered"/"InvalidRegistration".
    const tokenInvalid = status === "UNREGISTERED" || status === "NOT_FOUND" || status === "INVALID_ARGUMENT";
    return { ok: false, tokenInvalid, error: errorBody?.error?.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, tokenInvalid: false, error: err instanceof Error ? err.message : String(err) };
  }
}
