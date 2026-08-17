import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DEFAULT_DELIVERY_CHARGE } from "@/lib/orders/delivery_charge";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, key);
}

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
