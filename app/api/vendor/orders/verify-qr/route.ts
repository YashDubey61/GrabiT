import { NextResponse } from "next/server";
import { resolvePickupQr, pickupQrHttpStatus } from "@/lib/supabase/pickup_qr_verify";

/**
 * Read-only preview step: resolves a scanned QR into the order the
 * vendor is about to complete, so they can confirm what they're
 * handing over before anything mutates. Never changes order state.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { qrValue?: unknown };
    const result = await resolvePickupQr(body?.qrValue);

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.error },
        { status: pickupQrHttpStatus(result.code) },
      );
    }

    return NextResponse.json({ ok: true, order: result.order });
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_QR", error: "Invalid GRABIT QR code." },
      { status: 400 },
    );
  }
}
