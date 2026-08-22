export const DEFAULT_CANTEEN_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80";

export const DEFAULT_DISH_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

export const DEFAULT_AVATAR_IMAGE =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80";

export type ImageType = "canteen" | "dish" | "avatar";

const ACTIVE_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oygxysuubbkwmgpnyyuo.supabase.co";

/**
 * Normalizes an image reference (full URL, Supabase Storage path,
 * relative web path, or empty/null) into a browser-safe public URL.
 * Automatically rewrites any legacy/mismatched Supabase storage host
 * to align with the active Supabase project.
 */
export function resolveImageUrl(
  urlOrPath: string | null | undefined,
  type: ImageType = "canteen",
): string {
  const fallback =
    type === "canteen"
      ? DEFAULT_CANTEEN_IMAGE
      : type === "dish"
      ? DEFAULT_DISH_IMAGE
      : DEFAULT_AVATAR_IMAGE;

  if (!urlOrPath || typeof urlOrPath !== "string") {
    return fallback;
  }

  const trimmed = urlOrPath.trim();
  if (!trimmed) {
    return fallback;
  }

  const activeBase = ACTIVE_SUPABASE_URL.replace(/\/$/, "");

  // If URL contains a Supabase storage object path (/storage/v1/object/public/...)
  const supabaseStorageIndex = trimmed.indexOf("/storage/v1/object/public/");
  if (supabaseStorageIndex !== -1) {
    const storagePath = trimmed.substring(supabaseStorageIndex);
    return `${activeBase}${storagePath}`;
  }

  // Full non-Supabase URLs (Unsplash, Google, Data URIs, Blobs)
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Local site relative paths (e.g. /images/...)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Supabase Storage relative object path (e.g. "canteen-photos/xyz.jpg" or "xyz.jpg")
  let bucket = type === "canteen" ? "canteen-photos" : "dish-images";
  let objectPath = trimmed;

  if (trimmed.includes("/")) {
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length > 1 && (parts[0] === "canteen-photos" || parts[0] === "dish-images")) {
      bucket = parts[0];
      objectPath = parts.slice(1).join("/");
    } else {
      objectPath = parts.join("/");
    }
  }

  return `${activeBase}/storage/v1/object/public/${bucket}/${objectPath}`;
}
