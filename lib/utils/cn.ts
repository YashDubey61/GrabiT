type ClassValue = string | number | null | undefined | false;

/** Minimal className joiner — no dependency pulled in for something this
 * small (Step 12: avoid unnecessary dependencies). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
