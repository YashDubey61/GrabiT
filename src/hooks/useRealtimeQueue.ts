"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeQueue(canteenId: string, onNewOrder?: () => void) {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!canteenId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`vendor-queue-${canteenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `canteen_id=eq.${canteenId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" && onNewOrder) {
            onNewOrder();
          }
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canteenId, onNewOrder]);

  return { lastUpdate };
}
