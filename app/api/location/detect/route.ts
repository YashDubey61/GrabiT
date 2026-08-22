import { NextResponse } from "next/server";
import { detectNearestCampusWithGoogle, type CampusLocationItem } from "@/lib/utils/geolocation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { latitude, longitude, accuracy, campuses } = body;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates provided" },
        { status: 400 },
      );
    }

    const validCampuses: CampusLocationItem[] = Array.isArray(campuses) ? campuses : [];
    const accuracyMeters = typeof accuracy === "number" && !isNaN(accuracy) ? accuracy : 15;

    const result = await detectNearestCampusWithGoogle(
      latitude,
      longitude,
      accuracyMeters,
      validCampuses,
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error during location detection" },
      { status: 500 },
    );
  }
}
