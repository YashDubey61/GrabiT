import { NextResponse } from "next/server";
import { DEFAULT_DELIVERY_CHARGE } from "@/lib/orders/delivery_charge";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** Public read — cart/checkout need this to *display* the current
 * charge and reason. The number shown here is never trusted for
 * payment; order creation re-reads this same row server-side. */
export async function GET() {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "delivery_charge")
    .maybeSingle();

  return NextResponse.json({ ok: true, config: data?.value ?? DEFAULT_DELIVERY_CHARGE });
}
