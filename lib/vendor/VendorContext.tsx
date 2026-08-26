"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  getLiveVendorContext,
  invalidateVendorContextCache,
  type LiveVendorContext,
} from "@/lib/supabase/vendor_context";
import { MOCK_VENDOR_STORE, type VendorStoreConfig } from "@/lib/mock/vendor";
import { useAuth } from "@/lib/auth/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface VendorContextValue {
  vendorContext: LiveVendorContext | null;
  canteenId: string | null;
  shopName: string | null;
  pauseStatus: { isPaused: boolean; reason: string | null } | null;
  store: VendorStoreConfig;
  isLoading: boolean;
  setStore: React.Dispatch<React.SetStateAction<VendorStoreConfig>>;
  refreshVendorContext: () => Promise<LiveVendorContext | null>;
}

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const [vendorContext, setVendorCtx] = useState<LiveVendorContext | null>(null);
  const [store, setStore] = useState<VendorStoreConfig>(MOCK_VENDOR_STORE);
  const [isLoading, setIsLoading] = useState(true);

  const refreshVendorContext = useCallback(async () => {
    if (!user || (role && role !== "vendor")) {
      setVendorCtx(null);
      setIsLoading(false);
      return null;
    }
    const ctx = await getLiveVendorContext(true);
    setVendorCtx(ctx);
    if (ctx?.shopName) {
      setStore((prev: VendorStoreConfig) => ({ ...prev, name: ctx.shopName! }));
    }
    setIsLoading(false);
    return ctx;
  }, [user, role]);

  useEffect(() => {
    let isMounted = true;

    if (!user) {
      invalidateVendorContextCache();
      /* eslint-disable react-hooks/set-state-in-effect */
      setVendorCtx(null);
      setIsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    getLiveVendorContext(false).then((ctx) => {
      if (isMounted) {
        setVendorCtx(ctx);
        if (ctx?.shopName) {
          setStore((prev: VendorStoreConfig) => ({ ...prev, name: ctx.shopName! }));
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Realtime subscription to canteen updates (name changes, pause status by superadmin)
  useEffect(() => {
    const canteenId = vendorContext?.canteenId;
    if (!canteenId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`vendor-context-realtime-${canteenId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "canteens", filter: `id=eq.${canteenId}` },
        () => {
          refreshVendorContext();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorContext?.canteenId, refreshVendorContext]);

  const value = useMemo(
    () => ({
      vendorContext,
      canteenId: vendorContext?.canteenId ?? null,
      shopName: vendorContext?.shopName ?? null,
      pauseStatus: vendorContext?.pauseStatus ?? null,
      store,
      isLoading,
      setStore,
      refreshVendorContext,
    }),
    [vendorContext, store, isLoading, refreshVendorContext]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export function useVendor() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendor must be used within a VendorProvider");
  }
  return context;
}
