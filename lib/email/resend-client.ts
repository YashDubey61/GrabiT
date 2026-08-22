import "server-only";
import { Resend } from "resend";

/**
 * Server-only Resend client. The `server-only` import makes any
 * accidental client-component import of this module a build-time
 * error, so RESEND_API_KEY can never end up in the browser bundle.
 */
let client: Resend | null = null;

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("RESEND_API_KEY is not configured in the server environment.");
  }
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "GRABIT <noreply@grabit.app>";
}

export function getReplyToAddress(): string {
  return process.env.RESEND_REPLY_TO || "support.grabit@gmail.com";
}
