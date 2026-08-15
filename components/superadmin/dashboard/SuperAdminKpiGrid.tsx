"use client";

import type { SuperAdminKpis } from "@/lib/mock/superadmin";

interface SuperAdminKpiGridProps {
  kpis: SuperAdminKpis;
}

export function SuperAdminKpiGrid({ kpis }: SuperAdminKpiGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total GMV */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              payments
            </span>
          </div>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-bold text-primary">
            +{kpis.gmvGrowthPercent}%
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Total GMV
        </span>
        <h3 className="font-display text-title font-extrabold text-foreground sm:text-[24px]">
          ₹{kpis.totalGmv.toLocaleString("en-IN")}
        </h3>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full bg-primary w-[70%] transition-all duration-500" />
        </div>
      </div>

      {/* Card 2: Active Campuses */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-surface-sunken p-2 text-muted">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              map
            </span>
          </div>
          <span className="rounded bg-success/10 px-1.5 py-0.5 font-display text-[10px] font-bold text-success border border-success/30">
            Live
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Active Campuses
        </span>
        <h3 className="font-display text-title font-extrabold text-foreground sm:text-[24px]">
          {kpis.activeCampuses}
        </h3>
        <div className="flex -space-x-1.5 pt-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-[9px] font-bold text-black border border-background">
            PSIT
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-sunken font-display text-[9px] font-bold text-muted border border-background">
            IITK
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-sunken font-display text-[9px] font-bold text-muted border border-background">
            BITS
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border font-display text-[8px] font-bold text-faint border border-background">
            +139
          </div>
        </div>
      </div>

      {/* Card 3: Active Students */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              groups
            </span>
          </div>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-display text-[10px] font-bold text-primary">
            {kpis.studentsGrowthText}
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Active Students
        </span>
        <h3 className="font-display text-title font-extrabold text-foreground sm:text-[24px]">
          {kpis.activeStudents.toLocaleString("en-IN")}
        </h3>
        <p className="text-[11px] text-faint">84% of total student body</p>
      </div>

      {/* Card 4: Platform Commission */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md transition-all hover:border-primary/40">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              receipt_long
            </span>
          </div>
          <span className="rounded bg-surface-sunken px-1.5 py-0.5 font-display text-[10px] font-bold text-muted border border-border">
            Stable
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Platform Comm.
        </span>
        <h3 className="font-display text-title font-extrabold text-foreground sm:text-[24px]">
          {kpis.platformCommissionPercent}%
        </h3>
        <p className="text-[11px] text-faint">
          Net Revenue: ₹{(kpis.netRevenue / 1000).toFixed(1)}k
        </p>
      </div>
    </section>
  );
}
