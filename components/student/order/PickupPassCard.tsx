"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Converted from grabit_track_order_premium_black's "Pickup Pass" QR
 * section. The Stitch source's QR image is decorative placeholder
 * artwork (not a functioning encoded code), reused as-is per the "reuse
 * existing assets" rule rather than substituted.
 *
 * Shows the order's own orderNumber ("#41") in the code chip instead of
 * inventing a second, separate pickup-code identifier ("GI9876" in the
 * source) — the PRD only specifies one human-readable order number, and
 * introducing a second ID format here isn't asked for anywhere in the
 * spec.
 */
export function PickupPassCard({
  orderNumber,
  validUntilLabel,
}: {
  orderNumber: string;
  validUntilLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(orderNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-primary/15 bg-surface-elevated/80 p-6 shadow-2xl backdrop-blur-md">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="text-center">
        <h3 className="font-display text-heading font-700 text-foreground">Pickup Pass</h3>
        <p className="text-caption text-muted">Scan this at the counter to collect</p>
      </div>

      <div className="relative rounded-[2rem] bg-white p-6 shadow-xl">
        <div className="flex h-48 w-48 items-center justify-center overflow-hidden bg-slate-100">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFvzgTz7lTyXo_ripZZrAVBNSDcGyCxoTLypawFPpkj9m-Xf7e2Ilqkwy3mviks0gzBDdBMKPfyP-Eb29SW5-j5rdeuiOPbgrtfaqGLFIcUlFjktqdSkCJCL8qGtD4lMhuKgxZSecz7zkUQbuBz4VCV58wAKk-wAAhzS8Sw2-1_l2pnBB9a-WNUBGMOcSNf_tOxmWk2JacY1KzifoeY82isKI4V8gqDpmfJFsltNRJ-KhR94qu-Xmk"
            alt="Pickup QR code"
            width={192}
            height={192}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface px-6 py-2">
          <span className="text-label font-700 tracking-[0.3em] text-muted">
            {orderNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy order number"
            className="text-primary transition-transform hover:scale-110"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
        </div>
        <p className="text-[10px] font-700 uppercase tracking-tight text-muted">
          Valid until {validUntilLabel}
        </p>
      </div>
    </section>
  );
}
