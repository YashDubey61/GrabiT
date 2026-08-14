import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For now, let all routes through.
  // Auth checks will be done at the page level using Supabase session.
  // This middleware is reserved for session refresh and redirects.

  // Student routes — check for session cookie
  if (pathname.startsWith("/app") && !pathname.startsWith("/app/login")) {
    const session = request.cookies.get("grabit-student-id");
    if (!session) {
      return NextResponse.redirect(new URL("/app/login", request.url));
    }
  }

  // Vendor routes
  if (pathname.startsWith("/vendor") && !pathname.startsWith("/vendor/login")) {
    const session = request.cookies.get("grabit-vendor-id");
    if (!session) {
      return NextResponse.redirect(new URL("/vendor/login", request.url));
    }
  }

  // Admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = request.cookies.get("grabit-admin");
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/vendor/:path*", "/admin/:path*"],
};
