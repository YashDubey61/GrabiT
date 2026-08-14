import { NextResponse } from "next/server";

// Mock canteen data matching seed
const CANTEENS = [
  {
    id: "ca000000-0000-0000-0000-000000000001",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    name: "Café Central",
    location_desc: "Main Building, Ground Floor",
    image_url: null,
    is_open: true,
    opening_time: "08:00:00",
    closing_time: "20:00:00",
    created_at: new Date().toISOString(),
  },
  {
    id: "ca000000-0000-0000-0000-000000000002",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    name: "South Side Bites",
    location_desc: "Hostel 4 Basement",
    image_url: null,
    is_open: true,
    opening_time: "09:00:00",
    closing_time: "22:00:00",
    created_at: new Date().toISOString(),
  },
  {
    id: "ca000000-0000-0000-0000-000000000003",
    campus_id: "c0000000-0000-0000-0000-000000000001",
    name: "Quick Bites Corner",
    location_desc: "Near Library",
    image_url: null,
    is_open: false,
    opening_time: "10:00:00",
    closing_time: "18:00:00",
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ canteens: CANTEENS });
}
