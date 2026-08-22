"use client";

import { useState } from "react";
import type { VendorCategory } from "@/lib/supabase/vendor_categories";

interface VendorCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: VendorCategory[];
  onChanged: () => void;
}

export function VendorCategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onChanged,
}: VendorCategoryManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VendorCategory | null>(null);
  const [dishCount, setDishCount] = useState(0);
  const [moveTo, setMoveTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/vendor/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Unable to add category.");
        return;
      }
      setNewName("");
      onChanged();
    } finally {
      setIsBusy(false);
    }
  };

  const handleRename = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Unable to rename category.");
        return;
      }
      setEditingId(null);
      onChanged();
    } finally {
      setIsBusy(false);
    }
  };

  const startDelete = async (category: VendorCategory) => {
    setError(null);
    const res = await fetch(`/api/vendor/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok && data.error === "DISHES_ASSIGNED") {
      setDeleteTarget(category);
      setDishCount(data.dishCount ?? 0);
      setMoveTo(categories.find((c) => c.id !== category.id)?.name ?? "");
      return;
    }
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Unable to delete category.");
      return;
    }
    onChanged();
  };

  const confirmDelete = async (moveDishes: boolean) => {
    if (!deleteTarget) return;
    setIsBusy(true);
    setError(null);
    try {
      const url = moveDishes
        ? `/api/vendor/categories/${deleteTarget.id}?moveTo=${encodeURIComponent(moveTo)}`
        : `/api/vendor/categories/${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Unable to delete category.");
        return;
      }
      setDeleteTarget(null);
      onChanged();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-title font-bold text-foreground">Manage Categories</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-faint hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {deleteTarget ? (
          <div className="flex flex-col gap-3">
            <p className="font-display text-body-sm font-bold text-foreground">
              Delete &quot;{deleteTarget.name}&quot;?
            </p>
            <p className="text-caption text-muted">
              Dishes currently using this category: <span className="font-bold text-foreground">{dishCount}</span>
            </p>
            {dishCount > 0 && (
              <>
                <p className="text-caption text-muted">What should happen to them?</p>
                <select
                  value={moveTo}
                  onChange={(e) => setMoveTo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface-elevated p-2.5 text-body-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id !== deleteTarget.id)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  disabled={isBusy || !moveTo}
                  onClick={() => confirmDelete(true)}
                  className="rounded-xl bg-primary py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                >
                  Move dishes to &quot;{moveTo}&quot; &amp; delete
                </button>
              </>
            )}
            {dishCount === 0 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => confirmDelete(false)}
                className="rounded-xl bg-danger py-2.5 font-display text-caption font-bold text-white disabled:opacity-50"
              >
                Delete Category
              </button>
            )}
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-border py-2.5 font-display text-caption font-bold text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-elevated p-2.5"
                >
                  {editingId === cat.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(cat.id)}
                      className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-surface px-2 py-1 text-body-sm text-foreground focus:outline-none"
                    />
                  ) : (
                    <span className="text-body-sm font-semibold text-foreground">{cat.name}</span>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    {editingId === cat.id ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRename(cat.id)}
                        className="rounded-lg p-1.5 text-primary hover:bg-primary/10"
                        aria-label="Save"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startDelete(cat)}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="mt-3 text-caption font-semibold text-danger">{error}</p>}

            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Chinese Specials"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated p-2.5 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                disabled={isBusy || !newName.trim()}
                onClick={handleAdd}
                className="shrink-0 rounded-xl bg-primary px-4 font-display text-caption font-extrabold text-on-primary disabled:opacity-50"
              >
                + Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
