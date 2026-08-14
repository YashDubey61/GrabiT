import { NextRequest, NextResponse } from "next/server";
import { mockOtpProvider } from "@/lib/auth/mock-otp";

// Hardcoded student lookup for mock auth (matches seed data)
const MOCK_STUDENTS = [
  {
    id: "st000000-0000-0000-0000-000000000001",
    name: "Arjun Mehta",
    phone: "9876543001",
    email: "arjun@iitb.ac.in",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    is_gold_subscriber: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "st000000-0000-0000-0000-000000000002",
    name: "Priya Sharma",
    phone: "9876543002",
    email: "priya@iitb.ac.in",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    is_gold_subscriber: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "st000000-0000-0000-0000-000000000003",
    name: "Rohan Gupta",
    phone: "9876543003",
    email: "rohan@iitb.ac.in",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    is_gold_subscriber: false,
    created_at: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  const { phone, otp } = await request.json();

  if (!phone || !otp) {
    return NextResponse.json(
      { error: "Phone and OTP required" },
      { status: 400 }
    );
  }

  const result = await mockOtpProvider.verify(phone, otp);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message },
      { status: 401 }
    );
  }

  // Find or create student
  const found = MOCK_STUDENTS.find((s) => s.phone === phone);
  const student = found ?? {
    id: `st-${Date.now()}`,
    name: `Student ${phone.slice(-4)}`,
    phone,
    email: "",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    is_gold_subscriber: false,
    created_at: new Date().toISOString(),
  };

  const response = NextResponse.json({ student });
  response.cookies.set("grabit-student-id", student.id, {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
