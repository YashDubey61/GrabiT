import { buildBarcodeBars, idToDigits } from "./barcode-utils";

/** SVG barcode rendered purely from the order id — no external image. */
export function Barcode({ orderId }: { orderId: string }) {
  const { bars, totalWidth } = buildBarcodeBars(orderId);
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        viewBox={`0 0 ${totalWidth.toFixed(2)} 30`}
        width="100%"
        height="30"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Barcode for order ${orderId}`}
      >
        {bars.map((bar, i) => (
          <rect key={i} x={bar.x} y={0} width={bar.width} height={30} fill="#191817" />
        ))}
      </svg>
      <span className="text-[10px] tracking-[0.18em] text-[#57534b]">{idToDigits(orderId)}</span>
    </div>
  );
}
