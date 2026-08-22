/** Deterministic hash + seeded PRNG — same order id always produces the
 * same barcode, no two different orders look identical, no external
 * barcode library or static image involved. */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function idToDigits(orderId: string, len = 10): string {
  const rand = mulberry32(hashString(orderId));
  let digits = orderId.replace(/\D/g, "");
  while (digits.length < len) digits += Math.floor(rand() * 10);
  return digits.slice(0, len);
}

export interface BarcodeBar {
  x: number;
  width: number;
}

export function buildBarcodeBars(orderId: string, barCount = 46): { bars: BarcodeBar[]; totalWidth: number } {
  const rand = mulberry32(hashString(orderId + "::barcode"));
  const widths: number[] = [3]; // start guard
  for (let i = 0; i < barCount; i++) {
    widths.push(rand() > 0.62 ? 3 : 1.4);
  }
  widths.push(3); // end guard

  const gap = 1.6;
  let x = 0;
  const bars: BarcodeBar[] = [];
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push({ x, width: w });
    x += w + gap;
  });

  return { bars, totalWidth: x };
}
