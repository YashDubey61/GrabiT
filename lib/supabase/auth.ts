import { createClient } from "./client";

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

    // Explicit role guard: Reject non-student accounts (vendor / superadmin)
    if (p.role !== "student") {
      return null;
    }

    const campusName = (p.campuses as { name: string } | null)?.name ?? "PSIT Kanpur";

    return {
      id: p.id,
      email: user.email ?? "student@grabit.in",
      phone: p.phone ?? "+919999999999",
      role: "student",
      campusId: p.campus_id ?? "11111111-1111-1111-1111-111111111111",
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
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Network error signing in." };
  }
}

/**
 * Sign up new student with Email + Password via Supabase Auth.
 * Role is strictly locked to 'student'.
 */
export async function signStudentUp(
  email: string,
  pass: string,
  phone: string,
  campusId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // 1. Supabase Auth Signup
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
    });

    if (authErr || !authData.user) {
      return { ok: false, error: authErr?.message ?? "Failed to create account." };
    }

    const userId = authData.user.id;

    // 2. Insert into public.users with role = 'student' (role security enforced)
    const { error: profileErr } = await supabase.from("users").insert({
      id: userId,
      phone: phone.trim() || "+919999999999",
      role: "student",
      campus_id: campusId || "11111111-1111-1111-1111-111111111111",
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
 * Sign out current student session via Supabase Auth.
 */
export async function signStudentOut(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signout error
  }
}
