"use client";

import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { type VendorMenuItem } from "@/lib/mock/vendor";
import { VendorMenuHeader } from "@/components/vendor/menu/VendorMenuHeader";
import {
  VendorMenuCategoryChips,
  type CategoryFilterOption,
} from "@/components/vendor/menu/VendorMenuCategoryChips";
import { VendorMenuItemCard } from "@/components/vendor/menu/VendorMenuItemCard";
import { VendorMenuItemModal } from "@/components/vendor/menu/VendorMenuItemModal";
import { VendorMenuStatsCards } from "@/components/vendor/menu/VendorMenuStatsCards";
import {
  addLiveVendorMenuItem,
  deleteLiveVendorMenuItem,
  getLiveVendorMenuItems,
  toggleLiveVendorMenuItemStock,
  updateLiveVendorMenuItem,
} from "@/lib/supabase/vendor_menu";
import { getLiveVendorCanteenId } from "@/lib/supabase/vendor_context";
import { getLiveVendorCategories, type VendorCategory } from "@/lib/supabase/vendor_categories";
import { VendorCategoryManagerModal } from "@/components/vendor/menu/VendorCategoryManagerModal";
import { createClient } from "@/lib/supabase/client";

export default function VendorMenuManagementPage() {
  return (
    <Suspense fallback={null}>
      <VendorMenuManagementPageInner />
    </Suspense>
  );
}

function VendorMenuManagementPageInner() {
  const [menuItems, setMenuItems] = useState<VendorMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterOption>("All Items");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorMenuItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [categoryRows, setCategoryRows] = useState<VendorCategory[]>([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  const canteenIdRef = useRef<string | null>(null);

  const categories = useMemo(() => {
    const fromRows = categoryRows.map((c) => c.name.trim()).filter(Boolean);
    const fromItems = menuItems.map((i) => (i.category || "").trim()).filter(Boolean);
    const set = new Set<string>();

    for (const cat of [...fromRows, ...fromItems]) {
      if (cat && !Array.from(set).some((existing) => existing.toLowerCase() === cat.toLowerCase())) {
        set.add(cat);
      }
    }

    const combined = Array.from(set);
    return combined.length > 0 ? combined : ["Breakfast", "Lunch", "Snacks", "Beverages"];
  }, [categoryRows, menuItems]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMenuItems = useCallback(async () => {
    const canteenId = canteenIdRef.current || (await getLiveVendorCanteenId());
    canteenIdRef.current = canteenId;
    const items = await getLiveVendorMenuItems(canteenId);
    setMenuItems(items);
    setIsLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const live = await getLiveVendorCategories();
    setCategoryRows(live);
  }, []);

  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    const supabase = createClient();

    getLiveVendorCanteenId().then((canteenId) => {
      if (!isMounted) return;
      canteenIdRef.current = canteenId;

      loadMenuItems();
      loadCategories();

      if (!canteenId) return;

      channel = supabase
        .channel(`vendor-menu-realtime-${canteenId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menu_items", filter: `canteen_id=eq.${canteenId}` },
          () => {
            loadMenuItems();
          },
        )
        .subscribe();
    });

    if (searchParams.get("manage") === "categories") {
      setIsCategoryManagerOpen(true);
    }
    if (searchParams.get("add") === "dish") {
      setEditingItem(null);
      setIsModalOpen(true);
    }

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadMenuItems, loadCategories, searchParams]);

  const handleToggleStock = async (itemId: string, inStock: boolean) => {
    const targetItem = menuItems.find((i) => i.id === itemId);
    const res = await toggleLiveVendorMenuItemStock(itemId, inStock);

    if (res.ok) {
      showNotification(
        `"${targetItem?.name ?? "Dish"}" marked ${inStock ? "IN STOCK" : "OUT OF STOCK"}`,
      );
      loadMenuItems();
    } else {
      showNotification(res.error ?? "Failed to update availability.");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const targetItem = menuItems.find((i) => i.id === itemId);
    const res = await deleteLiveVendorMenuItem(itemId);

    if (res.ok) {
      showNotification(`"${targetItem?.name ?? "Dish"}" deleted from menu.`);
      loadMenuItems();
    } else {
      showNotification(res.error ?? "Failed to delete menu item.");
    }
  };

  const handleDuplicateItem = async (item: VendorMenuItem) => {
    const res = await addLiveVendorMenuItem({
      name: `${item.name} (Copy)`,
      price: item.price,
      category: item.category,
      description: item.description,
      inStock: item.inStock,
      imageUrl: item.imageUrl,
    });

    if (res.ok) {
      showNotification(`"${item.name} (Copy)" created.`);
      loadMenuItems();
    } else {
      showNotification(res.error ?? "Failed to duplicate item.");
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: VendorMenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (
    itemData: Omit<VendorMenuItem, "id"> & { id?: string },
  ) => {
    if (itemData.id) {
      // Editing existing item
      const res = await updateLiveVendorMenuItem(itemData.id, itemData);
      if (res.ok) {
        showNotification(`"${itemData.name}" updated successfully`);
        loadMenuItems();
      } else {
        showNotification(res.error ?? "Failed to update dish.");
      }
    } else {
      // Adding new item
      const res = await addLiveVendorMenuItem(itemData);
      if (res.ok) {
        showNotification(`"${itemData.name}" added to menu successfully`);
        loadMenuItems();
      } else {
        showNotification(res.error ?? "Failed to add dish.");
      }
    }
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Items" ||
        (item.category || "").toLowerCase() === selectedCategory.toLowerCase();

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" ? item.inStock : !item.inStock);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [menuItems, searchQuery, selectedCategory, availabilityFilter]);

  // Grouped items by category for rendering sections
  const groupedCategories = useMemo(() => {
    const groups: { category: string; items: VendorMenuItem[] }[] = [];

    for (const cat of categories) {
      const itemsForCat = filteredItems.filter(
        (i) => (i.category || "").toLowerCase() === cat.toLowerCase(),
      );
      if (itemsForCat.length > 0) {
        groups.push({ category: cat, items: itemsForCat });
      }
    }

    // Safety net for orphan items
    const groupedItemIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    const orphanItems = filteredItems.filter((i) => !groupedItemIds.has(i.id));
    if (orphanItems.length > 0) {
      groups.push({ category: "Other", items: orphanItems });
    }

    return groups;
  }, [filteredItems, categories]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All Items");
    setAvailabilityFilter("all");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full pb-24">
        {notification && (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Header & Search */}
        <VendorMenuHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNewItem={handleOpenAddModal}
        />

        {/* Menu Statistics Cards */}
        <VendorMenuStatsCards
          items={menuItems}
          categoriesCount={categories.length}
        />

        {/* Filter Controls Row */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <VendorMenuCategoryChips
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <div className="flex items-center gap-2">
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as "all" | "available" | "unavailable")}
                className="rounded-full border border-border bg-surface-elevated px-3 py-2 font-display text-caption font-bold text-muted focus:border-primary focus:outline-none"
              >
                <option value="all">All Availability</option>
                <option value="available">In Stock</option>
                <option value="unavailable">Out of Stock</option>
              </select>

              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(true)}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Manage Categories
              </button>
            </div>
          </div>

          {(searchQuery || selectedCategory !== "All Items" || availabilityFilter !== "all") && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-caption font-bold text-muted">
                Showing <span className="text-primary">{filteredItems.length}</span> of {menuItems.length} dishes
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 font-display text-caption font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Reset filters
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live menu items from Supabase...</p>
          </div>
        ) : groupedCategories.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated/70 p-8 text-center backdrop-blur-md flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-muted">
              restaurant_menu
            </span>
            <h3 className="font-display text-body-sm font-bold text-foreground">
              {menuItems.length === 0 ? "No items in your menu catalog" : "No dishes found matching your search or filters"}
            </h3>
            <p className="text-caption text-muted max-w-sm">
              {menuItems.length === 0
                ? "Start adding your dishes to make them available for students to order."
                : "Try adjusting your search term, category, or stock availability filter."}
            </p>
            {menuItems.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary shadow-glow-primary"
              >
                Add Your First Item
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-1 font-display text-caption font-bold text-primary underline underline-offset-4 hover:text-primary-soft"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {groupedCategories.map((group) => (
              <section key={group.category} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-1.5 rounded-full bg-primary" />
                  <h3 className="font-display text-title font-bold text-foreground">
                    {group.category}
                  </h3>
                  <span className="font-display text-caption text-faint">
                    ({group.items.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {group.items.map((item) => (
                    <VendorMenuItemCard
                      key={item.id}
                      item={item}
                      onToggleStock={handleToggleStock}
                      onEditItem={handleOpenEditModal}
                      onDeleteItem={handleDeleteItem}
                      onDuplicateItem={handleDuplicateItem}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <VendorMenuItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          editingItem={editingItem}
          categories={categories}
        />

        <VendorCategoryManagerModal
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          categories={categoryRows}
          onChanged={() => {
            loadCategories();
            loadMenuItems();
          }}
        />
      </main>
    </div>
  );
}
