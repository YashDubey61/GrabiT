/**
 * Placeholder for a route whose real implementation is pending conversion
 * from its locked Stitch design. Deliberately unstyled-looking (dashed
 * frame) so it can never be mistaken for a finished screen in review.
 *
 * `stitchSource` names the exact exported folder in
 * stitch_grabit_campus_canteen_os/ that this route must be built against.
 */
export function ScreenStub({
  title,
  stitchSource,
  role,
}: {
  title: string;
  stitchSource: string;
  role: "Student" | "Vendor" | "Admin";
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 border border-dashed border-border-subtle p-8 text-center">
      <p className="text-label font-700 uppercase tracking-[0.14em] text-primary-soft">
        {role} · Route shell
      </p>
      <h1 className="font-display text-title font-800 text-foreground">
        {title}
      </h1>
      <p className="max-w-sm text-caption text-muted">
        Not yet implemented. Build against{" "}
        <code className="rounded bg-surface-elevated px-1.5 py-0.5 text-faint">
          stitch_grabit_campus_canteen_os/{stitchSource}
        </code>{" "}
        — faithfully, as real components, not an embedded iframe.
      </p>
    </div>
  );
}
