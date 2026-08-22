import { NextResponse } from "next/server";
import { searchGooglePlaces } from "@/lib/utils/google_maps";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const result = await searchGooglePlaces(query);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
