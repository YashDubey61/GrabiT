/**
 * Geolocation & Haversine Geofencing Utility — GrabIt Campus Canteen OS.
 * Used for client-side campus detection and distance calculations integrated with Google Maps APIs.
 */

import { reverseGeocodeGoogle } from "./google_maps";

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

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type GeolocationStatus =
  | "IDLE"
  | "DETECTING"
  | "GRANTED"
  | "DENIED"
  | "UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED";

export type DetectionConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface CampusDetectionResult {
  detectedCampus: CampusLocationItem | null;
  distanceMeters: number | null;
  formattedAddress: string;
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

/**
 * Full automatic campus detection pipeline combining Geolocation, Google Reverse Geocoding, and Geofencing.
 */
export async function detectCampusWithGoogle(
  studentLat: number,
  studentLon: number,
  accuracyMeters: number,
  campuses: CampusLocationItem[],
): Promise<CampusDetectionResult> {
  const [googleGeo, geofence] = await Promise.all([
    reverseGeocodeGoogle(studentLat, studentLon),
    Promise.resolve(findNearbyCampus(studentLat, studentLon, campuses)),
  ]);

  const campus = geofence.detectedCampus;
  const distance = geofence.distanceMeters;

  let confidence: DetectionConfidence = "LOW";
  let requiresConfirmation = false;

  if (campus && distance != null) {
    const radius = campus.radiusMeters ?? 2000;
    const isWellInside = distance <= radius * 0.75;
    const isAccurateGPS = accuracyMeters <= 100;

    if (isWellInside && isAccurateGPS) {
      confidence = "HIGH";
      requiresConfirmation = false;
    } else if (distance <= radius) {
      confidence = "MEDIUM";
      requiresConfirmation = geofence.allNearby.length > 1 || accuracyMeters > 200;
    } else {
      confidence = "LOW";
      requiresConfirmation = true;
    }
  } else {
    requiresConfirmation = true;
  }

  return {
    detectedCampus: campus,
    distanceMeters: distance,
    formattedAddress: googleGeo.formattedAddress,
    confidence,
    requiresConfirmation,
    allNearby: geofence.allNearby,
  };
}

/**
 * Safely request browser Geolocation coordinates with timeout handling.
 */
export function getCurrentBrowserLocation(
  timeoutMs = 6000,
): Promise<{ result?: GeolocationResult; errorStatus?: GeolocationStatus }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve({ errorStatus: "UNSUPPORTED" });
      return;
    }

    let isHandled = false;
    const timer = setTimeout(() => {
      if (!isHandled) {
        isHandled = true;
        resolve({ errorStatus: "TIMEOUT" });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isHandled) {
          isHandled = true;
          clearTimeout(timer);
          resolve({
            result: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
          });
        }
      },
      (err) => {
        if (!isHandled) {
          isHandled = true;
          clearTimeout(timer);
          if (err.code === err.PERMISSION_DENIED) {
            resolve({ errorStatus: "DENIED" });
          } else {
            resolve({ errorStatus: "UNAVAILABLE" });
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 60000,
      },
    );
  });
}
