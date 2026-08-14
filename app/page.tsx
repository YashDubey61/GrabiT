import Link from "next/link";

// Temporary entry point. Once Supabase Auth + role claims are wired up (Day 2+),
// this becomes a server-side redirect to /student, /vendor, or /superadmin
// based on session role — never a client-side role check. For now it's an
// honest stub, not a fake "signed in" state.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div>
        <p className="text-label font-700 uppercase tracking-[0.14em] text-primary-soft">
          Canteen OS
        </p>
        <h1 className="mt-2 font-display text-display font-900 text-foreground">
          GrabIt
        </h1>
        <p className="mt-3 max-w-sm text-body text-muted">
          When hunger hits, GrabIt. Engineering foundation — role entry points
          below are structural shells, not signed-in experiences yet.
        </p>
      </div>
      <nav className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/student"
          className="rounded-full bg-primary px-5 py-2.5 text-body font-600 text-on-primary"
        >
          Student
        </Link>
        <Link
          href="/vendor"
          className="rounded-full border border-border px-5 py-2.5 text-body font-600 text-foreground"
        >
          Vendor
        </Link>
        <Link
          href="/superadmin"
          className="rounded-full border border-border px-5 py-2.5 text-body font-600 text-foreground"
        >
          Super Admin
        </Link>
      </nav>
    </main>
  );
}
