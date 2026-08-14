"use client";

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-0 rounded-full border border-border bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="
          flex h-8 w-8 items-center justify-center
          text-text-secondary hover:text-accent hover:bg-surface-2
          transition-colors duration-150
          disabled:opacity-30 disabled:cursor-not-allowed
        "
        aria-label="Decrease quantity"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <span className="min-w-[2rem] text-center font-mono text-sm font-semibold tabular-nums text-text">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="
          flex h-8 w-8 items-center justify-center
          text-text-secondary hover:text-accent hover:bg-surface-2
          transition-colors duration-150
          disabled:opacity-30 disabled:cursor-not-allowed
        "
        aria-label="Increase quantity"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
