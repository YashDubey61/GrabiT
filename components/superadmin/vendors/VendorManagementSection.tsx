"use client";

import { useEffect, useState } from "react";

interface Campus {
  id: string;
  name: string;
}

interface ManagedVendor {
  id: string;
  name: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive";
  is_paused: boolean;
  pause_reason: string | null;
  vendor_code: string | null;
  created_at: string;
  campuses: { id: string; name: string } | null;
}

type FilterTab = "all" | "active" | "paused" | "inactive";

const emptyForm = {
  ownerName: "",
  shopName: "",
  email: "",
  phone: "",
  campusId: "",
  address: "",
  pickupLocation: "",
  operatingHours: "",
  prepTimeMinutes: 15,
  password: "",
  confirmPassword: "",
};

export function VendorManagementSection() {
  const [vendors, setVendors] = useState<ManagedVendor[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [notification, setNotification] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingVendor, setEditingVendor] = useState<ManagedVendor | null>(null);
  const [pauseTarget, setPauseTarget] = useState<ManagedVendor | null>(null);
  const [pauseReasonInput, setPauseReasonInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ManagedVendor | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/vendor-management");
      const data = await res.json();
      if (data.ok) setVendors(data.vendors);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVendors();
    fetch("/api/superadmin/campuses")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCampuses(d.data.campuses);
      });
  }, []);

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      !search.trim() ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.owner_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.campuses?.name ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? v.status === "active" && !v.is_paused
          : filter === "paused"
            ? v.is_paused
            : v.status === "inactive";

    return matchesSearch && matchesFilter;
  });

  const handleCreate = async () => {
    setFormError(null);
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/superadmin/vendor-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormError(data.error ?? "Unable to create vendor.");
        return;
      }
      showNotification(`Vendor "${form.shopName}" created — ${data.vendor.vendorCode}`);
      setIsCreateOpen(false);
      setForm(emptyForm);
      loadVendors();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVendor) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/superadmin/vendor-management/${editingVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: editingVendor.owner_name ?? "",
          shopName: editingVendor.name,
          email: editingVendor.email ?? "",
          campusId: editingVendor.campuses?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showNotification(data.error ?? "Unable to update vendor.");
        return;
      }
      showNotification("Vendor updated.");
      setEditingVendor(null);
      loadVendors();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmPauseToggle = async () => {
    if (!pauseTarget) return;
    const nextPaused = !pauseTarget.is_paused;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/superadmin/vendor-management/${pauseTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaused: nextPaused, pauseReason: pauseReasonInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showNotification(data.error ?? "Unable to update store status.");
        return;
      }
      showNotification(nextPaused ? `${pauseTarget.name} paused.` : `${pauseTarget.name} resumed.`);
      setPauseTarget(null);
      setPauseReasonInput("");
      loadVendors();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/superadmin/vendor-management/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showNotification(data.error ?? "Unable to delete vendor.");
        return;
      }
      showNotification(`${deleteTarget.name} deactivated.`);
      setDeleteTarget(null);
      loadVendors();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-[#1e1f26]/60 p-5 backdrop-blur-md">
      {notification && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
          {notification}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-title font-bold text-foreground">Vendor Management</h3>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Create Vendor
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search vendors..."
        className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
      />

      <div className="flex gap-2">
        {(["all", "active", "paused", "inactive"] as const).map((f) => (
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
        <p className="py-8 text-center text-body-sm text-muted">Loading vendors...</p>
      ) : filteredVendors.length === 0 ? (
        <p className="py-8 text-center text-body-sm text-muted">No vendors found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredVendors.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-surface-elevated p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-body font-bold text-foreground">{v.name}</p>
                  <p className="truncate text-caption text-faint">{v.owner_name ?? "—"}</p>
                  <p className="truncate text-caption text-faint">{v.campuses?.name ?? "No campus"}</p>
                  {v.vendor_code && (
                    <p className="font-mono text-[10px] text-faint">{v.vendor_code}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${
                    v.status === "inactive"
                      ? "bg-danger/20 text-danger border border-danger/30"
                      : v.is_paused
                        ? "bg-warning/20 text-warning border border-warning/30"
                        : "bg-success/20 text-success border border-success/30"
                  }`}
                >
                  {v.status === "inactive" ? "Inactive" : v.is_paused ? "Paused" : "Active"}
                </span>
              </div>

              {v.is_paused && v.pause_reason && (
                <p className="mb-2 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] text-warning">
                  Reason: {v.pause_reason}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(v)}
                  className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-foreground"
                >
                  Edit
                </button>
                {v.status === "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPauseTarget(v);
                      setPauseReasonInput(v.pause_reason ?? "");
                    }}
                    className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-bold text-muted hover:text-foreground"
                  >
                    {v.is_paused ? "Resume Store" : "Pause Store"}
                  </button>
                )}
                {v.status === "active" && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(v)}
                    className="rounded-lg border border-danger/30 px-2.5 py-1 text-[11px] font-bold text-danger hover:bg-danger-soft"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Vendor Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-border bg-[#121212] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-title font-bold text-foreground">Create Vendor</h3>
              <button type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close">
                <span className="material-symbols-outlined text-[20px] text-faint">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <p className="font-display text-[11px] font-bold uppercase tracking-widest text-faint">
                Vendor Details
              </p>
              {[
                ["ownerName", "Vendor/Owner Name"],
                ["shopName", "Shop/Cafe Name"],
                ["email", "Email"],
                ["phone", "Phone"],
                ["address", "Shop Address"],
                ["pickupLocation", "Pickup Location"],
                ["operatingHours", "Operating Hours"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={label}
                  className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                />
              ))}
              <select
                value={form.campusId}
                onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select College/Campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={5}
                value={form.prepTimeMinutes}
                onChange={(e) => setForm({ ...form, prepTimeMinutes: Number(e.target.value) })}
                placeholder="Prep Time (minutes)"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />

              <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-widest text-faint">
                Login Credentials
              </p>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Temporary Password"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm Password"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />

              {formError && <p className="text-caption font-semibold text-danger">{formError}</p>}

              <button
                type="button"
                disabled={isSaving}
                onClick={handleCreate}
                className="mt-2 rounded-xl bg-primary py-3 font-display text-body-sm font-extrabold uppercase tracking-wider text-on-primary disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Create Vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#121212] p-6">
            <h3 className="mb-4 font-display text-title font-bold text-foreground">Edit Vendor</h3>
            <div className="flex flex-col gap-3">
              <input
                value={editingVendor.owner_name ?? ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, owner_name: e.target.value })}
                placeholder="Vendor/Owner Name"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
              <input
                value={editingVendor.name}
                onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                placeholder="Shop Name"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
              <input
                value={editingVendor.email ?? ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                placeholder="Email"
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              />
              <select
                value={editingVendor.campuses?.id ?? ""}
                onChange={(e) =>
                  setEditingVendor({
                    ...editingVendor,
                    campuses: { id: e.target.value, name: campuses.find((c) => c.id === e.target.value)?.name ?? "" },
                  })
                }
                className="rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 font-display text-caption font-bold text-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-xl bg-primary py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause/Resume Modal */}
      {pauseTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-[#121212] p-6">
            <h3 className="mb-2 font-display text-title font-bold text-foreground">
              {pauseTarget.is_paused ? "Resume Store" : "Pause Store"}
            </h3>
            <p className="mb-4 text-body-sm text-muted">{pauseTarget.name}</p>
            {!pauseTarget.is_paused && (
              <input
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                placeholder="Reason (optional)"
                className="mb-4 w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPauseTarget(null)}
                className="flex-1 rounded-xl border border-border py-2.5 font-display text-caption font-bold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmPauseToggle}
                className="flex-1 rounded-xl bg-primary py-2.5 font-display text-caption font-bold text-on-primary disabled:opacity-50"
              >
                {pauseTarget.is_paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-danger/40 bg-[#121212] p-6">
            <h3 className="mb-2 font-display text-title font-bold text-foreground">Delete this vendor shop?</h3>
            <div className="mb-4 rounded-xl border border-border bg-surface-elevated p-3 text-body-sm text-foreground">
              <p className="font-bold">{deleteTarget.name}</p>
              <p className="text-faint">{deleteTarget.campuses?.name ?? "—"}</p>
              <p className="text-faint">{deleteTarget.owner_name ?? "—"}</p>
            </div>
            <p className="mb-4 text-caption text-faint">
              The shop is deactivated and hidden from customers. Historical orders, payments, and payouts are kept.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-border py-2.5 font-display text-caption font-bold text-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-danger py-2.5 font-display text-caption font-bold text-white disabled:opacity-50"
              >
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
