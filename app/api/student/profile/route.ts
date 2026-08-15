import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to view your profile." },
        { status: 401 },
      );
    }

    // Role Guard & Own-ID Isolation: auth.uid() strictly enforced
    const { data: profiles, error: profileErr } = await supabase
      .from("users")
      .select("*, campuses(name, city)")
      .eq("id", user.id)
      .eq("role", "student")
      .limit(1);

    if (profileErr || !profiles || profiles.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Student profile not found or role forbidden." },
        { status: 403 },
      );
    }

    const p = profiles[0];
    const campusName = (p.campuses as { name: string } | null)?.name ?? "PSIT Kanpur";

    // Fetch live subscription for user
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("renews_at", { ascending: false })
      .limit(1);

    let subscription = null;
    if (subs && subs.length > 0) {
      const sub = subs[0];
      const renewsDate = new Date(sub.renews_at);
      const isNotExpired = renewsDate > new Date();
      const isActive = sub.status === "active" && isNotExpired;

      subscription = {
        id: sub.id,
        userId: sub.user_id,
        plan: sub.plan,
        status: sub.status,
        renewsAt: sub.renews_at,
        isActive,
        displayPlanName:
          sub.plan === "gold_semester" ? "GrabIt Gold (Semester)" : "GrabIt Gold (Monthly)",
        displayValidUntil: renewsDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        perksSummary: "Zero platform fees on canteen orders & priority pickup lane access.",
      };
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: p.id,
        email: user.email ?? "student@grabit.in",
        phone: p.phone ?? "",
        role: "student",
        campusId: p.campus_id ?? "",
        campusName,
        studentIdTag: `GRB-${p.id.slice(0, 6).toUpperCase()}`,
        avatarUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0UC7dpD4OUKonC4W287WPg0Gnic80gYNaQUlT5JeKVdN9Qi2mZGcvFp3hdZ05VTrWmjRr-Twvu8fFinGwpcdg0gPV1peTnf5OPY7ytoGnVZ1f_q1Op19HPKnEO3X1GvKha2kWOQqpSRkpPyRjGByLCeqU7qcar10tg5xTuhvKY_nuw8tk-fA7oJzUcBXhBRktsp1XTnf94v1SNBiI-7XR0F0i1Y6PtSMwdTnJwHi4QisCMfCh7_R",
        department: "Department not set",
      },
      subscription,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Profile information could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to update your profile." },
        { status: 401 },
      );
    }

    // Role Guard: Reject non-students
    const { data: profiles } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .limit(1);

    if (!profiles || profiles.length === 0 || profiles[0].role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Access denied. Only students can perform profile updates." },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Security Check: Block attempts to mutate role, id, campus_id, or spoof student_id
    if (body.role || body.id || body.campus_id || body.student_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized modifications (role, id, campus_id cannot be changed).",
        },
        { status: 400 },
      );
    }

    const updates: { phone?: string } = {};
    if (typeof body.phone === "string") {
      updates.phone = body.phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid editable fields provided." },
        { status: 400 },
      );
    }

    const { error: updateErr } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .eq("role", "student");

    if (updateErr) {
      return NextResponse.json(
        { ok: false, error: "Unable to update profile. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Profile updated successfully." });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to update profile. Please try again." },
      { status: 500 },
    );
  }
}
