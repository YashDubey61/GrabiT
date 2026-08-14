import { NextRequest, NextResponse } from "next/server";

type MockGroupOrder = {
  id: string;
  share_code: string;
  creator_id: string;
  canteen_id: string;
  time_slot_id: string;
  status: "open" | "locked" | "checked_out";
  participants: Array<{
    student_id: string;
    student_name: string;
    items: Array<{ menu_item_id: string; name: string; quantity: number; unit_price: number }>;
  }>;
  created_at: string;
};

const globalStore = globalThis as unknown as { __mockGroupOrders?: MockGroupOrder[] };
if (!globalStore.__mockGroupOrders) {
  globalStore.__mockGroupOrders = [
    {
      id: "go-1",
      share_code: "LUNCH123",
      creator_id: "st000000-0000-0000-0000-000000000001",
      canteen_id: "ca000000-0000-0000-0000-000000000001",
      time_slot_id: "ts000000-0000-0000-0000-000000000002",
      status: "open",
      participants: [
        {
          student_id: "st000000-0000-0000-0000-000000000001",
          student_name: "Arjun Mehta",
          items: [
            { menu_item_id: "mi000000-0000-0000-0000-000000000001", name: "Samosa", quantity: 2, unit_price: 1500 },
            { menu_item_id: "mi000000-0000-0000-0000-000000000003", name: "Filter Coffee", quantity: 1, unit_price: 2000 }
          ]
        }
      ],
      created_at: new Date().toISOString()
    }
  ];
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const groupOrder = globalStore.__mockGroupOrders?.find((g) => g.share_code.toUpperCase() === code.toUpperCase());
    if (!groupOrder) {
      return NextResponse.json({ error: "Group order not found" }, { status: 404 });
    }
    return NextResponse.json({ groupOrder });
  }

  return NextResponse.json({ groupOrders: globalStore.__mockGroupOrders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { creator_id, canteen_id, time_slot_id, student_name } = body;

  const share_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newGroupOrder: MockGroupOrder = {
    id: `go-${Date.now()}`,
    share_code,
    creator_id: creator_id || "st000000-0000-0000-0000-000000000001",
    canteen_id,
    time_slot_id,
    status: "open",
    participants: student_name ? [
      {
        student_id: creator_id || "st000000-0000-0000-0000-000000000001",
        student_name,
        items: []
      }
    ] : [],
    created_at: new Date().toISOString()
  };

  globalStore.__mockGroupOrders!.push(newGroupOrder);
  return NextResponse.json({ groupOrder: newGroupOrder }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { code, student_id, student_name, items } = body;

  const groupOrder = globalStore.__mockGroupOrders?.find((g) => g.share_code.toUpperCase() === code.toUpperCase());
  if (!groupOrder) {
    return NextResponse.json({ error: "Group order not found" }, { status: 404 });
  }

  const existingParticipant = groupOrder.participants.find((p) => p.student_id === student_id);
  if (existingParticipant) {
    existingParticipant.items = items;
  } else {
    groupOrder.participants.push({
      student_id,
      student_name: student_name || "Friend",
      items
    });
  }

  return NextResponse.json({ groupOrder });
}
