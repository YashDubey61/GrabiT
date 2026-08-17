"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { buildPickupQrPayload, parsePickupQrPayload } from "@/lib/orders/pickup_qr";

interface ScannedOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

type CameraState = "idle" | "starting" | "running" | "denied" | "unavailable";

export function VendorQrScanner({
  isOpen,
  onClose,
  onCompleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (orderNumber: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  // Remembers the exact payload that verified, so completion consumes
  // the same token the vendor just confirmed on screen.
  const pendingQrValueRef = useRef<string | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [detected, setDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<ScannedOrder | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Sends a scanned/typed payload to the server for verification. */
  const verifyQrValue = useCallback(
    async (qrValue: string) => {
      setIsBusy(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/vendor/orders/verify-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrValue }),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setErrorMessage(data.error ?? "Unable to verify this QR code.");
          setVerifiedOrder(null);
          pendingQrValueRef.current = null;
          return false;
        }

        // Hold the verified payload so "Complete Order" consumes exactly
        // this token (works for both camera scans and manual entry).
        pendingQrValueRef.current = qrValue;
        setVerifiedOrder(data.order as ScannedOrder);
        stopCamera();
        return true;
      } catch {
        setErrorMessage("Network error verifying QR. Try again.");
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }

    setCameraState("starting");
    setErrorMessage(null);
    try {
      // Rear camera on mobile; falls back to any available device on desktop.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      setCameraState("running");
      scanningRef.current = true;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = () => {
        if (!scanningRef.current || !videoRef.current || !ctx) return;
        const v = videoRef.current;

        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code?.data) {
            // Reject non-GRABIT QRs client-side so we don't spam the API,
            // but the server still re-validates everything.
            if (parsePickupQrPayload(code.data)) {
              scanningRef.current = false;
              setDetected(true);
              setTimeout(() => setDetected(false), 1200);
              verifyQrValue(code.data);
              return;
            }
            setErrorMessage("Invalid GRABIT QR code.");
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCameraState("denied");
      } else {
        setCameraState("unavailable");
      }
    }
  }, [verifyQrValue]);

  // Tear down camera + timers whenever the scanner closes or unmounts.
  useEffect(() => {
    if (!isOpen) {
      // Closing tears down the camera (external system) and clears the
      // previous scan so reopening never shows a stale verified order.
      stopCamera();
      pendingQrValueRef.current = null;
      /* eslint-disable react-hooks/set-state-in-effect */
      setVerifiedOrder(null);
      setErrorMessage(null);
      setManualCode("");
      setCameraState("idle");
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const handleCompleteOrder = async () => {
    if (!verifiedOrder) return;
    const qrValue = pendingQrValueRef.current;
    if (!qrValue) return;

    setIsBusy(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vendor/orders/complete-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrValue }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error ?? "Unable to complete this order.");
        return;
      }

      onCompleted(data.order.orderNumber);
      onClose();
    } catch {
      setErrorMessage("Network error completing order. Try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleManualSubmit = async () => {
    const raw = manualCode.trim();
    if (!raw) return;
    // Accept either a full payload or a bare token.
    const qrValue = raw.startsWith("GRABIT:") ? raw : buildPickupQrPayload(raw.toLowerCase());
    await verifyQrValue(qrValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-display text-body font-extrabold text-foreground">
              {verifiedOrder ? "Order Verified" : "Scan Order QR"}
            </h3>
            {!verifiedOrder && (
              <p className="text-caption text-faint">
                Position the customer&apos;s QR inside the frame.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5">
          {verifiedOrder ? (
            /* ---------- Verified order confirmation ---------- */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 py-2.5 font-display text-caption font-extrabold uppercase tracking-widest text-success">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Order Verified
              </div>

              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-title font-extrabold text-foreground">
                      {verifiedOrder.orderNumber}
                    </p>
                    <p className="text-caption text-faint">{verifiedOrder.studentName}</p>
                  </div>
                  <span className="rounded-md border border-primary/30 bg-primary/20 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
                    {verifiedOrder.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-elevated p-3">
                {verifiedOrder.items.map((item, idx) => (
                  <div key={idx} className="text-body-sm font-semibold text-foreground">
                    {item.quantity} × {item.name}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-display text-caption font-bold uppercase tracking-wider text-muted">
                  Total
                </span>
                <span className="font-display text-heading font-extrabold text-foreground">
                  ₹{verifiedOrder.totalAmount}
                </span>
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft/40 p-3 text-caption font-semibold text-danger">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCompleteOrder}
                disabled={isBusy}
                className="w-full rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
              >
                {isBusy ? "Completing..." : "Complete Order"}
              </button>
            </div>
          ) : (
            /* ---------- Scanning ---------- */
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-black">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />

                {/* Scanning frame */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className={`h-2/3 w-2/3 rounded-2xl border-2 transition-colors ${
                      detected ? "border-success" : "border-primary/80"
                    }`}
                  />
                </div>

                {detected && (
                  <div className="absolute inset-x-0 bottom-3 flex justify-center">
                    <span className="rounded-full bg-success px-3 py-1 font-display text-caption font-bold text-black">
                      ✓ QR Detected
                    </span>
                  </div>
                )}

                {cameraState !== "running" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
                    {cameraState === "starting" && (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                          progress_activity
                        </span>
                        <p className="text-caption text-muted">Starting camera…</p>
                      </>
                    )}
                    {cameraState === "denied" && (
                      <>
                        <span className="material-symbols-outlined text-[28px] text-danger">
                          videocam_off
                        </span>
                        <p className="text-caption text-muted">
                          Camera access is required to scan order QR codes.
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="mt-1 rounded-lg border border-border px-3 py-1.5 font-display text-caption font-bold text-primary"
                        >
                          Retry Camera
                        </button>
                      </>
                    )}
                    {cameraState === "unavailable" && (
                      <>
                        <span className="material-symbols-outlined text-[28px] text-muted">
                          no_photography
                        </span>
                        <p className="text-caption text-muted">
                          No camera available. Enter the order code below instead.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft/40 p-3 text-caption font-semibold text-danger">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Manual fallback — used when the camera is blocked or the
                  QR won't read at the counter. */}
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <label
                  htmlFor="manual-qr-code"
                  className="font-display text-caption font-bold text-muted"
                >
                  Can&apos;t scan? Enter order code
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-qr-code"
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Paste order verification code"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 font-mono text-caption text-foreground placeholder:text-faint focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isBusy || !manualCode.trim()}
                    className="shrink-0 rounded-xl bg-primary px-4 py-2.5 font-display text-caption font-extrabold uppercase tracking-wider text-on-primary disabled:opacity-40"
                  >
                    {isBusy ? "…" : "Verify"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-border py-2.5 font-display text-caption font-bold uppercase tracking-wider text-muted hover:text-foreground"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
