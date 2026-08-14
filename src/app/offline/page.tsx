import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <span className="text-6xl mb-4">📡</span>
      <h1 className="text-2xl font-bold tracking-tight text-text">You&apos;re Offline</h1>
      <p className="text-sm text-text-secondary max-w-xs mt-2 mb-6">
        Please check your internet connection to continue browsing campus canteens and placing orders.
      </p>
      <Link
        href="/app"
        className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-bg hover:bg-accent-dim transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}
