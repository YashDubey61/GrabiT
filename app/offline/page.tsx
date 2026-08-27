import { OfflineOverlay } from "@/components/shared/OfflineOverlay";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GrabIt — You're Offline",
  description: "Looks like we lost the connection. Let's get you back online and GRABIT!",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#08080a]">
      <OfflineOverlay forceVisible={true} />
    </div>
  );
}
