"use client";

export default function AdminHeatmapPage() {
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM
  const canteens = [
    { name: "Café Central", data: [3, 8, 25, 42, 18, 55, 72, 65, 30, 12, 5, 2] },
    { name: "South Side Bites", data: [1, 5, 18, 35, 12, 48, 60, 55, 25, 8, 3, 1] },
    { name: "Quick Bites Corner", data: [0, 2, 10, 20, 8, 30, 38, 32, 15, 5, 1, 0] },
  ];

  const allValues = canteens.flatMap(c => c.data);
  const maxVal = Math.max(...allValues);

  const getColor = (value: number) => {
    const intensity = value / maxVal;
    if (intensity === 0) return "bg-surface-2";
    if (intensity < 0.25) return "bg-accent/15";
    if (intensity < 0.5) return "bg-accent/30";
    if (intensity < 0.75) return "bg-accent/50";
    return "bg-accent/80";
  };

  return (
    <div className="px-4 pt-6 md:px-8 pb-4">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Performance Heatmap</h1>
      <p className="text-sm text-text-secondary mb-8">Orders per canteen by hour of day</p>

      {/* Heatmap grid */}
      <div className="rounded-2xl border border-border bg-surface p-5 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-36 shrink-0" />
            {hours.map(h => (
              <div key={h} className="flex-1 text-center text-xs text-text-muted font-mono">
                {h > 12 ? `${h - 12}PM` : h === 12 ? "12PM" : `${h}AM`}
              </div>
            ))}
          </div>

          {/* Canteen rows */}
          {canteens.map(canteen => (
            <div key={canteen.name} className="flex items-center mb-2">
              <div className="w-36 shrink-0 text-sm font-medium text-text pr-3 truncate">
                {canteen.name}
              </div>
              <div className="flex flex-1 gap-1">
                {canteen.data.map((val, i) => (
                  <div
                    key={i}
                    className={`
                      flex-1 h-10 rounded-md transition-all duration-500
                      flex items-center justify-center
                      ${getColor(val)}
                    `}
                    title={`${val} orders`}
                  >
                    {val > 0 && (
                      <span className="text-[10px] font-mono font-medium text-text/70">
                        {val}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
          <span className="text-xs text-text-muted">Low</span>
          {["bg-surface-2", "bg-accent/15", "bg-accent/30", "bg-accent/50", "bg-accent/80"].map((color, i) => (
            <div key={i} className={`h-4 w-6 rounded ${color}`} />
          ))}
          <span className="text-xs text-text-muted">High</span>
        </div>
      </div>
    </div>
  );
}
