/**
 * Pickup-QR payload contract, shared by the student QR renderer and the
 * vendor scanner.
 *
 * The QR carries ONLY an opaque random token — never the student's
 * name, phone, email, address, payment details, or any internal id.
 * Everything the vendor sees after a scan is re-derived server-side
 * from this token plus the vendor's own authenticated session.
 */

export const PICKUP_QR_PREFIX = "GRABIT:ORDER_VERIFICATION:";

/** Encoded into the QR image shown to the student. */
export function buildPickupQrPayload(token: string): string {
  return `${PICKUP_QR_PREFIX}${token}`;
}

/**
 * Extracts the token from a scanned QR payload.
 * Returns null for anything that isn't a GRABIT pickup QR, so the
 * scanner can show "Invalid GRABIT QR code" instead of sending junk
 * to the server.
 */
export function parsePickupQrPayload(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith(PICKUP_QR_PREFIX)) return null;

  const token = trimmed.slice(PICKUP_QR_PREFIX.length).trim();
  // Tokens are 64 lowercase hex chars (32 random bytes, see migration 0028).
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return token;
}
