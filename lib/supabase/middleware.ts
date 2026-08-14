import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh + role-gate helper called from middleware.ts.
 *
 * This is the ARCHITECTURE for server-side role enforcement, not the full
 * policy yet: it refreshes the Supabase session on every request and
 * exposes the authenticated user for route-group checks. The actual
 * role → route allow-list (student → /student/*, vendor → /vendor/*,
 * admin → /admin/*) is deferred to Day 2 once `users.role` is queryable
 * against a live schema — wiring it against an empty database would be
 * fake enforcement, which the brief explicitly rules out.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // No Supabase project is provisioned yet in this foundation phase (see
  // Day 1 report, "Supabase — deferred"). Fail open to a pass-through
  // response rather than crashing every request — a hard crash here would
  // block viewing the route shells before a project exists, which isn't a
  // real security boundary being bypassed, just an unconfigured one.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Touches the session so expired tokens refresh before hitting a
  // Server Component. Intentionally not yet redirecting unauthenticated
  // users — see note above.
  await supabase.auth.getUser();

  return supabaseResponse;
}
