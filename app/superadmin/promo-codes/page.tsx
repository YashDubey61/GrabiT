"use client";

import { useCallback, useEffect, useState } from "react";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "PERCENTAGE" | "FLAT";
  discount_value: number;
  max_discount: number | null;
  min_order_value: number;
  usage_limit: number | null;
  per_user_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  is_published: boolean;
  campus_id: string | null;
  canteen_id: string | null;
  campusName: string | null;
  canteenName: string | null;
  usageCount: number;
  created_at: string;
}

interface Option {
  id: string;
  name: string;
}

interface CampusApiResponse {
  ok: boolean;
  campuses?: Option[];
  data?: {
    campuses?: Option[];
  };
  error?: string;
}

interface VendorItem {
  id: string;
  name: string;
}

interface VendorApiResponse {
  ok: boolean;
  vendors?: VendorItem[];
  data?: {
    vendors?: VendorItem[];
  };
  error?: string;
}

interface PromoCodesApiResponse {
  ok: boolean;
  promoCodes?: PromoCode[];
  data?: {
    promoCodes?: PromoCode[];
  };
  error?: string;
}

type FilterTab = "all" | "active" | "inactive" | "expired" | "published";

const emptyForm = {
  code: "",
  description: "",
  discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
  discountValue: "",
  maxDiscount: "",
  minOrderValue: "0",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  campusId: "",
  canteenId: "",
  isActive: true,
  isPublished: true,
};

function isExpired(p: PromoCode): boolean {
  return Boolean(p.expires_at && new Date(p.expires_at) < new Date());
}

export default function SuperAdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [campuses, setCampuses] = useState<Option[]>([]);
  const [canteens, setCanteens] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [notification, setNotification] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadPromoCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/promo-codes");
      const payload: PromoCodesApiResponse = await res.json().catch(() => ({ ok: false }));
      if (res.ok && payload.ok) {
        const list = payload.promoCodes ?? payload.data?.promoCodes;
        setPromoCodes(Array.isArray(list) ? list : []);
      } else {
        showNotification(payload.error ?? "Failed to load promo codes.");
        setPromoCodes([]);
      }
    } catch (err) {
      console.error("Failed to load promo codes:", err);
      setPromoCodes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCampuses = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/campuses");
      const payload: CampusApiResponse = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !payload.ok) {
        console.warn("Campus API request returned non-ok status or payload:", payload.error || res.statusText);
        setCampuses([]);
        return;
      }
      const rawList = payload.campuses ?? payload.data?.campuses;
      const validCampuses = Array.isArray(rawList)
        ? rawList
            .filter((c): c is Option => Boolean(c && typeof c.id === "string" && typeof c.name === "string"))
            .map((c) => ({ id: c.id, name: c.name }))
        : [];
      setCampuses(validCampuses);
    } catch (err) {
      console.error("Failed to load campuses:", err);
      setCampuses([]);
    }
  }, []);

  const loadCanteens = useCallback(async () => {
    try {
      const res = await fetch("/api/superadmin/vendor-management");
      const payload: VendorApiResponse = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !payload.ok) {
        console.warn("Vendor API request returned non-ok status or payload:", payload.error || res.statusText);
        setCanteens([]);
        return;
      }
      const rawVendors = payload.vendors ?? payload.data?.vendors;
      const validCanteens = Array.isArray(rawVendors)
        ? rawVendors
            .filter((v): v is VendorItem => Boolean(v && typeof v.id === "string" && typeof v.name === "string"))
            .map((v) => ({ id: v.id, name: v.name }))
        : [];
      setCanteens(validCanteens);
    } catch (err) {
      console.error("Failed to load canteens:", err);
      setCanteens([]);
    }
  }, []);

  useEffect(() => {
    loadPromoCodes();
    loadCampuses();
    loadCanteens();
  }, [loadPromoCodes, loadCampuses, loadCanteens]);

  const filteredPromoCodes = promoCodes.filter((p) => {
    const matchesSearch = !search.trim() || p.code.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? p.is_active && !isExpired(p)
          : filter === "inactive"
            ? !p.is_active
            : filter === "expired"
              ? isExpired(p)
              : p.is_published;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditingId(null);
  };

  const openEdit = (p: PromoCode) => {
    setForm({
      code: p.code,
      description: p.description ?? "",
      discountType: p.discount_type,
      discountValue: String(p.discount_value),
      maxDiscount: p.max_discount !== null ? String(p.max_discount) : "",
      minOrderValue: String(p.min_order_value),
      usageLimit: p.usage_limit !== null ? String(p.usage_limit) : "",
      perUserLimit: String(p.per_user_limit),
      startsAt: p.starts_at ? p.starts_at.slice(0, 16) : "",
      expiresAt: p.expires_at ? p.expires_at.slice(0, 16) : "",
      campusId: p.campus_id ?? "",
      canteenId: p.canteen_id ?? "",
      isActive: p.is_active,
      isPublished: p.is_published,
    });
    setEditingId(p.id);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const buildPayload = () => ({
    code: form.code,
    description: form.description,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
    minOrderValue: Number(form.minOrderValue || 0),
    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    perUserLimit: Number(form.perUserLimit || 1),
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
    campusId: form.campusId || null,
    canteenId: form.canteenId || null,
    isActive: form.isActive,
    isPublished: form.isPublished,
  });

  const handleSave = async () => {
    setFormError(null);
    setIsSaving(true);
    try {
      const url = editingId ? `/api/superadmin/promo-codes/${editingId}` : "/api/superadmin/promo-codes";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Network or server response error." }));
      if (!res.ok || !data.ok) {
        setFormError(data.error ?? "Unable to save promo code.");
        return;
      }
      showNotification(editingId ? "Promo code updated." : `Promo code "${form.code.toUpperCase()}" created.`);
      setIsCreateOpen(false);
      resetForm();
      loadPromoCodes();
    } catch (err: any) {
      setFormError(err?.message || "Unable to save promo code.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (p: PromoCode, field: "isActive" | "isPublished") => {
    const key = field === "isActive" ? "is_active" : "is_published";
    try {
      const res = await fetch(`/api/superadmin/promo-codes/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !p[key as keyof PromoCode] }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Network or server response error." }));
      if (!res.ok || !data.ok) {
        showNotification(data.error ?? "Unable to update promo code.");
        return;
      }
      loadPromoCodes();
    } catch (err: any) {
      showNotification(err?.message || "Unable to update promo code.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/superadmin/promo-codes/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({ ok: false, error: "Network or server response error." }));
      if (!res.ok || !data.ok) {
        showNotification(data.error ?? "Unable to delete promo code.");
        return;
      }
      showNotification(`Promo code "${deleteTarget.code}" deleted.`);
      setDeleteTarget(null);
      loadPromoCodes();
    } catch (err: any) {
      showNotification(err?.message || "Unable to delete promo code.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-heading-lg font-900 tracking-tight text-foreground">Promo Codes</h1>
            <p className="mt-1 text-body-sm text-muted">Create and manage student checkout discount codes.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create Promo Code
          </button>
        </div>

        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary">{notification}</div>
        )}

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code..."
          className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          {(["all", "active", "inactive", "expired", "published"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 font-display text-caption font-bold capitalize transition-all ${
                filter === f ? "bg-primary text-on-primary" : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-body-sm text-muted">Loading promo codes...</p>
        ) : filteredPromoCodes.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted">No promo codes found.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
            <table className="w-full text-left text-body">
              <thead>
                <tr className="border-b border-border text-label font-bold text-muted uppercase">
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-semibold">
                {filteredPromoCodes.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className="p-3">
                      <p className="font-display font-800 text-primary">{p.code}</p>
                      {p.description && <p className="text-[11px] font-normal text-faint">{p.description}</p>}
                      {(p.campusName || p.canteenName) && (
                        <p className="text-[10px] font-normal text-faint">{[p.campusName, p.canteenName].filter(Boolean).join(" · ")}</p>
                      )}
                    </td>
                    <td className="p-3 text-caption">
                      {p.discount_type === "PERCENTAGE" ? `${p.discount_value}%` : `₹${p.discount_value}`}
                      {p.max_discount && <span className="text-faint"> (max ₹{p.max_discount})</span>}
                      <p className="text-[10px] text-faint">Min ₹{p.min_order_value}</p>
                    </td>
                    <td className="p-3 text-caption">
                      {p.usageCount}
                      {p.usage_limit ? ` / ${p.usage_limit}` : ""}
                      <p className="text-[10px] text-faint">{p.per_user_limit}/user</p>
                    </td>
                    <td className="p-3 text-caption text-muted">
                      {p.expires_at ? new Date(p.expires_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "No expiry"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggle(p, "isActive")}
                          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            p.is_active ? "border border-success/30 bg-success/5 text-success" : "border border-border text-muted"
                          }`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(p, "isPublished")}
                          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            p.is_published ? "border border-primary/30 bg-primary/5 text-primary" : "border border-border text-muted"
                          }`}
                        >
                          {p.is_published ? "Published" : "Unpublished"}
                        </button>
                        {isExpired(p) && <span className="w-fit rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-destructive">Expired</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(p)} className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-foreground">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg border border-danger/30 px-2.5 py-1 text-[11px] font-bold text-danger hover:bg-danger-soft"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-title font-bold text-foreground">{editingId ? "Edit Promo Code" : "Create Promo Code"}</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close">
                <span className="material-symbols-outlined text-[20px] text-faint">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Code (e.g. WELCOME50)"
                className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm font-bold uppercase text-foreground placeholder:text-faint placeholder:normal-case focus:border-primary focus:outline-none"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as "PERCENTAGE" | "FLAT" })}
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FLAT">Flat ₹</option>
                </select>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "PERCENTAGE" ? "Discount %" : "Discount ₹"}
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  placeholder="Max discount ₹ (optional)"
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="Minimum order value ₹"
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Usage limit (optional)"
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
                <input
                  type="number"
                  value={form.perUserLimit}
                  onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                  placeholder="Per-user limit"
                  className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-faint">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-faint">Expiry Date/Time</label>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <select
                value={form.campusId}
                onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">No campus restriction</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={form.canteenId}
                onChange={(e) => setForm({ ...form, canteenId: e.target.value })}
                className="rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">No vendor restriction</option>
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-caption text-foreground">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
                <label className="flex items-center gap-2 text-caption text-foreground">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  Published
                </label>
              </div>

              {formError && <p className="text-caption font-semibold text-danger">{formError}</p>}

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="mt-2 rounded-xl bg-primary py-3 font-display text-body-sm font-extrabold uppercase tracking-wider text-on-primary disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Promo Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-danger/40 bg-surface-elevated p-6">
            <h3 className="mb-2 font-display text-title font-bold text-foreground">Delete this promo code?</h3>
            <p className="mb-4 rounded-xl border border-border bg-surface-elevated p-3 text-body-sm font-bold text-foreground">{deleteTarget.code}</p>
            <p className="mb-4 text-caption text-faint">This cannot be undone. Codes that have already been used cannot be deleted.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-border py-2.5 font-display text-caption font-bold text-muted">
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-danger py-2.5 font-display text-caption font-bold text-white disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
