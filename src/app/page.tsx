import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center animate-fade-in">
        <h1 className="text-5xl font-bold tracking-tight mb-2">
          Grab<span className="text-accent">It</span>
        </h1>
        <p className="text-text-secondary text-sm mb-12">
          Campus canteen pre-order & pickup
        </p>

        <div className="space-y-3">
          <Link
            href="/app/login"
            className="
              block w-full rounded-2xl bg-accent px-6 py-4
              text-bg font-semibold text-base
              hover:bg-accent-dim active:scale-[0.98]
              transition-all duration-200
              shadow-[0_8px_32px_rgba(255,109,0,0.25)]
            "
          >
            I&apos;m a Student
          </Link>
          <Link
            href="/vendor/login"
            className="
              block w-full rounded-2xl border border-border bg-surface px-6 py-4
              text-text font-semibold text-base
              hover:bg-surface-2 active:scale-[0.98]
              transition-all duration-200
            "
          >
            Vendor Login
          </Link>
          <Link
            href="/admin/login"
            className="
              block w-full text-center text-sm text-text-muted py-2
              hover:text-text-secondary transition-colors
            "
          >
            Admin Panel →
          </Link>
        </div>
      </div>
    </div>
  );
}
