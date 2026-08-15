"use client";

import { useEffect } from "react";

// Route-segment error boundary. Every role shell inherits this unless it
// defines its own — matches Next.js App Router's nested error-boundary model
// rather than a single global try/catch.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="font-display text-title font-800 text-foreground">
        Something went wrong.
      </p>
      <p className="max-w-sm text-caption text-muted">
        {error.message || "An unexpected error occurred. Try again."}
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-primary px-5 py-2 text-body font-600 text-on-primary transition-colors duration-150"
      >
        Try again
      </button>
    </div>
  );
}
