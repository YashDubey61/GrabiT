"use client";

import Image from "next/image";
import { useState } from "react";
import type { VendorMenuItem } from "@/lib/mock/vendor";

interface VendorMenuItemCardProps {
  item: VendorMenuItem;
  onToggleStock: (itemId: string, inStock: boolean) => void;
  onEditItem: (item: VendorMenuItem) => void;
  onDeleteItem?: (itemId: string) => Promise<void> | void;
  onDuplicateItem?: (item: VendorMenuItem) => void;
}

export function VendorMenuItemCard({
  item,
  onToggleStock,
  onEditItem,
  onDeleteItem,
  onDuplicateItem,
}: VendorMenuItemCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDeleteItem) return;
    setIsDeleting(true);
    await onDeleteItem(item.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="group relative rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md transition-all duration-300 hover:border-primary/40">
        <div className="flex gap-4">
          {/* Dish Thumbnail */}
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black border border-border">
            {!imgError ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                onError={() => setImgError(true)}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary bg-surface-elevated">
                <span className="material-symbols-outlined text-[32px]">
                  fastfood
                </span>
              </div>
            )}
          </div>

          {/* Dish Info & Actions */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display text-body font-bold text-foreground">
                  {item.name}
                </h4>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu(!showMenu)}
                    aria-label={`Actions for ${item.name}`}
                    className="rounded-lg p-1 text-muted hover:bg-background hover:text-foreground transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      more_vert
                    </span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-8 z-30 w-36 rounded-xl border border-border bg-surface-elevated p-1 shadow-2xl animate-in fade-in">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onEditItem(item);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-foreground hover:bg-background"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                        Edit Dish
                      </button>

                      {onDuplicateItem && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onDuplicateItem(item);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-foreground hover:bg-background"
                        >
                          <span className="material-symbols-outlined text-[16px] text-blue-400">content_copy</span>
                          Duplicate
                        </button>
                      )}

                      {onDeleteItem && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-display text-caption font-semibold text-danger hover:bg-danger/10"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="line-clamp-1 text-body-sm text-faint">
                {item.description}
              </p>

              <span className="mt-1 block font-display text-body font-bold text-primary">
                ₹{item.price.toFixed(2)}
              </span>
            </div>

            {/* Stock Availability Toggle */}
            <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2">
              <span
                className={`font-display text-[11px] font-bold uppercase tracking-wider ${
                  item.inStock ? "text-muted" : "text-danger"
                }`}
              >
                {item.inStock ? "In Stock" : "Out of Stock"}
              </span>

              <button
                type="button"
                onClick={() => onToggleStock(item.id, !item.inStock)}
                aria-label={`Toggle stock status for ${item.name}`}
                className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                  item.inStock ? "bg-primary" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    item.inStock ? "right-0.5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </div>
            <h3 className="font-display text-heading font-extrabold text-foreground">
              Delete "{item.name}"?
            </h3>
            <p className="mt-1 font-body text-caption text-faint">
              This action will remove the dish from both Vendor & Student menus.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl border border-border bg-surface-elevated py-3 font-display text-caption font-bold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-xl bg-danger py-3 font-display text-caption font-bold uppercase tracking-wider text-white shadow-lg shadow-danger/20 hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
