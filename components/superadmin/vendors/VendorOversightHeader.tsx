"use client";

interface VendorOversightHeaderProps {
  pendingCount: number;
}

export function VendorOversightHeader({
  pendingCount,
}: VendorOversightHeaderProps) {
  return (
    <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-display text-title font-bold text-foreground sm:text-[28px]">
          Vendor Oversight
        </h2>
        <p className="max-w-xl text-body-sm text-faint">
          Manage commission structures, platform fee tiers, and verify vendor menu updates across all active campus locations.
        </p>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="flex flex-col rounded-xl border border-border bg-[#1e1f26] p-3 min-w-[130px]">
          <span className="font-display text-[10px] uppercase tracking-widest text-faint">
            Platform Fee Avg
          </span>
          <span className="font-display text-title font-bold text-primary">
            ₹3.80
          </span>
        </div>

        <div className="flex flex-col rounded-xl border border-border bg-[#1e1f26] p-3 min-w-[130px]">
          <span className="font-display text-[10px] uppercase tracking-widest text-faint">
            Pending Reviews
          </span>
          <span className="font-display text-title font-bold text-danger">
            {pendingCount}
          </span>
        </div>
      </div>
    </section>
  );
}
