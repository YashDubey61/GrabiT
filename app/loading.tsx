// Root-level loading UI. Each role shell overrides this with a context-specific
// skeleton once real data-fetching lands — this is the fallback only.
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}
