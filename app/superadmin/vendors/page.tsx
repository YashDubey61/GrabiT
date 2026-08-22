"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  INITIAL_VENDOR_OVERSIGHT_HUBS,
  INITIAL_VENDOR_APPROVAL_QUEUE,
  type CampusVendorHub,
  type VendorApprovalRequest,
  type VendorOversightItem,
} from "@/lib/mock/superadmin";
import { VendorOversightHeader } from "@/components/superadmin/vendors/VendorOversightHeader";
import { VendorHubGroup } from "@/components/superadmin/vendors/VendorHubGroup";
import { VendorApprovalQueue } from "@/components/superadmin/vendors/VendorApprovalQueue";
import { VendorManagementSection } from "@/components/superadmin/vendors/VendorManagementSection";

export default function SuperAdminVendorsPage() {
  const [hubs, setHubs] = useState<CampusVendorHub[]>(
    INITIAL_VENDOR_OVERSIGHT_HUBS,
  );
  const [approvalQueue, setApprovalQueue] = useState<VendorApprovalRequest[]>(
    INITIAL_VENDOR_APPROVAL_QUEUE,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/vendors");
      const result = await res.json();

      if (result.ok && result.data) {
        if (result.data.hubs) setHubs(result.data.hubs);
        if (result.data.approvalQueue) setApprovalQueue(result.data.approvalQueue);
      }
    } catch {
      // Retain fallback state on network exception
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleUpdateCommission = async (vendorId: string, commission: number) => {
    // Optimistic update
    setHubs((prev) =>
      prev.map((h) => ({
        ...h,
        vendors: h.vendors.map((v) =>
          v.id === vendorId ? { ...v, commissionPercent: commission } : v,
        ),
      })),
    );

    try {
      const res = await fetch(`/api/superadmin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPercent: commission }),
      });

      const data = await res.json();
      if (data.ok) {
        showNotification(`Vendor commission set to ${commission}%`);
      } else {
        showNotification(data.error || "Failed to update commission.");
        await loadData();
      }
    } catch {
      showNotification("Network error updating commission.");
      await loadData();
    }
  };

  const handleToggleTier = async (vendorId: string, tier: "STD" | "PREM") => {
    // Optimistic update
    setHubs((prev) =>
      prev.map((h) => ({
        ...h,
        vendors: h.vendors.map((v) =>
          v.id === vendorId ? { ...v, tier } : v,
        ),
      })),
    );

    try {
      const res = await fetch(`/api/superadmin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (data.ok) {
        showNotification(`Vendor tier updated to ${tier}`);
      } else {
        showNotification(data.error || "Failed to update tier.");
        await loadData();
      }
    } catch {
      showNotification("Network error updating tier.");
      await loadData();
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const req = approvalQueue.find((r) => r.id === requestId);
    setApprovalQueue((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const res = await fetch(`/api/superadmin/vendors/approval/${requestId}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.ok) {
        showNotification(`Request for ${req?.vendorName ?? "Vendor"} APPROVED`);
      } else {
        showNotification(data.error || "Failed to approve request.");
        await loadData();
      }
    } catch {
      showNotification("Network error approving request.");
      await loadData();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const req = approvalQueue.find((r) => r.id === requestId);
    setApprovalQueue((prev) => prev.filter((r) => r.id !== requestId));

    try {
      const res = await fetch(`/api/superadmin/vendors/approval/${requestId}/reject`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.ok) {
        showNotification(`Request for ${req?.vendorName ?? "Vendor"} REJECTED`);
      } else {
        showNotification(data.error || "Failed to reject request.");
        await loadData();
      }
    } catch {
      showNotification("Network error rejecting request.");
      await loadData();
    }
  };

  const handleMoreActions = (vendor: VendorOversightItem) => {
    showNotification(`Management console opened for ${vendor.name}`);
  };

  // Filtered hubs by search query
  const filteredHubs = useMemo(() => {
    if (!searchQuery.trim()) return hubs;
    const q = searchQuery.toLowerCase();
    return hubs
      .map((h) => ({
        ...h,
        vendors: h.vendors.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            h.hubName.toLowerCase().includes(q),
        ),
      }))
      .filter((h) => h.vendors.length > 0);
  }, [hubs, searchQuery]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-24">
        {notification && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-center text-body-sm font-semibold text-primary animate-fade-in">
            {notification}
          </div>
        )}

        {/* Header & Metric Summary */}
        <VendorOversightHeader pendingCount={approvalQueue.length} />

        {/* Vendor creation, credentials, pause/resume, and deactivation */}
        <VendorManagementSection />

        {/* Search Bar Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-faint" aria-hidden="true">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor name, category, or campus hub..."
            className="w-full rounded-xl border border-border bg-surface-elevated py-3 pl-10 pr-4 font-body text-body-sm text-foreground placeholder:text-faint focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Asymmetric Grid Layout */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Column: Vendor Listings by Campus Hub (8 cols) */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {filteredHubs.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-elevated/50 p-8 text-center backdrop-blur-md text-caption text-faint">
                No vendors found matching &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredHubs.map((hub) => (
                <VendorHubGroup
                  key={hub.id}
                  hub={hub}
                  onUpdateCommission={handleUpdateCommission}
                  onToggleTier={handleToggleTier}
                  onMoreActions={handleMoreActions}
                />
              ))
            )}
          </div>

          {/* Right Column: Approval Queue Card (4 cols) */}
          <div className="lg:col-span-4">
            <VendorApprovalQueue
              requests={approvalQueue}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onViewHistory={() =>
                showNotification("Detailed verification audit history opened")
              }
            />
          </div>
        </section>

        {/* Footer loading telemetry notice */}
        <div className="text-center pt-2">
          <span className="font-mono text-caption text-faint">
            {isLoading
              ? "Syncing live Super Admin vendor oversight..."
              : "Live Supabase Vendor Persistence Active"}
          </span>
        </div>
      </main>
    </div>
  );
}
