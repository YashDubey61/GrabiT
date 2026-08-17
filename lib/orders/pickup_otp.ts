/** Length of the manual pickup-verification OTP — single source of truth
 * shared by generation (order creation), display (customer + vendor UI),
 * and validation (verify/complete API). */
export const PICKUP_OTP_LENGTH = 4;

const OTP_PATTERN = new RegExp(`^\\d{${PICKUP_OTP_LENGTH}}$`);

/** Normalizes raw vendor input into a valid OTP string, or null if the
 * value isn't exactly PICKUP_OTP_LENGTH digits. */
export function normalizePickupOtp(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return OTP_PATTERN.test(trimmed) ? trimmed : null;
}
