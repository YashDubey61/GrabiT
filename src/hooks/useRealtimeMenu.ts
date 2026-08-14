"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeMenu(canteenId: string) {
  const [lastMenuUpdate, setLastMenuUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (!canteenId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`menu-updates-${canteenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu_items",
          filter: `canteen_id=eq.${canteenId}`,
        },
        () => {
          setLastMenuUpdate(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canteenId]);

  return { lastMenuUpdate };
}
