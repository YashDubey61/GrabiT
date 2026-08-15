"use client";

import { useEffect } from "react";
import { trackProductEvent, type TrackProductEventPayload } from "@/lib/analytics/events";

interface TrackEventOnMountProps {
  payload: TrackProductEventPayload;
}

export function TrackEventOnMount({ payload }: TrackEventOnMountProps) {
  useEffect(() => {
    trackProductEvent(payload);
  }, [payload]);

  return null;
}
