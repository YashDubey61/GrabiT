import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "GrabIt Gold subscription purchases and activations are not directly client-executable. GrabIt Gold payments will be available soon.",
    },
    { status: 403 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      ok: false,
      error: "Subscription status cannot be updated from client.",
    },
    { status: 403 },
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      ok: false,
      error: "Subscription status cannot be updated from client.",
    },
    { status: 403 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      ok: false,
      error: "Subscription status cannot be deleted from client.",
    },
    { status: 403 },
  );
}
