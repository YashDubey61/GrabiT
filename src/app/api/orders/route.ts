import { NextRequest, NextResponse } from "next/server";
import { calculateFees } from "@/lib/utils/fees";

// In-memory order store for mock (replaced by Supabase in prod)
type MockOrder = {
  id: string;
  student_id: string;
  canteen_id: string;
  time_slot_id: string;
  status: string;
  total: number;
  platform_fee: number;
  student_fee: number;
  vendor_fee: number;
  payment_method: string;
  payment_ref: string | null;
  is_delayed: boolean;
  items: Array<{
    menu_item_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  created_at: string;
  updated_at: string;
};

// Global mock store
const globalStore = globalThis as unknown as { __mockOrders?: MockOrder[] };
if (!globalStore.__mockOrders) {
  globalStore.__mockOrders = [];
}

export async function GET(request: NextRequest) {
  const studentId = request.cookies.get("grabit-student-id")?.value;
  const url = new URL(request.url);
  const canteenId = url.searchParams.get("canteen_id");
  const role = url.searchParams.get("role");

  let orders = globalStore.__mockOrders || [];

  if (role === "vendor" && canteenId) {
    orders = orders.filter((o) => o.canteen_id === canteenId);
  } else if (studentId) {
    orders = orders.filter((o) => o.student_id === studentId);
  }

  return NextResponse.json({ orders: orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { student_id, canteen_id, time_slot_id, payment_method, items, is_gold } = body;

  if (!student_id || !canteen_id || !time_slot_id || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const total = items.reduce(
    (sum: number, item: { unit_price: number; quantity: number }) =>
      sum + item.unit_price * item.quantity,
    0
  );

  const fees = calculateFees(total, is_gold ?? false);

  const order: MockOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    student_id,
    canteen_id,
    time_slot_id,
    status: "placed",
    total,
    platform_fee: fees.platformFee,
    student_fee: fees.studentFee,
    vendor_fee: fees.vendorFee,
    payment_method: payment_method || "upi",
    payment_ref: `mock_pay_${Date.now()}`,
    is_delayed: false,
    items: items.map((item: { menu_item_id: string; name: string; quantity: number; unit_price: number }) => ({
      ...item,
      subtotal: item.unit_price * item.quantity,
    })),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  globalStore.__mockOrders!.push(order);

  return NextResponse.json({ order }, { status: 201 });
}
