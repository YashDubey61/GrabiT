import { ScreenStub } from "@/components/shared/ScreenStub";
import { TrackEventOnMount } from "@/components/shared/TrackEventOnMount";

export default function StudentWalletPage() {
  return (
    <>
      <TrackEventOnMount payload={{ eventName: "wallet_viewed" }} />
      <ScreenStub
        title="Wallet"
        stitchSource="grabit_wallet_premium_black/code.html"
        role="Student"
      />
    </>
  );
}
