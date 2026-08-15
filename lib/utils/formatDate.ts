/**
 * Formats ISO date string or Date object into GrabIt UI standard timestamp.
 * Example: "Oct 24, 2026 • 12:45 PM"
 */
export function formatOrderTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const datePart = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart} • ${timePart}`;
  } catch {
    return isoString;
  }
}
