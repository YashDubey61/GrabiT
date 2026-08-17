import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createAdminClient(url, serviceKey);
}

// Generate GRB-XXXXXX helper for fallback in API layer
function generateGrabitIdCandidate(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "GRB-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to view your profile." },
        { status: 401 },
      );
    }

    const supabase = getSupabaseAdminClient();

    // Fetch user row from database
    const { data: userRow, error: dbErr } = await supabase
      .from("users")
      .select("id, role, full_name, phone, avatar_url, grabit_user_id, campus_id, campuses(name)")
      .eq("id", user.id)
      .maybeSingle();

    if (dbErr || !userRow) {
      return NextResponse.json(
        { ok: false, error: "Profile not found." },
        { status: 404 },
      );
    }

    // Auto-generate permanent grabit_user_id if missing
    let grabitUserId = userRow.grabit_user_id;
    if (!grabitUserId) {
      // Create permanent GRB-XXXXXX ID
      let candidate = generateGrabitIdCandidate();
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("grabit_user_id", candidate)
          .maybeSingle();
        if (!existing) break;
        candidate = generateGrabitIdCandidate();
      }
      grabitUserId = candidate;

      await supabase
        .from("users")
        .update({ grabit_user_id: grabitUserId })
        .eq("id", user.id);
    }

    const defaultAvatar =
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDp0UC7dpD4OUKonC4W287WPg0Gnic80gYNaQUlT5JeKVdN9Qi2mZGcvFp3hdZ05VTrWmjRr-Twvu8fFinGwpcdg0gPV1peTnf5OPY7ytoGnVZ1f_q1Op19HPKnEO3X1GvKha2kWOQqpSRkpPyRjGByLCeqU7qcar10tg5xTuhvKY_nuw8tk-fA7oJzUcBXhBRktsp1XTnf94v1SNBiI-7XR0F0i1Y6PtSMwdTnJwHi4QisCMfCh7_R";

    const defaultName =
      userRow.full_name?.trim() ||
      user.email?.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Grabit Customer";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campusName = (userRow.campuses as any)?.name ?? "Campus";

    return NextResponse.json({
      ok: true,
      profile: {
        id: userRow.id,
        email: user.email ?? "student@grabit.in",
        fullName: defaultName,
        phone: userRow.phone ?? "",
        avatarUrl: userRow.avatar_url || defaultAvatar,
        grabitUserId,
        campusId: userRow.campus_id ?? "",
        campusName,
        role: userRow.role,
      },
    });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error fetching profile." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseServer = await createServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabaseServer.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to update your profile." },
        { status: 401 },
      );
    }

    const payload = await request.json();

    // Security Check: Explicitly reject any attempt to modify grabit_user_id or role
    if ("grabit_user_id" in payload || "grabitUserId" in payload) {
      return NextResponse.json(
        { ok: false, error: "GRABIT User ID is permanent and cannot be modified." },
        { status: 400 },
      );
    }

    if ("role" in payload) {
      return NextResponse.json(
        { ok: false, error: "User role cannot be modified." },
        { status: 400 },
      );
    }

    // Only allow customer profile fields: full_name, phone, avatar_url
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (typeof payload.fullName === "string") {
      const trimmed = payload.fullName.trim();
      if (!trimmed) {
        return NextResponse.json(
          { ok: false, error: "Full name cannot be empty." },
          { status: 400 },
        );
      }
      updateData.full_name = trimmed;
    }

    if (typeof payload.phone === "string") {
      const phoneDigits = payload.phone.replace(/[^\d+]/g, "");
      if (payload.phone.trim() && phoneDigits.length < 7) {
        return NextResponse.json(
          { ok: false, error: "Please enter a valid phone number." },
          { status: 400 },
        );
      }
      updateData.phone = payload.phone.trim();
    }

    if (typeof payload.avatarUrl === "string") {
      updateData.avatar_url = payload.avatarUrl.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid profile fields provided for update." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select("id, full_name, phone, avatar_url, grabit_user_id")
      .single();

    if (updateErr || !updatedUser) {
      return NextResponse.json(
        { ok: false, error: "We couldn't update your profile. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      profile: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatar_url,
        grabitUserId: updatedUser.grabit_user_id,
      },
    });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't update your profile. Please try again." },
      { status: 500 },
    );
  }
}
