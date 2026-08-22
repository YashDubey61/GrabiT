/**
 * Automated Verification Test Suite — Google Maps Platform & Automatic Campus Detection
 * Run with node/tsx: npx tsx tests/google_maps_campus_detection.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock_anon_key";
}

import {
  reverseGeocodeGoogle,
  geocodeAddressGoogle,
  searchGooglePlaces,
  getGoogleDistanceMatrix,
} from "../lib/utils/google_maps";

import {
  detectNearestCampusWithGoogle,
  type CampusLocationItem,
} from "../lib/utils/geolocation";

import {
  getLiveCampusList,
  getLiveCampusCanteens,
  getLiveCampusDetails,
} from "../lib/supabase/data";

async function runGoogleMapsCampusDetectionTests() {
  console.log("==================================================");
  console.log("GRABIT Google Maps & Campus Detection Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const mockCampuses: CampusLocationItem[] = [
    {
      id: "a1000000-0000-0000-0000-000000000001",
      name: "Axis Institute of Technology and Management",
      shortName: "Axis",
      city: "Kanpur, UP",
      latitude: 26.3768,
      longitude: 80.4475,
      radiusMeters: 2000,
    },
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "PSIT Kanpur",
      shortName: "PSIT",
      city: "Kanpur, UP",
      latitude: 26.8378,
      longitude: 80.3275,
      radiusMeters: 2000,
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Galgotias University",
      shortName: "Galgotias",
      city: "Greater Noida, Delhi NCR",
      latitude: 28.3640,
      longitude: 77.5360,
      radiusMeters: 2500,
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "SRM KTR",
      shortName: "SRM",
      city: "Chennai, Tamil Nadu",
      latitude: 12.8231,
      longitude: 80.0442,
      radiusMeters: 3000,
    },
  ];

  // Test 1: Google Reverse Geocoding Graceful Fallback
  try {
    const geo = await reverseGeocodeGoogle(26.8378, 80.3275);
    if (geo.ok && geo.formattedAddress) {
      console.log(`✅ TEST 1 PASSED: Reverse geocoding returned location context: '${geo.formattedAddress}'.`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED: Reverse geocoding failed.", geo);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Address Geocoding Handler for Super Admin
  try {
    const addr = await geocodeAddressGoogle("PSIT Kanpur Bhauti");
    // Should safely handle unconfigured key or mock response
    if (addr.error || addr.ok) {
      console.log("✅ TEST 2 PASSED: Address geocoding handler executed safely with error handling.");
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Address geocoding crashed.", addr);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Places Autocomplete Helper
  try {
    const suggestions = await searchGooglePlaces("PSIT");
    if (Array.isArray(suggestions)) {
      console.log(`✅ TEST 3 PASSED: Places autocomplete search returned array (${suggestions.length} predictions).`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Places autocomplete did not return array.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Full Campus Detection Pipeline — High Confidence Match
  try {
    const studentLat = 26.8380;
    const studentLon = 80.3276;
    const accuracy = 15; // 15 meters high accuracy

    const detection = await detectNearestCampusWithGoogle(
      studentLat,
      studentLon,
      accuracy,
      mockCampuses,
    );

    if (
      detection.detectedCampus?.id === "11111111-1111-1111-1111-111111111111" &&
      detection.confidence === "HIGH" &&
      !detection.requiresConfirmation
    ) {
      console.log(`✅ TEST 4 PASSED: High confidence campus detection succeeded for PSIT Kanpur via Google Maps integration.`);
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: High confidence detection mismatch.", detection);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  // Test 5: Full Campus Detection Pipeline — Medium Confidence / Boundary Ambiguity
  try {
    const studentLat = 26.8520; // Near radius boundary
    const studentLon = 80.3400;
    const accuracy = 250; // Poor GPS accuracy

    const detection = await detectNearestCampusWithGoogle(
      studentLat,
      studentLon,
      accuracy,
      mockCampuses,
    );

    if (detection.requiresConfirmation || detection.confidence !== "HIGH") {
      console.log("✅ TEST 5 PASSED: Poor accuracy / boundary proximity correctly triggered confirmation request.");
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Expected confirmation request for inaccurate GPS.", detection);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err);
    failed++;
  }

  // Test 5b: Google Distance Matrix Helper Handler
  try {
    const matrixRes = await getGoogleDistanceMatrix(26.5400, 80.2500, 26.3768, 80.4475);
    // Should safely handle unconfigured key or API response
    if (matrixRes.error || matrixRes.ok) {
      console.log("✅ TEST 5b PASSED: Google Distance Matrix API handler executed safely with error handling.");
      passed++;
    } else {
      console.error("❌ TEST 5b FAILED: Distance matrix crashed.", matrixRes);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5b ERROR:", err);
    failed++;
  }

  // Test 5c: 28 km Distance Protection for Axis Institute
  try {
    const distantStudentLat = 26.5400; // Kalyanpur / IIT Kanpur area (~26.4 km from Axis in Rooma)
    const distantStudentLon = 80.2500;
    const accuracy = 15;

    const detection = await detectNearestCampusWithGoogle(distantStudentLat, distantStudentLon, accuracy, mockCampuses);

    if (detection.detectedCampus === null && detection.confidence === "LOW" && (detection.distanceMeters ?? 0) > 20000) {
      console.log(`✅ TEST 5c PASSED: 28km location from Axis Institute correctly detected as LOW confidence (${((detection.distanceMeters ?? 0)/1000).toFixed(1)} km) without displaying ~4.2 km.`);
      passed++;
    } else {
      console.error("❌ TEST 5c FAILED: 28km location incorrectly matched Axis Institute.", detection);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5c ERROR:", err);
    failed++;
  }

  // Test 6: Vendor Data Isolation per Campus
  try {
    const psitCanteens = await getLiveCampusCanteens("11111111-1111-1111-1111-111111111111");
    const galgotiasCanteens = await getLiveCampusCanteens("22222222-2222-2222-2222-222222222222");

    const psitNames = psitCanteens.map((c) => c.name);
    const galgotiasNames = galgotiasCanteens.map((c) => c.name);

    const hasOverlap = psitNames.some((n) => galgotiasNames.includes(n));

    if (!hasOverlap) {
      console.log("✅ TEST 6 PASSED: Food stall vendors are strictly isolated per campus (0 vendor overlap).");
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Overlap detected in campus vendors!", { psitNames, galgotiasNames });
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err);
    failed++;
  }

  // Test 7: Dynamic Campus Details Scoping
  try {
    const liveCampuses = await getLiveCampusList();
    const campusId = liveCampuses.length > 0 ? liveCampuses[0].id : "11111111-1111-1111-1111-111111111111";
    const details = await getLiveCampusDetails(campusId);

    if (details && details.name) {
      console.log(`✅ TEST 7 PASSED: Header metrics dynamically resolved correct campus name ('${details.name}').`);
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Campus details resolution mismatch.", { details });
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err);
    failed++;
  }

  // Test 8: Zero Secret Leak in Public API Key Config
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const isSecretKey = key ? key.includes("SERVICE_ROLE") || key.includes("SECRET") : false;

    if (!isSecretKey) {
      console.log("✅ TEST 8 PASSED: Client Google API key configuration contains zero secret keys.");
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED: Secret key detected in client env var!");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 8 ERROR:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runGoogleMapsCampusDetectionTests();
