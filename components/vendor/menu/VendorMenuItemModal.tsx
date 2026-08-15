"use client";

import { useState } from "react";
import type { VendorMenuItem, VendorMenuCategory } from "@/lib/mock/vendor";

interface VendorMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<VendorMenuItem, "id"> & { id?: string }) => void;
  editingItem: VendorMenuItem | null;
}

const CATEGORY_OPTIONS: VendorMenuCategory[] = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
];

function VendorMenuItemForm({
  editingItem,
  onSave,
  onClose,
}: {
  editingItem: VendorMenuItem | null;
  onSave: (itemData: Omit<VendorMenuItem, "id"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingItem?.name ?? "");
  const [description, setDescription] = useState(editingItem?.description ?? "");
  const [price, setPrice] = useState(editingItem ? String(editingItem.price) : "150");
  const [category, setCategory] = useState<VendorMenuCategory>(
    editingItem?.category ?? "Lunch",
  );
  const [inStock, setInStock] = useState(editingItem?.inStock ?? true);
  const [imageUrl] = useState(
    editingItem?.imageUrl ??
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHC2GhE_iQMXpe1jyJzNZXIVZtfOw5_avgsE_jHg3qts46VulvQYn2vMPunxFwdI0DAF8vN-oMcUoo4tzUtukppl2g-FMVdl9Mj3UI9ODriqXkCtj-XCogYB20L9XwjUSEka0pc3PhJi-VfSgPur4B-wshceDf3KBR3ReWsEizsBZ6zRCNu1wT199gbGqay_JenKSI2AyWn10PzxNLteTLpf8w3N1Df-0uPOKrFuFG-rSxLSCcOtXI",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || isNaN(Number(price))) return;

    onSave({
      id: editingItem?.id,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      inStock,
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Dish Name */}
      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Dish Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Masala Dosa"
          className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Category & Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as VendorMenuCategory)}
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Price (₹)
          </label>
          <input
            type="number"
            required
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150"
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Description
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of ingredients..."
          className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none resize-none"
        />
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-[#1e1f26] p-3">
        <span className="font-display text-caption font-bold text-foreground">
          Availability Status
        </span>
        <div className="flex items-center gap-2">
          <span className="text-caption text-faint">
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
          <button
            type="button"
            onClick={() => setInStock(!inStock)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
              inStock ? "bg-primary" : "bg-border"
            }`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                inStock ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Submit Actions */}
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border py-3 font-display text-body-sm font-bold text-muted hover:bg-surface-elevated hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-primary py-3 font-display text-body-sm font-bold text-on-primary shadow-lg hover:opacity-90 active:scale-[0.98]"
        >
          {editingItem ? "Save Changes" : "Add Dish"}
        </button>
      </div>
    </form>
  );
}

export function VendorMenuItemModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
}: VendorMenuItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-[#121212] p-6 shadow-2xl animate-in fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-title font-bold text-foreground">
            {editingItem ? "Edit Dish" : "Add New Dish"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <VendorMenuItemForm
          key={editingItem?.id ?? "new_item"}
          editingItem={editingItem}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
