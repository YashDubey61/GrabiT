import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use inside Client Components only.
 * Server Components / Route Handlers / middleware must use
 * lib/supabase/server.ts or lib/supabase/middleware.ts instead — the
 * anon key here has no elevated privileges, but cookie/session handling
 * differs between the two contexts and mixing them breaks auth refresh.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
