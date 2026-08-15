"use client";

import { useState } from "react";
import type { SuperAdminCampus } from "@/lib/mock/superadmin";

interface CampusManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campusData: Omit<SuperAdminCampus, "id"> & { id?: string }) => void;
  editingCampus: SuperAdminCampus | null;
}

function CampusManageForm({
  editingCampus,
  onSave,
  onClose,
}: {
  editingCampus: SuperAdminCampus | null;
  onSave: (campusData: Omit<SuperAdminCampus, "id"> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editingCampus?.name ?? "");
  const [location, setLocation] = useState(editingCampus?.location ?? "");
  const [logisticsLeadName, setLogisticsLeadName] = useState(
    editingCampus?.logisticsLeadName ?? "",
  );
  const [status, setStatus] = useState<SuperAdminCampus["status"]>(
    editingCampus?.status ?? "ACTIVE",
  );
  const [vendorCount, setVendorCount] = useState(
    editingCampus ? String(editingCampus.vendorCount) : "25",
  );
  const [dailyOrders, setDailyOrders] = useState(
    editingCampus ? String(editingCampus.dailyOrders) : "1200",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;

    const initials = logisticsLeadName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "OP";

    onSave({
      id: editingCampus?.id,
      name: name.trim(),
      location: location.trim(),
      vendorCount: Number(vendorCount) || 20,
      dailyOrders: Number(dailyOrders) || 1000,
      ordersCapacityPercent: 75,
      logisticsLeadName: logisticsLeadName.trim() || "Operations Lead",
      logisticsLeadInitials: initials,
      status,
      imageUrl:
        editingCampus?.imageUrl ??
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAnL6yucAYd9Pmi4RFLLpjUqnREaSik4Hr8cWfjb_4cRgTLKjsvS1FXpojDeCHE8K5sL6y2DCUvdoJ0pNqrVEjEw-dMlChm-A_NrJ2OaCiJIldBlaBdRTnVf2-RblrCkWjmGmv6KifqsrKdjlP4lECNuKWiq7ZWjQ4CTVDmEvDunlXkXpwIxncN-rjEu_Ty0TB2hrpsN07nWk_H2n7QqWcUVVC7lsZtqdx49maJ5ZUruKWncwZ8yTEk",
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Campus Name */}
      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Campus Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amity University"
          className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="mb-1 block font-display text-caption font-bold text-muted">
          Location / City & State
        </label>
        <input
          type="text"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Noida, Uttar Pradesh"
          className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Logistics Lead & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Logistics Lead
          </label>
          <input
            type="text"
            value={logisticsLeadName}
            onChange={(e) => setLogisticsLeadName(e.target.value)}
            placeholder="e.g. Aryan Kapoor"
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Operational Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as SuperAdminCampus["status"])
            }
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="PRE_ONBOARDING">PRE ONBOARDING</option>
          </select>
        </div>
      </div>

      {/* Vendor Count & Daily Orders */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Vendor Count
          </label>
          <input
            type="number"
            min="1"
            value={vendorCount}
            onChange={(e) => setVendorCount(e.target.value)}
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block font-display text-caption font-bold text-muted">
            Est. Daily Orders
          </label>
          <input
            type="number"
            min="1"
            value={dailyOrders}
            onChange={(e) => setDailyOrders(e.target.value)}
            className="w-full rounded-xl border border-border bg-[#1e1f26] p-3 text-body-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
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
          {editingCampus ? "Save Changes" : "Add Campus"}
        </button>
      </div>
    </form>
  );
}

export function CampusManageModal({
  isOpen,
  onClose,
  onSave,
  editingCampus,
}: CampusManageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-[#121212] p-6 shadow-2xl animate-in fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-title font-bold text-foreground">
            {editingCampus ? "Manage Campus" : "Add New Campus"}
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

        <CampusManageForm
          key={editingCampus?.id ?? "new_campus"}
          editingCampus={editingCampus}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
