import { formatPrice } from "@/lib/constants";

export function PriceTag({
  paise,
  size = "md",
  strikethrough = false,
}: {
  paise: number;
  size?: "sm" | "md" | "lg" | "xl";
  strikethrough?: boolean;
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <span
      className={`
        font-mono font-semibold tabular-nums tracking-tight
        ${sizeClasses[size]}
        ${strikethrough ? "line-through text-text-muted" : "text-text"}
      `}
    >
      {formatPrice(paise)}
    </span>
  );
}
