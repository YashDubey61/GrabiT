"use client";

interface CampusStatsGridProps {
  totalCampusesCount: number;
  totalVendorsCount: number;
  dailyVolume?: string;
  networkHealth?: string;
}

export function CampusStatsGrid({
  totalCampusesCount,
  totalVendorsCount,
  dailyVolume = "12.4k orders",
  networkHealth = "99.8%",
}: CampusStatsGridProps) {
  return (
    <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Campuses */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Total Campuses
        </span>
        <div className="flex items-end gap-3 mt-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
            {totalCampusesCount}
          </span>
          <span className="font-display text-caption font-bold text-primary mb-1">
            Live
          </span>
        </div>
      </div>

      {/* Card 2: Active Vendors */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Active Storefronts
        </span>
        <div className="flex items-end gap-3 mt-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
            {totalVendorsCount}
          </span>
          <span className="font-display text-caption font-bold text-success mb-1">
            Active
          </span>
        </div>
      </div>

      {/* Card 3: Daily Volume */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Daily Volume
        </span>
        <div className="flex items-end gap-3 mt-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[24px]">
            {dailyVolume}
          </span>
        </div>
      </div>

      {/* Card 4: Network Health */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-[#1e1f26]/80 p-4 backdrop-blur-md">
        <span className="font-display text-caption font-bold uppercase tracking-widest text-faint">
          Network Health
        </span>
        <div className="flex items-end gap-2 mt-2">
          <span className="font-display text-title font-extrabold text-foreground sm:text-[28px]">
            {networkHealth}
          </span>
        </div>
      </div>
    </section>
  );
}
