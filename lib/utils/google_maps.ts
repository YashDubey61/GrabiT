/**
 * Google Maps Platform Integration Library — GrabIt Campus Canteen OS.
 * Handles Reverse Geocoding, Google Places Autocomplete, Address Geocoding,
 * and Distance Matrix API web-service requests securely on the backend server
 * using GOOGLE_MAPS_SERVER_API_KEY.
 */

export interface GoogleReverseGeocodeResult {
  ok: boolean;
  formattedAddress: string;
  city: string;
  state: string;
  placeId?: string;
  error?: string;
}

export interface GooglePlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface GoogleGeocodeAddressResult {
  ok: boolean;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  error?: string;
}

export interface GoogleDistanceMatrixResult {
  ok: boolean;
  distanceMeters?: number;
  durationText?: string;
  error?: string;
}

/**
 * Returns the secure server-side API key for Google Maps Platform web services.
 * Prioritizes GOOGLE_MAPS_SERVER_API_KEY, with fallback to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * during migration environments.
 */
function getGoogleServerApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );
}

/**
 * Reverse geocode latitude/longitude coordinates into human-readable location context via Google Maps API.
 */
export async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number,
): Promise<GoogleReverseGeocodeResult> {
  const apiKey = getGoogleServerApiKey();

  if (!apiKey || apiKey.trim() === "") {
    // Offline/Default fallback when Google API key is unconfigured
    return {
      ok: true,
      formattedAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
      city: "Detected Area",
      state: "India",
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const topResult = data.results[0];
      const addressComponents = topResult.address_components || [];

      let city = "";
      let state = "";

      for (const comp of addressComponents) {
        const types: string[] = comp.types || [];
        if (types.includes("locality") || types.includes("administrative_area_level_2")) {
          city = comp.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          state = comp.long_name;
        }
      }

      return {
        ok: true,
        formattedAddress: topResult.formatted_address || "Detected Area",
        city: city || "Detected City",
        state: state || "India",
        placeId: topResult.place_id,
      };
    }

    return {
      ok: false,
      formattedAddress: `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
      city: "Campus Area",
      state: "India",
      error: data.error_message || data.status || "Reverse geocoding failed",
    };
  } catch {
    return {
      ok: false,
      formattedAddress: `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
      city: "Campus Area",
      state: "India",
      error: "Network error fetching reverse geocode",
    };
  }
}

/**
 * Geocode a campus address into latitude/longitude coordinates (used by Super Admin).
 */
export async function geocodeAddressGoogle(
  address: string,
): Promise<GoogleGeocodeAddressResult> {
  const apiKey = getGoogleServerApiKey();

  if (!apiKey || apiKey.trim() === "") {
    return {
      ok: false,
      error: "Google Maps Server API Key is not configured in environment (GOOGLE_MAPS_SERVER_API_KEY).",
    };
  }

  try {
    const encoded = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const loc = data.results[0].geometry.location;
      return {
        ok: true,
        latitude: loc.lat,
        longitude: loc.lng,
        formattedAddress: data.results[0].formatted_address,
      };
    }

    return {
      ok: false,
      error: data.error_message || data.status || "Address not found",
    };
  } catch {
    return {
      ok: false,
      error: "Network error geocoding campus address",
    };
  }
}

/**
 * Fetch Google Places autocomplete predictions for campus search.
 */
export async function searchGooglePlaces(
  query: string,
): Promise<GooglePlaceSuggestion[]> {
  const apiKey = getGoogleServerApiKey();

  if (!apiKey || !query.trim() || query.length < 2) {
    return [];
  }

  try {
    const input = encodeURIComponent(query.trim());
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=establishment&components=country:in&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.predictions) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text || p.description,
        secondaryText: p.structured_formatting?.secondary_text || "",
      }));
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch travel distance and duration between student GPS origin and campus destination via Google Maps Distance Matrix API.
 */
export async function getGoogleDistanceMatrix(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): Promise<GoogleDistanceMatrixResult> {
  const apiKey = getGoogleServerApiKey();

  if (!apiKey || apiKey.trim() === "") {
    return {
      ok: false,
      error: "Google Maps Server API Key is not configured in environment (GOOGLE_MAPS_SERVER_API_KEY).",
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLon}&destinations=${destLat},${destLon}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (
      data.status === "OK" &&
      data.rows &&
      data.rows.length > 0 &&
      data.rows[0].elements &&
      data.rows[0].elements.length > 0
    ) {
      const element = data.rows[0].elements[0];
      if (element.status === "OK") {
        return {
          ok: true,
          distanceMeters: element.distance?.value,
          durationText: element.duration?.text,
        };
      }
    }

    return {
      ok: false,
      error: data.error_message || data.status || "Distance Matrix query failed",
    };
  } catch {
    return {
      ok: false,
      error: "Network error querying Google Distance Matrix API",
    };
  }
}
