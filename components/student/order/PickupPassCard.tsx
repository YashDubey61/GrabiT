"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { buildPickupQrPayload } from "@/lib/orders/pickup_qr";
import type { OrderStatus } from "@/types";

/**
 * Renders the order's own unique pickup QR, encoded from that order's
 * secret verification token. Two different orders always produce two
 * different QR images because the token is per-order.
 *
 * The QR only ever carries the opaque token — no student identity,
 * contact details, or payment info.
 */
export function PickupPassCard({
  orderNumber,
  validUntilLabel,
  pickupQrToken,
  pickupOtpCode,
  status,
  completedAtLabel,
}: {
  orderNumber: string;
  validUntilLabel: string;
  pickupQrToken?: string | null;
  pickupOtpCode?: string | null;
  status: OrderStatus;
  completedAtLabel?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const isCompleted = status === "completed";
  const isScannable = status === "ready" || status === "picked_up";

  useEffect(() => {
    let cancelled = false;

    // Once completed the QR is spent — stop presenting it as an active
    // pickup credential. No state reset needed: the completed branch is
    // rendered before any QR image, so a stale data URL can't surface.
    if (!pickupQrToken || isCompleted) {
      return;
    }

    QRCode.toDataURL(buildPickupQrPayload(pickupQrToken), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 384,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pickupQrToken, isCompleted]);

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
        <h3 className="font-display text-heading font-700 text-foreground">
          {isCompleted ? "Order Completed" : "Pickup Pass"}
        </h3>
        <p className="text-caption text-muted">
          {isCompleted
            ? "This order has been handed over"
            : isScannable
              ? "Scan this at the counter to collect"
              : "Your QR activates once the order is Ready"}
        </p>
      </div>

      {isCompleted ? (
        <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-[2rem] border border-success/30 bg-success/10 text-success">
          <span className="material-symbols-outlined text-[56px]">check_circle</span>
          <span className="font-display text-caption font-bold uppercase tracking-wider">
            QR Verified
          </span>
        </div>
      ) : (
        <div className="relative rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="relative flex h-48 w-48 items-center justify-center overflow-hidden bg-white">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={`Pickup QR code for order ${orderNumber}`}
                width={192}
                height={192}
                className={`h-full w-full object-contain transition-opacity ${
                  isScannable ? "opacity-100" : "opacity-40"
                }`}
              />
            ) : (
              <span className="material-symbols-outlined animate-spin text-[32px] text-slate-400">
                progress_activity
              </span>
            )}

            {!isScannable && qrDataUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-lg bg-black/80 px-3 py-1.5 text-center font-display text-[10px] font-bold uppercase tracking-wider text-white">
                  Not ready yet
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
          {isCompleted
            ? completedAtLabel
              ? `Completed at ${completedAtLabel}`
              : "Completed"
            : `Valid until ${validUntilLabel}`}
        </p>
      </div>

      {/* Manual fallback — same credential as the QR, for when the
          counter can't scan it. Read this out to the vendor instead. */}
      {!isCompleted && pickupOtpCode && (
        <div className="flex w-full flex-col items-center gap-1.5 border-t border-white/10 pt-4">
          <p className="text-[10px] font-700 uppercase tracking-wider text-faint">
            Can&apos;t scan? Give the counter this code
          </p>
          <div className="flex gap-2">
            {pickupOtpCode.split("").map((digit, idx) => (
              <span
                key={idx}
                className="flex h-9 w-8 items-center justify-center rounded-lg border border-border bg-surface font-mono text-body font-extrabold text-foreground"
              >
                {digit}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
