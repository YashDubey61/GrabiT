import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME } from "@/lib/auth/roles";
import type { UserRole } from "@/types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next");

  // Handle OAuth error or cancellation
  if (error || errorDescription) {
    const errText = (errorDescription || error || "").toLowerCase();
    const redirectUrl = new URL("/auth", requestUrl.origin);
    if (
      errText.includes("access_denied") ||
      errText.includes("user_canceled") ||
      errText.includes("user canceled")
    ) {
      return NextResponse.redirect(redirectUrl);
    }
    redirectUrl.searchParams.set("error", "We couldn’t complete Google Sign-In. Please try again.");
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
              // Ignore if called from component without write permissions
            }
          },
        },
      },
    );

    const { data: authData, error: exchangeErr } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeErr || !authData.user) {
      console.error("OAuth code exchange error:", exchangeErr);
      const redirectUrl = new URL("/auth", requestUrl.origin);
      redirectUrl.searchParams.set("error", "We couldn’t complete Google Sign-In. Please try again.");
      return NextResponse.redirect(redirectUrl);
    }

    const authUser = authData.user;

    // Check or create public.users profile
    let userRole: UserRole = "student";
    try {
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileErr || !profile) {
        // First-time Google OAuth user -> create student profile
        const randomPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        await supabase.from("users").upsert({
          id: authUser.id,
          phone: authUser.phone || randomPhone,
          role: "student",
          campus_id: "a1000000-0000-0000-0000-000000000001",
        });
        userRole = "student";
      } else {
        userRole = (profile.role as UserRole) || "student";
      }
    } catch (e) {
      console.error("Error fetching/creating user profile in callback:", e);
      userRole = "student";
    }

    // Determine target redirect route
    const targetPath = next || ROLE_HOME[userRole] || "/customer";
    return NextResponse.redirect(new URL(targetPath, requestUrl.origin));
  }

  // No code or error -> redirect back to /auth
  return NextResponse.redirect(new URL("/auth", requestUrl.origin));
}
