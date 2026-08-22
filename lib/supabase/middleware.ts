import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, ROLE_AUTH_PATH } from "@/lib/auth/roles";
import type { UserRole } from "@/types";

/**
 * Centralized session refresh and server-side role-gating middleware.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isStudentAuth =
    pathname === "/auth" ||
    (pathname.startsWith("/auth/") &&
      !pathname.startsWith("/auth/callback") &&
      !pathname.startsWith("/auth/reset-password"));

  const isVendorAuth = pathname === "/vendor/auth";
  const isSuperAdminAuth = pathname === "/superadmin/auth";

  const isAuthPagePath = isStudentAuth || isVendorAuth || isSuperAdminAuth;

  const isProtectedStudent = pathname.startsWith("/customer");
  const isProtectedVendor = pathname.startsWith("/vendor") && !isVendorAuth;
  const isProtectedSuperAdmin = pathname.startsWith("/superadmin") && !isSuperAdminAuth;

  const isProtectedPath =
    isProtectedStudent || isProtectedVendor || isProtectedSuperAdmin;

  // 1. Unauthenticated user trying to access protected paths -> Redirect to role-specific auth entry point
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    if (isProtectedVendor) {
      url.pathname = ROLE_AUTH_PATH.vendor;
    } else if (isProtectedSuperAdmin) {
      url.pathname = ROLE_AUTH_PATH.admin;
    } else {
      url.pathname = ROLE_AUTH_PATH.student;
    }
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user logic
  if (user) {
    // Fetch authoritative user role from database
    let userRole: UserRole = "student";
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        userRole = profile.role as UserRole;
      }
    } catch {
      userRole = "student";
    }

    const homeUrl = ROLE_HOME[userRole] || "/customer";

    // 2a. Authenticated user visiting any login page -> Redirect to their role home dashboard
    if (isAuthPagePath) {
      const url = request.nextUrl.clone();
      url.pathname = homeUrl;
      url.search = "";
      return NextResponse.redirect(url);
    }

    // 2b. Role-based cross-access protection
    if (isProtectedPath) {
      let isAllowed = false;
      if (userRole === "student" && isProtectedStudent) isAllowed = true;
      if (userRole === "vendor" && isProtectedVendor) isAllowed = true;
      if (userRole === "admin" && isProtectedSuperAdmin) isAllowed = true;

      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = homeUrl;
        return NextResponse.redirect(url);
      }
    }
  }

  // Protected pages must never be served from the browser's back/forward
  // cache after sign-out — bfcache restores the DOM without a network
  // request, which would bypass this middleware entirely. Marking every
  // protected response no-store forces a real revalidation on back/forward
  // navigation, so a signed-out visitor lands back here instead of seeing
  // a stale authenticated page.
  if (isProtectedPath) {
    supabaseResponse.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return supabaseResponse;
}
