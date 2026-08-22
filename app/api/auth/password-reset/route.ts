import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate_limit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side password reset request. Replaces the client-side
 * supabase.auth.resetPasswordForEmail() call (which triggers Supabase's
 * own built-in mailer, showing "Supabase Auth" as the sender) with:
 *
 *   1. admin.generateLink({ type: "recovery" }) — Supabase Auth still
 *      mints the actual secure recovery token/session server-side;
 *      nothing about that mechanism changes.
 *   2. sendPasswordResetEmail() — WE deliver the email via Resend,
 *      GrabIt-branded, using the exact action_link Supabase generated.
 *
 * Never both: this route never also calls resetPasswordForEmail(), so
 * exactly one email goes out per request.
 *
 * Always responds { ok: true } regardless of whether the email belongs
 * to a real account — this prevents account enumeration (a vendor/
 * student/admin auth page can't be used to test which emails exist).
 */
export async function POST(request: Request) {
  const generic = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, password reset instructions have been sent.",
  });

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    // Throttle per-email and per-IP independently so neither a single
    // spammed address nor a single source can exhaust the mailer, without
    // revealing which bound tripped (both paths return the same generic
    // response).
    const emailLimit = checkRateLimit(`password-reset:${email.toLowerCase()}`, 5, 15 * 60_000);
    const ipLimit = checkRateLimit(`password-reset-ip:${getClientIp(request)}`, 20, 15 * 60_000);
    if (emailLimit.limited || ipLimit.limited) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a few minutes and try again." },
        { status: 429 },
      );
    }

    const admin = getSupabaseAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl.replace(/\/$/, "")}/auth/reset-password`;

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      // Do not leak whether this failed because the account doesn't
      // exist vs. a real server error — either way, the response to
      // the caller stays generic. Log the real reason server-side only.
      console.warn("[Password Reset] generateLink failed (may be a non-existent account):", error?.message);
      return generic;
    }

    const { sendPasswordResetEmail } = await import("@/lib/email/email-service");
    const sendResult = await sendPasswordResetEmail({
      email,
      actionLink: data.properties.action_link,
    });

    if (!sendResult.ok) {
      // Email delivery failure must not surface internals to the caller,
      // and must not be treated as a reason to retry/duplicate-send here.
      console.error("[Password Reset] Email delivery failed:", sendResult.error);
    }

    return generic;
  } catch (err) {
    console.error("[Password Reset] Unexpected error:", err);
    // Still generic — an internal error must not reveal account existence
    // or leak implementation details to the client.
    return generic;
  }
}
