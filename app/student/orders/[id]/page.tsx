import { ScreenStub } from "@/components/shared/ScreenStub";

export default async function StudentTrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ScreenStub
      title={`Track Order — #${id}`}
      stitchSource="grabit_track_order_premium_black/code.html"
      role="Student"
    />
  );
}
