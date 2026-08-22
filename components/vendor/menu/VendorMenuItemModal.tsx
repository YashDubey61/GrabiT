"use client";

import { useRef, useState } from "react";
import type { VendorMenuItem, VendorMenuCategory } from "@/lib/mock/vendor";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_DISH_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";

/** Uploads a dish photo to the existing Supabase Storage project — the
 * same backend already used for auth/DB, not a second storage system. */
async function uploadDishImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("dish-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("dish-images").getPublicUrl(path);
  return data.publicUrl;
}

interface VendorMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<VendorMenuItem, "id"> & { id?: string }) => void;
  editingItem: VendorMenuItem | null;
  categories: VendorMenuCategory[];
}

function VendorMenuItemForm({
  editingItem,
  categories,
  onSave,
  onClose,
}: {
  editingItem: VendorMenuItem | null;
  categories: VendorMenuCategory[];
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
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl ?? "");
  const [imageUrlDraft, setImageUrlDraft] = useState(editingItem?.imageUrl ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImageError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadDishImage(file);
      setImageUrl(publicUrl);
      setImageUrlDraft(publicUrl);
    } catch {
      setImageError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (value: string) => {
    setImageUrlDraft(value);
    setImageError(null);
    if (!value.trim()) {
      setImageUrl("");
      return;
    }
    // Basic shape check — a broken <img> load below catches the rest.
    try {
      new URL(value.trim());
      setImageUrl(value.trim());
    } catch {
      setImageError("Invalid image URL");
      setImageUrl("");
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageUrlDraft("");
    setImageError(null);
  };

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
      imageUrl: imageUrl.trim() || DEFAULT_DISH_IMAGE,
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
          className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
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
            className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            {categories.map((cat) => (
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
            className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
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
          className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none resize-none"
        />
      </div>

      {/* Food Image */}
      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Food Image
        </label>
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-elevated p-3">
          {imageUrl && (
            <div className="relative h-32 w-full overflow-hidden rounded-lg bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Dish preview"
                className="h-full w-full object-cover"
                onError={() => setImageError("Invalid image URL")}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 font-display text-caption font-bold text-muted hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-faint">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <input
            type="text"
            value={imageUrlDraft}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste image URL (https://...)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
          />

          {imageError && (
            <p className="text-caption font-semibold text-danger">{imageError}</p>
          )}
        </div>
      </div>

      {/* In Stock Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated p-3">
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
  categories,
}: VendorMenuItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl animate-in fade-in">
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
          categories={categories}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
