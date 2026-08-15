"use client";

import Image from "next/image";
import { useState } from "react";
import type { SuperAdminCampus } from "@/lib/mock/superadmin";

interface CampusRegistryTableProps {
  campuses: SuperAdminCampus[];
  onManageCampus: (campus: SuperAdminCampus) => void;
  onDownloadRegistry?: () => void;
}

export function CampusRegistryTable({
  campuses,
  onManageCampus,
  onDownloadRegistry,
}: CampusRegistryTableProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-[#1e1f26]/80 backdrop-blur-md">
      {/* Table Header & Download Action */}
      <div className="flex items-center justify-between border-b border-border p-5 bg-surface-sunken/40">
        <h3 className="font-display text-title font-bold text-foreground">
          Institutional Registry
        </h3>
        <button
          type="button"
          onClick={onDownloadRegistry}
          className="rounded-lg p-2 text-faint hover:bg-surface-elevated hover:text-foreground transition-colors"
          title="Download Registry CSV"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            download
          </span>
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-border/40 bg-surface-sunken font-display text-[10px] font-bold uppercase tracking-widest text-faint">
              <th className="px-6 py-3.5">Campus Name & Location</th>
              <th className="px-6 py-3.5">Vendor Count</th>
              <th className="px-6 py-3.5">Daily Orders</th>
              <th className="px-6 py-3.5">Logistics Lead</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {campuses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-body-sm text-faint">
                  No campuses match your search or status filter.
                </td>
              </tr>
            ) : (
              campuses.map((cmp) => (
                <tr key={cmp.id} className="transition-colors hover:bg-surface-elevated/50">
                  {/* Name & Location with Image */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-black">
                        {!imgErrors[cmp.id] ? (
                          <Image
                            src={cmp.imageUrl}
                            alt={cmp.name}
                            fill
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [cmp.id]: true }))
                            }
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-primary bg-surface-elevated">
                            <span className="material-symbols-outlined text-[20px]">
                              school
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-display font-bold text-foreground">
                          {cmp.name}
                        </p>
                        <p className="text-[12px] text-faint">{cmp.location}</p>
                      </div>
                    </div>
                  </td>

                  {/* Vendor Count */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-display font-semibold text-foreground">
                      <span>{cmp.vendorCount}</span>
                      {cmp.vendorNewDelta && (
                        <span className="rounded bg-primary/10 px-1 text-[10px] font-bold text-primary">
                          +{cmp.vendorNewDelta}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Daily Orders & Capacity Bar */}
                  <td className="px-6 py-4">
                    <p className="font-display font-semibold text-foreground">
                      {cmp.dailyOrders.toLocaleString("en-IN")}
                    </p>
                    <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${cmp.ordersCapacityPercent}%` }}
                      />
                    </div>
                  </td>

                  {/* Logistics Lead */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-sunken font-display text-[10px] font-bold text-foreground border border-border">
                        {cmp.logisticsLeadInitials}
                      </div>
                      <span className="text-body-sm text-faint">
                        {cmp.logisticsLeadName}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider ${
                        cmp.status === "ACTIVE"
                          ? "bg-success/20 text-success border border-success/30"
                          : cmp.status === "MAINTENANCE"
                            ? "bg-warning/20 text-warning border border-warning/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          cmp.status === "ACTIVE"
                            ? "bg-success animate-pulse"
                            : cmp.status === "MAINTENANCE"
                              ? "bg-warning"
                              : "bg-primary"
                        }`}
                      />
                      {cmp.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Manage Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onManageCampus(cmp)}
                      className="rounded-lg px-3 py-1.5 font-display text-caption font-bold uppercase tracking-wider text-muted hover:bg-surface-elevated hover:text-primary transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border p-4 bg-surface-sunken/40">
        <span className="text-caption text-faint">
          Showing <span className="font-semibold text-foreground">1-{campuses.length}</span> of 24 campuses
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="rounded-lg border border-border p-1.5 text-faint opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              chevron_left
            </span>
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-border p-1.5 text-faint opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
