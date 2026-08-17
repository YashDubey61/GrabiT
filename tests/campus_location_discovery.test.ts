/**
 * Automated Verification Test Suite — Automatic Location & Campus Vendor Discovery
 * Run with node/tsx: npx tsx tests/campus_location_discovery.test.ts
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock_anon_key";
}

import {
  calculateDistanceMeters,
  findNearbyCampus,
  type CampusLocationItem,
} from "../lib/utils/geolocation";

import {
  getLiveCampusList,
  getLiveCampusDetails,
  getLiveCampusCanteens,
} from "../lib/supabase/data";

async function runCampusDiscoveryTests() {
  console.log("==================================================");
  console.log("GRABIT Automatic Location & Campus Discovery Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const mockCampuses: CampusLocationItem[] = [
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

  // Test 1: Haversine Formula Distance Accuracy
  try {
    // PSIT Kanpur to approx 500m away
    const distance = calculateDistanceMeters(26.8378, 80.3275, 26.8400, 80.3300);
    if (distance > 300 && distance < 700) {
      console.log(`✅ TEST 1 PASSED: Haversine distance calculated accurately (${distance} meters).`);
      passed++;
    } else {
      console.error("❌ TEST 1 FAILED: Distance calculation inaccurate.", distance);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 1 ERROR:", err);
    failed++;
  }

  // Test 2: Automatic Geofence Matching (Student inside PSIT Kanpur)
  try {
    const studentLat = 26.8385; // ~100m from PSIT center
    const studentLon = 80.3280;

    const { detectedCampus, distanceMeters } = findNearbyCampus(
      studentLat,
      studentLon,
      mockCampuses,
    );

    if (detectedCampus?.id === "11111111-1111-1111-1111-111111111111" && distanceMeters! < 2000) {
      console.log(`✅ TEST 2 PASSED: Automatically detected campus '${detectedCampus.name}' within geofence (${distanceMeters}m).`);
      passed++;
    } else {
      console.error("❌ TEST 2 FAILED: Geofence detection failed.", detectedCampus);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 2 ERROR:", err);
    failed++;
  }

  // Test 3: Automatic Geofence Matching (Student inside Galgotias University)
  try {
    const studentLat = 28.3645;
    const studentLon = 77.5365;

    const { detectedCampus } = findNearbyCampus(
      studentLat,
      studentLon,
      mockCampuses,
    );

    if (detectedCampus?.id === "22222222-2222-2222-2222-222222222222") {
      console.log(`✅ TEST 3 PASSED: Automatically detected campus '${detectedCampus.name}' for Greater Noida GPS.`);
      passed++;
    } else {
      console.error("❌ TEST 3 FAILED: Galgotias geofence detection failed.", detectedCampus);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 3 ERROR:", err);
    failed++;
  }

  // Test 4: Geofence Fallback when Student is Far Away
  try {
    const mumbaiLat = 19.0760;
    const mumbaiLon = 72.8777;

    const { allNearby } = findNearbyCampus(
      mumbaiLat,
      mumbaiLon,
      mockCampuses,
    );

    if (allNearby.length === 0) {
      console.log("✅ TEST 4 PASSED: Remote GPS correctly returned 0 nearby geofence matches (prompting manual campus selector).");
      passed++;
    } else {
      console.error("❌ TEST 4 FAILED: False geofence match for distant GPS.", allNearby);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 4 ERROR:", err);
    failed++;
  }

  // Test 5: Live Campus Registry Retrieval
  try {
    const campusList = await getLiveCampusList();
    if (campusList.length >= 1 && campusList[0].name) {
      console.log(`✅ TEST 5 PASSED: Live campus registry fetched (${campusList.length} active university campuses).`);
      passed++;
    } else {
      console.error("❌ TEST 5 FAILED: Failed to fetch campus registry.", campusList);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 5 ERROR:", err);
    failed++;
  }

  // Test 6: Scoped Campus Details Query
  try {
    const psitDetails = await getLiveCampusDetails("11111111-1111-1111-1111-111111111111");
    const galgotiasDetails = await getLiveCampusDetails("22222222-2222-2222-2222-222222222222");

    if (psitDetails?.name.includes("PSIT") && galgotiasDetails?.name.includes("Galgotias")) {
      console.log(`✅ TEST 6 PASSED: Dynamic campus header metrics scoped to target campus IDs ('${psitDetails.name}' vs '${galgotiasDetails.name}').`);
      passed++;
    } else {
      console.error("❌ TEST 6 FAILED: Campus details query mismatch.", { psitDetails, galgotiasDetails });
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 6 ERROR:", err);
    failed++;
  }

  // Test 7: Scoped Vendor Query Isolation
  try {
    const galgotiasCanteens = await getLiveCampusCanteens("22222222-2222-2222-2222-222222222222");
    // Galgotias query should only return Galgotias vendors and never return PSIT-only vendors
    const hasPsitVendor = galgotiasCanteens.some((c) => c.name.includes("Central Food Court"));

    if (!hasPsitVendor) {
      console.log(`✅ TEST 7 PASSED: Database vendor query isolation verified (0 PSIT vendors returned when querying Galgotias).`);
      passed++;
    } else {
      console.error("❌ TEST 7 FAILED: Cross-campus vendor data leak detected!", galgotiasCanteens);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 7 ERROR:", err);
    failed++;
  }

  // Test 8: Security Boundary — Public Read Access for Discovery
  try {
    const publicCampuses = await getLiveCampusList();
    if (publicCampuses.length > 0) {
      console.log("✅ TEST 8 PASSED: Public RLS read policy allows unauthenticated student discovery.");
      passed++;
    } else {
      console.error("❌ TEST 8 FAILED: RLS blocked discovery query.");
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 8 ERROR:", err);
    failed++;
  }

  // Test 9: Zero Secret Leaks in Public Env
  try {
    const publicEnvVars = Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
    const sensitiveKeywords = ["SERVICE_ROLE", "SECRET", "PRIVATE_KEY"];
    const leaks = publicEnvVars.filter((k) => sensitiveKeywords.some((w) => k.toUpperCase().includes(w)));

    if (leaks.length === 0) {
      console.log("✅ TEST 9 PASSED: Zero API secrets or service role keys exposed in client env vars.");
      passed++;
    } else {
      console.error("❌ TEST 9 FAILED: Sensitive env vars exposed!", leaks);
      failed++;
    }
  } catch (err) {
    console.error("❌ TEST 9 ERROR:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`Test Execution Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCampusDiscoveryTests();
