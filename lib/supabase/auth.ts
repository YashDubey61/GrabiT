import { createClient } from "./client";
import type { UserRole } from "@/types";
import type { User, Session } from "@supabase/supabase-js";

export interface StudentProfile {
  id: string;
  email: string;
  phone: string;
  role: "student";
  campusId: string;
  campusName: string;
  studentIdTag: string;
  avatarUrl: string;
}

/**
 * Fetch authenticated student profile from Supabase Auth + public.users table.
 */
export async function getCurrentStudentProfile(): Promise<StudentProfile | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return null;
    }

    const { data: profiles, error: profileErr } = await supabase
      .from("users")
      .select("*, campuses(name)")
      .eq("id", user.id)
      .eq("role", "student")
      .limit(1);

    if (profileErr || !profiles || profiles.length === 0) {
      return null;
    }

    const p = profiles[0];

    if (p.role !== "student") {
      return null;
    }

    const campusName = (p.campuses as { name: string } | null)?.name ?? "Campus";

    return {
      id: p.id,
      email: user.email ?? "student@grabit.in",
      phone: p.phone ?? "+919999999999",
      role: "student",
      campusId: p.campus_id ?? "a1000000-0000-0000-0000-000000000001",
      campusName,
      studentIdTag: `GRB-${p.id.slice(0, 6).toUpperCase()}`,
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0UC7dpD4OUKonC4W287WPg0Gnic80gYNaQUlT5JeKVdN9Qi2mZGcvFp3hdZ05VTrWmjRr-Twvu8fFinGwpcdg0gPV1peTnf5OPY7ytoGnVZ1f_q1Op19HPKnEO3X1GvKha2kWOQqpSRkpPyRjGByLCeqU7qcar10tg5xTuhvKY_nuw8tk-fA7oJzUcBXhBRktsp1XTnf94v1SNBiI-7XR0F0i1Y6PtSMwdTnJwHi4QisCMfCh7_R",
    };
  } catch {
    return null;
  }
}

/**
 * Sign in student with Email + Password via Supabase Auth.
 */
export async function signStudentIn(
  email: string,
  pass: string,
): Promise<{ ok: boolean; role?: UserRole; user?: User; session?: Session; error?: string }> {
  try {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { ok: false, error: "Please enter your email." };
    }
    if (!pass) {
      return { ok: false, error: "Please enter your password." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: pass,
    });

    if (error) {
      const errLower = error.message?.toLowerCase() || "";
      if (errLower.includes("invalid login credentials") || errLower.includes("invalid credentials")) {
        return { ok: false, error: "Sign in failed. Please check your email and password." };
      }
      if (errLower.includes("fetch") || errLower.includes("network") || errLower.includes("connection")) {
        return { ok: false, error: "Unable to sign in right now. Please check your connection and try again." };
      }
      return { ok: false, error: "Sign in failed. Please check your email and password." };
    }

    if (!data.user || !data.session) {
      return { ok: false, error: "We couldn’t complete your sign in. Please try again." };
    }

    let role: UserRole = "student";
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role as UserRole;
      }
    } catch {
      role = "student";
    }

    return { ok: true, role, user: data.user, session: data.session };
  } catch {
    return { ok: false, error: "Unable to sign in right now. Please check your connection and try again." };
  }
}

/**
 * Sign in vendor with Email + Password via Supabase Auth.
 * Handles store partner authentication and vendor role resolution.
 */
export async function signVendorIn(
  email: string,
  pass: string,
): Promise<{ ok: boolean; role?: UserRole; user?: User; session?: Session; error?: string }> {
  try {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { ok: false, error: "Please enter your store email address." };
    }
    if (!pass) {
      return { ok: false, error: "Please enter your password." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: pass,
    });

    if (error) {
      const errLower = error.message?.toLowerCase() || "";
      if (errLower.includes("invalid login credentials") || errLower.includes("invalid credentials")) {
        return { ok: false, error: "Invalid email or password. Please check your credentials." };
      }
      if (errLower.includes("fetch") || errLower.includes("network") || errLower.includes("connection")) {
        return { ok: false, error: "Unable to sign in right now. Please check your connection and try again." };
      }
      return { ok: false, error: "Authentication failed. Please verify store credentials." };
    }

    if (!data.user || !data.session) {
      return { ok: false, error: "We couldn’t complete vendor authentication. Please try again." };
    }

    // Resolve the account's actual role from public.users — never
    // auto-provision a vendor row here. Vendor access must be explicitly
    // granted (by seed/migration or Super Admin), not self-assigned by
    // whoever successfully authenticates. If no profile row exists yet,
    // role is left undefined so the caller can fail closed.
    let role: UserRole | undefined;
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      role = profile?.role as UserRole | undefined;
    } catch {
      role = undefined;
    }

    return { ok: true, role, user: data.user, session: data.session };
  } catch {
    return { ok: false, error: "Unable to sign in right now. Please check your connection and try again." };
  }
}

/**
 * Sign up new student with Email + Password via Supabase Auth.
 * Role is strictly locked to 'student'.
 */
export async function signStudentUp(
  email: string,
  pass: string,
  fullName?: string,
  phone?: string,
  campusId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: fullName?.trim() || "",
        },
      },
    });

    if (authErr || !authData.user) {
      return { ok: false, error: authErr?.message ?? "Failed to create account." };
    }

    const userId = authData.user.id;

    const { error: profileErr } = await supabase.from("users").upsert({
      id: userId,
      phone: phone?.trim() || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      role: "student",
      campus_id: campusId || "a1000000-0000-0000-0000-000000000001",
    });

    if (profileErr) {
      console.error("Public users profile insertion error:", profileErr);
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error creating account." };
  }
}

/**
 * Trigger Supabase OAuth for Google Sign In.
 */
export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const redirectTo = `${origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (
        msg.includes("unsupported provider") ||
        msg.includes("not enabled") ||
        msg.includes("validation_failed")
      ) {
        return {
          ok: false,
          error: "Google Sign-In is temporarily unavailable. Please try again later.",
        };
      }
      return {
        ok: false,
        error: "We couldn’t complete Google Sign-In. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Google Sign-In is temporarily unavailable. Please try again later.",
    };
  }
}

/**
 * Requests a password reset. Goes through our own server route rather
 * than calling supabase.auth.resetPasswordForEmail() directly — that
 * client-side call would trigger Supabase's own built-in mailer
 * ("Supabase Auth" sender, "powered by Supabase" footer). Our route
 * still uses Supabase Auth's real recovery-token mechanism
 * (admin.generateLink) underneath; only the email delivery + branding
 * changes, via Resend.
 */
export async function sendPasswordResetEmail(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data || !data.ok) {
      return { ok: false, error: data?.error || "Failed to request password reset." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error requesting password reset." };
  }
}

/**
 * Update authenticated user's password.
 */
export async function updateUserPassword(
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error resetting password." };
  }
}

/**
 * Sign out current user session via Supabase Auth.
 */
export async function signStudentOut(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout error
  }
}
