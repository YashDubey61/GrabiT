"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type VendorMenuItem,
  type VendorMenuCategory,
} from "@/lib/mock/vendor";
import { VendorMenuHeader } from "@/components/vendor/menu/VendorMenuHeader";
import {
  VendorMenuCategoryChips,
  type CategoryFilterOption,
} from "@/components/vendor/menu/VendorMenuCategoryChips";
import { VendorMenuItemCard } from "@/components/vendor/menu/VendorMenuItemCard";
import { VendorMenuItemModal } from "@/components/vendor/menu/VendorMenuItemModal";
import {
  addLiveVendorMenuItem,
  getLiveVendorMenuItems,
  toggleLiveVendorMenuItemStock,
  updateLiveVendorMenuItem,
} from "@/lib/supabase/vendor_menu";
import { getLiveVendorCanteenId } from "@/lib/supabase/vendor_context";

const CATEGORIES: VendorMenuCategory[] = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
];

export default function VendorMenuManagementPage() {
  const [menuItems, setMenuItems] = useState<VendorMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilterOption>("All Items");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorMenuItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadMenuItems = async () => {
    setIsLoading(true);
    const canteenId = await getLiveVendorCanteenId();
    const items = await getLiveVendorMenuItems(canteenId);
    setMenuItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMenuItems();
  }, []);

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
        selectedCategory === "All Items" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Grouped items by category for rendering sections
  const groupedCategories = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      items: filteredItems.filter((i) => i.category === cat),
    })).filter((group) => group.items.length > 0);
  }, [filteredItems]);

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

        {/* Category Filter Chips */}
        <VendorMenuCategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
              progress_activity
            </span>
            <p className="text-body-sm text-muted">Loading live menu items from Supabase...</p>
          </div>
        ) : groupedCategories.length === 0 ? (
          <div className="rounded-2xl border border-border bg-[#1e1f26]/50 p-8 text-center backdrop-blur-md">
            <p className="text-body-sm text-muted">
              No dishes found matching your search or category selection.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Items");
              }}
              className="mt-3 font-display text-caption font-bold text-primary underline underline-offset-4 hover:text-primary-soft"
            >
              Reset filters
            </button>
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
        />
      </main>
    </div>
  );
}
