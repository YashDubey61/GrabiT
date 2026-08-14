"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OrderStatus } from "@/lib/types/database";

export function useRealtimeOrder(orderId: string, initialStatus?: OrderStatus) {
  const [status, setStatus] = useState<OrderStatus | undefined>(initialStatus);
  const [isDelayed, setIsDelayed] = useState<boolean>(false);

  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new) {
            setStatus(payload.new.status as OrderStatus);
            setIsDelayed(payload.new.is_delayed ?? false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { status, isDelayed };
}
