import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Root middleware — runs on every matched request, ahead of any route
// group. Role-based allow/deny (student/vendor/admin route separation) is
// architected here but deferred until Day 2 (see lib/supabase/middleware.ts).
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
