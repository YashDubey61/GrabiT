"use client";

export interface VendorOffersStatsCardsProps {
  stats: {
    activeOffersCount: number;
    scheduledOffersCount: number;
    expiredOffersCount: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    totalRevenueGenerated: number;
  };
}

export function VendorOffersStatsCards({ stats }: VendorOffersStatsCardsProps) {
  const cards = [
    {
      title: "Active Offers",
      value: stats.activeOffersCount.toLocaleString(),
      icon: "local_offer",
      color: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Scheduled",
      value: stats.scheduledOffersCount.toLocaleString(),
      icon: "schedule",
      color: "text-blue-400 bg-blue-500/10",
    },
    {
      title: "Expired / Paused",
      value: stats.expiredOffersCount.toLocaleString(),
      icon: "history",
      color: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Total Redemptions",
      value: stats.totalRedemptions.toLocaleString(),
      icon: "confirmation_number",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Discount Given",
      value: `₹${stats.totalDiscountGiven.toLocaleString()}`,
      icon: "savings",
      color: "text-purple-400 bg-purple-500/10",
    },
    {
      title: "Revenue via Offers",
      value: `₹${stats.totalRevenueGenerated.toLocaleString()}`,
      icon: "payments",
      color: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.title}
          className="flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-caption font-bold text-muted">
              {c.title}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${c.color}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {c.icon}
              </span>
            </div>
          </div>
          <span className="mt-2 font-display text-title font-extrabold tracking-tight text-foreground sm:text-headline">
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}
