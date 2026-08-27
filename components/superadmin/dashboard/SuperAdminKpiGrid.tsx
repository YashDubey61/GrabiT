"use client";

import type { SuperAdminKpis } from "@/lib/mock/superadmin";

interface SuperAdminKpiGridProps {
  kpis: SuperAdminKpis;
}

export function SuperAdminKpiGrid({ kpis }: SuperAdminKpiGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total GMV */}
      <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,122,0,0.12)] hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              payments
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-emerald-400 font-mono">
            +{kpis.gmvGrowthPercent}%
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-wider text-zinc-400">
          Total GMV
        </span>
        <h3 className="font-display text-title font-extrabold text-white sm:text-[26px] font-mono">
          ₹{kpis.totalGmv.toLocaleString("en-IN")}
        </h3>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full bg-gradient-to-r from-primary to-orange-400 w-[70%] transition-all duration-500 shadow-[0_0_8px_rgba(255,122,0,0.5)]" />
        </div>
      </div>

      {/* Card 2: Active Campuses */}
      <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,122,0,0.12)] hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              map
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-emerald-400">
            Live Network
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-wider text-zinc-400">
          Active Campuses
        </span>
        <h3 className="font-display text-title font-extrabold text-white sm:text-[26px] font-mono">
          {kpis.activeCampuses}
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">Pan-India University Network</p>
      </div>

      {/* Card 3: Active Students */}
      <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,122,0,0.12)] hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              groups
            </span>
          </div>
          <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 font-display text-[10px] font-extrabold text-primary">
            {kpis.studentsGrowthText}
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-wider text-zinc-400">
          Active Students
        </span>
        <h3 className="font-display text-title font-extrabold text-white sm:text-[26px] font-mono">
          {kpis.activeStudents.toLocaleString("en-IN")}
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">84% of total student body</p>
      </div>

      {/* Card 4: Platform Commission */}
      <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.10] bg-[#0c0c0e]/80 p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] transition-all duration-200 hover:border-primary/50 hover:shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(255,122,0,0.12)] hover:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-60" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-primary">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              receipt_long
            </span>
          </div>
          <span className="rounded-full bg-white/[0.06] border border-white/[0.10] px-2.5 py-0.5 font-display text-[10px] font-extrabold text-zinc-400">
            Stable
          </span>
        </div>
        <span className="font-display text-caption font-bold uppercase tracking-wider text-zinc-400">
          Platform Comm.
        </span>
        <h3 className="font-display text-title font-extrabold text-white sm:text-[26px] font-mono">
          {kpis.platformCommissionPercent}%
        </h3>
        <p className="mt-1 text-[11px] text-zinc-400">
          Net Revenue: <strong className="text-white font-mono">₹{(kpis.netRevenue / 1000).toFixed(1)}k</strong>
        </p>
      </div>
    </section>
  );
}
