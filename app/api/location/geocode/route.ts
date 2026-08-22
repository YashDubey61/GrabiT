import { NextResponse } from "next/server";
import { geocodeAddressGoogle } from "@/lib/utils/google_maps";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address } = body;

    if (typeof address !== "string" || !address.trim()) {
      return NextResponse.json(
        { error: "Valid address string is required" },
        { status: 400 },
      );
    }

    const result = await geocodeAddressGoogle(address);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Internal server error during address geocoding" },
      { status: 500 },
    );
  }
}
