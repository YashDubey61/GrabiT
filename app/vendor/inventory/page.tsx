"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MOCK_VENDOR_STORE,
} from "@/lib/mock/vendor";
import { VendorHeader } from "@/components/vendor/orders/VendorHeader";
import { VendorMoreFeaturesSheet } from "@/components/vendor/orders/VendorMoreFeaturesSheet";
import { VendorMobileNavMenu } from "@/components/vendor/orders/VendorMobileNavMenu";
import { VendorProfileSheet } from "@/components/vendor/orders/VendorProfileSheet";
import { VENDOR_NAV } from "@/app/vendor/layout";
import { VendorNotificationsDrawer } from "@/components/vendor/notifications/VendorNotificationsDrawer";
import { VendorInventoryStatsCards } from "@/components/vendor/inventory/VendorInventoryStatsCards";
import { VendorInventoryTable } from "@/components/vendor/inventory/VendorInventoryTable";
import { VendorStockAdjustModal } from "@/components/vendor/inventory/VendorStockAdjustModal";
import { VendorInventoryHistoryModal } from "@/components/vendor/inventory/VendorInventoryHistoryModal";
import {
  getLiveVendorInventory,
  adjustLiveVendorStock,
  getLiveVendorInventoryLogs,
  type VendorInventoryItem,
  type InventoryLogItem,
} from "@/lib/supabase/vendor_inventory";
import {
  getLiveVendorCanteenId,
  getLiveVendorShopName,
} from "@/lib/supabase/vendor_context";
import { toggleLiveVendorMenuItemStock } from "@/lib/supabase/vendor_menu";
import { createClient } from "@/lib/supabase/client";
import { useOrderAlertSound } from "@/lib/vendor/useOrderAlertSound";

export default function VendorInventoryPage() {
  const sound = useOrderAlertSound();
  const [store, setStore] = useState(MOCK_VENDOR_STORE);
  const [items, setItems] = useState<VendorInventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isError, setIsError] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<VendorInventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const canteenIdRef = useRef<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadInventory = useCallback(async () => {
    const canteenId = canteenIdRef.current || (await getLiveVendorCanteenId());
    canteenIdRef.current = canteenId;
    const invItems = await getLiveVendorInventory(canteenId);
    setItems(invItems);
    setIsLoading(false);
  }, []);

  const loadHistoryLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    const historyLogs = await getLiveVendorInventoryLogs();
    setLogs(historyLogs);
    setIsLoadingLogs(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorShopName().then((name) => {
      if (isMounted && name) {
        setStore((prev) => ({ ...prev, name }));
      }
    });

    getLiveVendorCanteenId().then((canteenId) => {
      if (!isMounted) return;
      canteenIdRef.current = canteenId;

      loadInventory();

      if (!canteenId) return;

      channel = supabase
        .channel(`vendor-inventory-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menu_items", filter: `canteen_id=eq.${canteenId}` },
          () => {
            loadInventory();
          },
        )
        .subscribe();
    });

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadInventory]);

  // Derived Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [items]);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || item.stockStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchQuery, statusFilter, categoryFilter]);

  const handleQuickAdjust = async (itemId: string, delta: number) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const res = await adjustLiveVendorStock({
      menuItemId: itemId,
      quantityDelta: delta,
      adjustmentType: "stock_added",
      reason: `Quick restock +${delta}`,
    });

    if (res.ok) {
      showNotification(`"${target.name}" stock updated (+${delta})`);
      loadInventory();
    } else {
      showNotification(res.error ?? "Failed to adjust stock.");
    }
  };

  const handleToggleAvailability = async (itemId: string, inStock: boolean) => {
    const target = items.find((i) => i.id === itemId);
    const res = await toggleLiveVendorMenuItemStock(itemId, inStock);

    if (res.ok) {
      showNotification(
        `"${target?.name ?? "Dish"}" marked ${inStock ? "AVAILABLE" : "UNAVAILABLE"}`,
      );
      loadInventory();
    } else {
      showNotification(res.error ?? "Failed to toggle status.");
    }
  };

  const handleConfirmAdjustModal = async (payload: {
    menuItemId: string;
    quantityDelta?: number;
    exactQuantity?: number;
    adjustmentType?: string;
    reason?: string;
  }) => {
    const res = await adjustLiveVendorStock(payload);
    if (res.ok) {
      showNotification("Stock quantity updated successfully");
      loadInventory();
    } else {
      showNotification(res.error ?? "Failed to adjust stock.");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <VendorHeader
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenMoreFeatures={() => setIsMoreFeaturesOpen(true)}
        onOpenNavMenu={() => setIsNavMenuOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMobileNavMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        items={VENDOR_NAV}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VendorMoreFeaturesSheet
        isOpen={isMoreFeaturesOpen}
        onClose={() => setIsMoreFeaturesOpen(false)}
        store={store}
        onToggleStatus={() => {}}
        onChangePrepTime={() => {}}
        isSoundUnlocked={sound.isUnlocked}
        onUnlockSound={sound.unlock}
      />

      <VendorProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        store={store}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full pb-24 sm:pb-8 flex flex-col gap-6">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Title & Top Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-title font-extrabold text-foreground sm:text-display">
              Inventory Control Center
            </h1>
            <p className="text-caption text-muted">
              Stock levels, low-stock threshold alerts & real-time inventory adjustments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadHistoryLogs();
                setIsHistoryModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-4 py-3 font-display text-body-sm font-bold text-muted hover:border-primary/40 hover:text-foreground active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              Audit History
            </button>

            <button
              type="button"
              onClick={() => {
                if (items.length > 0) {
                  setSelectedItemForAdjust(items[0]);
                  setIsAdjustModalOpen(true);
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-3 font-display text-body-sm font-extrabold text-on-primary shadow-glow-primary hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Adjust Stock
            </button>
          </div>
        </div>

        {/* Inventory Statistics Dashboard */}
        <VendorInventoryStatsCards items={items} />

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-faint">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dish by name or category..."
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </div>

            {/* Stock Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Stock Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock Alert</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-caption font-bold text-muted">
                Showing <span className="text-primary">{filteredItems.length}</span> of {items.length} inventory items
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Inventory List / Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live inventory from Supabase...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-8 text-center backdrop-blur-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-muted">
              inventory_2
            </span>
            <h3 className="font-display text-body-sm font-bold text-foreground">
              {items.length === 0 ? "No products found in inventory" : "No items matching filters"}
            </h3>
            <p className="text-caption text-muted max-w-sm">
              {items.length === 0
                ? "Add dishes in Menu Management to start tracking inventory levels."
                : "Try resetting your search query or status filter."}
            </p>
            {items.length === 0 ? (
              <a
                href="/vendor/menu?add=dish"
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary"
              >
                Add Menu Dish
              </a>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 font-display text-caption font-bold text-primary underline underline-offset-4"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <VendorInventoryTable
            items={filteredItems}
            onQuickAdjust={handleQuickAdjust}
            onToggleAvailability={handleToggleAvailability}
            onOpenAdjustModal={(item) => {
              setSelectedItemForAdjust(item);
              setIsAdjustModalOpen(true);
            }}
          />
        )}
      </main>

      <VendorStockAdjustModal
        item={selectedItemForAdjust}
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setSelectedItemForAdjust(null);
        }}
        onConfirm={handleConfirmAdjustModal}
      />

      <VendorInventoryHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        logs={logs}
        isLoading={isLoadingLogs}
      />

      <VendorNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectOrder={() => {}}
      />
    </div>
  );
}
