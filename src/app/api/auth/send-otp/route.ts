import { NextRequest, NextResponse } from "next/server";
import { mockOtpProvider } from "@/lib/auth/mock-otp";

export async function POST(request: NextRequest) {
  const { phone } = await request.json();

  if (!phone || typeof phone !== "string" || phone.length < 10) {
    return NextResponse.json(
      { error: "Valid phone number required" },
      { status: 400 }
    );
  }

  const result = await mockOtpProvider.send(phone);
  return NextResponse.json(result);
}
