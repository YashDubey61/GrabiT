import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and
 * Server Actions. Reads/writes the session via Next.js cookies() so that
 * role checks here are authoritative — never trust a client-supplied role.
 *
 * Role authorization (student/vendor/admin) must be enforced through this
 * client + Postgres RLS policies (supabase/migrations), not by hiding UI.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component with no writable response —
            // safe to ignore as long as middleware.ts refreshes the session.
          }
        },
      },
    },
  );
}
