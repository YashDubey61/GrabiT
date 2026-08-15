import { ScreenStub } from "@/components/shared/ScreenStub";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";

export default function StudentProfilePage() {
  return (
    <>
      <TrackEventOnMount payload={{ eventName: "gold_plan_viewed" }} />
      <ScreenStub
        title="Profile"
        stitchSource="grabit_profile_premium_black/code.html"
        role="Student"
      />
    </>
  );
}
