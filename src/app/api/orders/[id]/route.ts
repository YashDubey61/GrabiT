import { NextRequest, NextResponse } from "next/server";
import { canTransition, getNextState } from "@/lib/utils/order-state-machine";
import { OrderState } from "@/lib/constants";

type MockOrder = {
  id: string;
  status: string;
  updated_at: string;
  [key: string]: unknown;
};

const globalStore = globalThis as unknown as { __mockOrders?: MockOrder[] };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = globalStore.__mockOrders?.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, is_delayed } = await request.json();
  const order = globalStore.__mockOrders?.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (status) {
    if (!canTransition(order.status as OrderState, status as OrderState)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      );
    }
    order.status = status;
  }

  if (typeof is_delayed === "boolean") {
    order.is_delayed = is_delayed;
  }

  order.updated_at = new Date().toISOString();

  return NextResponse.json({ order });
}
