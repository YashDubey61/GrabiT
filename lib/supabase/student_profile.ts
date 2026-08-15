import { createClient } from "./client";

export interface StudentProfileDetails {
  id: string;
  email: string;
  phone: string;
  role: "student";
  campusId: string;
  campusName: string;
  studentIdTag: string;
  avatarUrl: string;
  department: string;
}

export interface StudentSubscriptionDetails {
  id: string;
  userId: string;
  plan: "gold_monthly" | "gold_semester";
  status: "active" | "expired" | "cancelled";
  renewsAt: string;
  isActive: boolean;
  displayPlanName: string;
  displayValidUntil: string;
  perksSummary: string;
}

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0UC7dpD4OUKonC4W287WPg0Gnic80gYNaQUlT5JeKVdN9Qi2mZGcvFp3hdZ05VTrWmjRr-Twvu8fFinGwpcdg0gPV1peTnf5OPY7ytoGnVZ1f_q1Op19HPKnEO3X1GvKha2kWOQqpSRkpPyRjGByLCeqU7qcar10tg5xTuhvKY_nuw8tk-fA7oJzUcBXhBRktsp1XTnf94v1SNBiI-7XR0F0i1Y6PtSMwdTnJwHi4QisCMfCh7_R";

/**
 * Fetch live authenticated student profile from Supabase Auth + public.users table.
 * Enforces role === 'student' and derives identity from auth.uid().
 */
export async function getLiveStudentProfile(): Promise<StudentProfileDetails | null> {
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
    const campusName = (p.campuses as { name: string } | null)?.name ?? "PSIT Kanpur";

    return {
      id: p.id,
      email: user.email ?? "student@grabit.in",
      phone: p.phone ?? "",
      role: "student",
      campusId: p.campus_id ?? "",
      campusName,
      studentIdTag: `GRB-${p.id.slice(0, 6).toUpperCase()}`,
      avatarUrl: DEFAULT_AVATAR,
      department: "Department not set",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch live subscription status for the authenticated student.
 * Derives ownership strictly from auth.uid() and evaluates expiration date.
 */
export async function getLiveStudentSubscription(): Promise<StudentSubscriptionDetails | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return null;
    }

    const { data: subs, error: subErr } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("renews_at", { ascending: false })
      .limit(1);

    if (subErr || !subs || subs.length === 0) {
      return null;
    }

    const sub = subs[0];
    const renewsDate = new Date(sub.renews_at);
    const isNotExpired = renewsDate > new Date();
    const isActive = sub.status === "active" && isNotExpired;

    const displayPlanName =
      sub.plan === "gold_semester" ? "GrabIt Gold (Semester)" : "GrabIt Gold (Monthly)";

    const displayValidUntil = renewsDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: sub.id,
      userId: sub.user_id,
      plan: sub.plan,
      status: sub.status,
      renewsAt: sub.renews_at,
      isActive,
      displayPlanName,
      displayValidUntil,
      perksSummary: "Zero platform fees on canteen orders & priority pickup lane access.",
    };
  } catch {
    return null;
  }
}

/**
 * Perform secure student profile update via API boundary.
 */
export async function updateLiveStudentProfile(
  payload: { phone?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: "Network error updating profile" };
  }
}
