import { reverseGeocodeGoogle, getGoogleDistanceMatrix } from "@/lib/utils/google_maps";

export interface CampusLocationItem {
  id: string;
  name: string;
  shortName?: string;
  city: string;
  address?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  status?: string;
}

export type DetectionConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface CampusDetectionResult {
  detectedCampus: CampusLocationItem | null;
  distanceMeters: number | null;
  confidence: DetectionConfidence;
  requiresConfirmation: boolean;
  allNearby: { campus: CampusLocationItem; distanceMeters: number }[];
}

/**
 * Calculates Haversine distance in meters between two GPS coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Match student GPS coordinates against registered campus geofences.
 */
export function findNearbyCampus(
  studentLat: number,
  studentLon: number,
  campuses: CampusLocationItem[],
): {
  detectedCampus: CampusLocationItem | null;
  distanceMeters: number | null;
  allNearby: { campus: CampusLocationItem; distanceMeters: number }[];
} {
  const matches: { campus: CampusLocationItem; distanceMeters: number }[] = [];

  for (const cmp of campuses) {
    if (cmp.latitude == null || cmp.longitude == null) continue;

    const dist = calculateDistanceMeters(
      studentLat,
      studentLon,
      cmp.latitude,
      cmp.longitude,
    );

    const allowedRadius = cmp.radiusMeters ?? 2000;
    if (dist <= allowedRadius) {
      matches.push({ campus: cmp, distanceMeters: dist });
    }
  }

  // Sort matches by distance (closest first)
  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);

  if (matches.length > 0) {
    return {
      detectedCampus: matches[0].campus,
      distanceMeters: matches[0].distanceMeters,
      allNearby: matches,
    };
  }

  // If no geofence matched, find absolute nearest campus as secondary fallback
  let nearest: CampusLocationItem | null = null;
  let minDistance: number | null = null;

  for (const cmp of campuses) {
    if (cmp.latitude == null || cmp.longitude == null) continue;
    const dist = calculateDistanceMeters(
      studentLat,
      studentLon,
      cmp.latitude,
      cmp.longitude,
    );
    if (minDistance === null || dist < minDistance) {
      minDistance = dist;
      nearest = cmp;
    }
  }

  return {
    detectedCampus: nearest,
    distanceMeters: minDistance,
    allNearby: [],
  };
}

/** ≤1km: confident enough to auto-select. 1–5km: plausible, but ask the
 * student to confirm. >5km: too far to guess — fall back to manual
 * campus selection. Pure distance bands per product spec, independent
 * of each campus's own geofence radiusMeters (that still gates
 * `findNearbyCampus` above). */
const AUTO_SELECT_METERS = 1000;
const CONFIRM_MAX_METERS = 5000;

/** GPS accuracy worse than this many meters can't be trusted to
 * distinguish "auto-select" from "confirm" — treated as if further
 * away than it measured. */
const POOR_ACCURACY_METERS = 500;

/**
 * Finds the nearest campus to the student's GPS coordinates via pure
 * Haversine distance and classifies confidence purely by distance
 * bands — no external geocoding, no API key.
 */
export function detectNearestCampus(
  studentLat: number,
  studentLon: number,
  accuracyMeters: number,
  campuses: CampusLocationItem[],
): CampusDetectionResult {
  let nearest: CampusLocationItem | null = null;
  let minDistance: number | null = null;
  const allNearby: { campus: CampusLocationItem; distanceMeters: number }[] = [];

  console.log(
    `[GPS Detection] User Location: lat=${studentLat}, lon=${studentLon}, accuracy=${accuracyMeters}m`,
  );

  for (const cmp of campuses) {
    if (cmp.latitude == null || cmp.longitude == null) continue;
    const dist = calculateDistanceMeters(studentLat, studentLon, cmp.latitude, cmp.longitude);
    console.log(
      `[GPS Detection] Campus '${cmp.name}' DB Location: lat=${cmp.latitude}, lon=${cmp.longitude} -> Haversine Distance: ${dist}m (${(dist / 1000).toFixed(2)} km)`,
    );
    allNearby.push({ campus: cmp, distanceMeters: dist });
    if (minDistance === null || dist < minDistance) {
      minDistance = dist;
      nearest = cmp;
    }
  }
  allNearby.sort((a, b) => a.distanceMeters - b.distanceMeters);

  let confidence: DetectionConfidence = "LOW";
  let requiresConfirmation = true;

  if (nearest && minDistance != null) {
    // Poor GPS accuracy can't be trusted for an auto-select decision —
    // treat it as at least "confirm" distance even if the raw fix
    // looked close.
    const effectiveDistance =
      accuracyMeters > POOR_ACCURACY_METERS
        ? Math.max(minDistance, AUTO_SELECT_METERS + 1)
        : minDistance;

    if (effectiveDistance <= AUTO_SELECT_METERS) {
      confidence = "HIGH";
      requiresConfirmation = false;
    } else if (effectiveDistance <= CONFIRM_MAX_METERS) {
      confidence = "MEDIUM";
      requiresConfirmation = true;
    } else {
      confidence = "LOW";
      requiresConfirmation = true;
      nearest = null; // beyond confirm range -> manual selection only
    }
  }

  return {
    detectedCampus: confidence === "LOW" ? null : nearest,
    distanceMeters: minDistance,
    confidence,
    requiresConfirmation,
    allNearby,
  };
}

/**
 * Detects the nearest registered GrabIt campus using device GPS + Google Maps Platform APIs.
 * Reverse-geocodes current coordinates for human-readable location verification and computes
 * Distance Matrix travel metrics when configured, falling back smoothly to Haversine distance when offline.
 */
export async function detectNearestCampusWithGoogle(
  studentLat: number,
  studentLon: number,
  accuracyMeters: number,
  campuses: CampusLocationItem[],
): Promise<CampusDetectionResult & { locationContext?: string }> {
  // Base distance & geofence detection
  const baseResult = detectNearestCampus(studentLat, studentLon, accuracyMeters, campuses);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return baseResult;
  }

  try {
    // 1. Google Reverse Geocoding API: validate location context
    const geo = await reverseGeocodeGoogle(studentLat, studentLon);
    if (geo.ok) {
      console.log(
        `[Google Maps Platform] Reverse Geocoded Location: ${geo.formattedAddress} (${geo.city}, ${geo.state})`,
      );
    }

    // 2. Google Distance Matrix API: validate distance & travel duration if candidate campus exists
    if (
      baseResult.detectedCampus &&
      baseResult.detectedCampus.latitude != null &&
      baseResult.detectedCampus.longitude != null
    ) {
      const matrix = await getGoogleDistanceMatrix(
        studentLat,
        studentLon,
        baseResult.detectedCampus.latitude,
        baseResult.detectedCampus.longitude,
      );

      if (matrix.ok && matrix.distanceMeters != null) {
        console.log(
          `[Google Maps Platform] Distance Matrix to '${baseResult.detectedCampus.name}': ${matrix.distanceMeters}m (${(matrix.distanceMeters / 1000).toFixed(2)} km), Duration: ${matrix.durationText || "N/A"}`,
        );
      }
    }

    return {
      ...baseResult,
      locationContext: geo.ok ? geo.formattedAddress : undefined,
    };
  } catch (err) {
    console.warn("[Google Maps Platform] Verification error, falling back to Haversine:", err);
    return baseResult;
  }
}

