"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import jsQR from "jsqr";
import { buildPickupQrPayload, parsePickupQrPayload } from "@/lib/orders/pickup_qr";
import { PICKUP_OTP_LENGTH } from "@/lib/orders/pickup_otp";
import { openAppSettings } from "@/lib/capacitor/settings";
import { useModalBackHandler } from "@/lib/navigation/backButtonManager";

interface ScannedOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  status: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

type CameraState = "idle" | "starting" | "running" | "denied" | "permanently-denied" | "unavailable";
type EntryMode = "qr" | "otp";
// Remembers exactly which credential verified, so completion consumes
// the same one — regardless of whether it came from the camera, the
// raw-token paste box, or the OTP digits.
type PendingCredential = { type: "qr" | "otp"; value: string };

export function VendorQrScanner({
  isOpen,
  initialMode = "qr",
  onClose,
  onCompleted,
}: {
  isOpen: boolean;
  initialMode?: EntryMode;
  onClose: () => void;
  onCompleted: (orderNumber: string) => void;
}) {
  useModalBackHandler(isOpen, onClose, "vendor-qr-scanner-modal");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const pendingCredentialRef = useRef<PendingCredential | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [mode, setMode] = useState<EntryMode>(initialMode);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [detected, setDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<ScannedOrder | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(PICKUP_OTP_LENGTH).fill(""),
  );

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

  /** Sends a scanned/typed credential to the server for verification.
   * QR and OTP both call this same function against the same endpoint —
   * only the request field differs — so they can never diverge. */
  const verifyCredential = useCallback(
    async (credential: PendingCredential, fallbackError: string) => {
      setIsBusy(true);
      setErrorMessage(null);
      try {
        const res = await fetch("/api/vendor/orders/verify-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            credential.type === "qr"
              ? { qrValue: credential.value }
              : { otpValue: credential.value },
          ),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setErrorMessage(data.error ?? fallbackError);
          setVerifiedOrder(null);
          pendingCredentialRef.current = null;
          return false;
        }

        // Hold the verified credential so "Complete Order" consumes
        // exactly this one (works for camera scans, pasted tokens, and
        // manual OTP entry alike).
        pendingCredentialRef.current = credential;
        setVerifiedOrder(data.order as ScannedOrder);
        stopCamera();
        return true;
      } catch {
        setErrorMessage("Network error verifying. Try again.");
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [stopCamera],
  );

  const verifyQrValue = useCallback(
    (qrValue: string) => verifyCredential({ type: "qr", value: qrValue }, "Unable to verify this QR code."),
    [verifyCredential],
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
      if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") {
        try {
          if (navigator.permissions?.query) {
            const status = await navigator.permissions.query({ name: "camera" as PermissionName });
            if (status.state === "denied") {
              setCameraState("permanently-denied");
              return;
            }
          }
        } catch {
          // Fall back to denied
        }
        setCameraState("denied");
      } else {
        setCameraState("unavailable");
      }
    }
  }, [verifyQrValue]);

  // Reset all state whenever the scanner opens or closes. Runs on the
  // `isOpen` transition only (not on every `initialMode` prop identity
  // change) — the modal doesn't remount between opens, so this is what
  // makes each fresh open honor whichever entry point (QR button vs OTP
  // link) the vendor just clicked, instead of getting stuck on whatever
  // mode the very first open used.
  useEffect(() => {
    pendingCredentialRef.current = null;
    /* eslint-disable react-hooks/set-state-in-effect */
    setVerifiedOrder(null);
    setErrorMessage(null);
    setManualCode("");
    setOtpDigits(Array(PICKUP_OTP_LENGTH).fill(""));
    setMode(isOpen ? initialMode : "qr");
    /* eslint-enable react-hooks/set-state-in-effect */
    if (!isOpen) {
      stopCamera();
      setCameraState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Camera only ever runs while the modal is open AND in QR mode —
  // starting it (an external system, getUserMedia) is exactly what
  // effects are for.
  useEffect(() => {
    if (isOpen && mode === "qr") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCamera();
      return () => stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Returning from Android Settings or background — automatically
  // re-check permission and initialize camera if granted.
  useEffect(() => {
    if (!isOpen || mode !== "qr") return;

    const handleAppResume = () => {
      if (cameraState === "denied" || cameraState === "permanently-denied") {
        startCamera();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleAppResume();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", handleAppResume);

    let cleanCapacitorListener: (() => void) | null = null;
    import("@capacitor/app")
      .then(({ App }) => {
        const appStatePromise = App.addListener("appStateChange", (state) => {
          if (state.isActive) handleAppResume();
        });
        const resumePromise = App.addListener("resume", () => {
          handleAppResume();
        });
        cleanCapacitorListener = () => {
          appStatePromise.then((h) => h.remove());
          resumePromise.then((h) => h.remove());
        };
      })
      .catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", handleAppResume);
      if (cleanCapacitorListener) cleanCapacitorListener();
    };
  }, [isOpen, mode, cameraState, startCamera]);

  const switchToOtp = () => {
    stopCamera();
    setErrorMessage(null);
    setMode("otp");
  };

  const switchToQr = () => {
    setErrorMessage(null);
    setOtpDigits(Array(PICKUP_OTP_LENGTH).fill(""));
    setMode("qr");
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setOtpDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    // Supports paste: a multi-digit value fills this box and onward.
    setOtpDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const digit of digits) {
        if (cursor >= PICKUP_OTP_LENGTH) break;
        next[cursor] = digit;
        cursor++;
      }
      const focusIndex = Math.min(cursor, PICKUP_OTP_LENGTH - 1);
      otpInputRefs.current[focusIndex]?.focus();
      return next;
    });
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Each box only ever holds one typed digit (maxLength=1 below), so a
  // real multi-digit paste needs its own handler — the browser would
  // otherwise truncate it to a single character before onChange fires.
  const handleOtpPaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!/\d/.test(pasted)) return;
    e.preventDefault();
    handleOtpDigitChange(index, pasted);
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== PICKUP_OTP_LENGTH) return;
    await verifyCredential({ type: "otp", value: code }, "Unable to verify this OTP.");
  };

  const handleCompleteOrder = async () => {
    if (!verifiedOrder) return;
    const credential = pendingCredentialRef.current;
    if (!credential) return;

    setIsBusy(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/vendor/orders/complete-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          credential.type === "qr"
            ? { qrValue: credential.value }
            : { otpValue: credential.value },
        ),
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
              {verifiedOrder ? "Order Verified" : mode === "otp" ? "Verify Order" : "Scan Order QR"}
            </h3>
            {!verifiedOrder && (
              <p className="text-caption text-faint">
                {mode === "otp"
                  ? "Enter the customer's order verification code."
                  : "Position the customer's QR inside the frame."}
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
          ) : mode === "otp" ? (
            /* ---------- Manual OTP entry ---------- */
            <div className="flex flex-col gap-4">
              <p className="text-center font-display text-caption font-bold text-muted">
                Enter the customer&apos;s {PICKUP_OTP_LENGTH}-digit OTP
              </p>

              <div className="flex items-center justify-center gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={(e) => handleOtpPaste(idx, e)}
                    className="h-14 w-12 rounded-xl border border-border bg-surface-elevated text-center font-mono text-title font-extrabold text-foreground focus:border-primary focus:outline-none"
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger-soft/40 p-3 text-caption font-semibold text-danger">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <div>
                    <p className="font-bold">Incorrect OTP</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isBusy || otpDigits.some((d) => !d)}
                className="w-full rounded-xl bg-primary py-3.5 font-display text-body-sm font-extrabold uppercase tracking-widest text-on-primary shadow-glow-primary transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
              >
                {isBusy ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={switchToQr}
                className="w-full rounded-xl border border-border py-2.5 font-display text-caption font-bold uppercase tracking-wider text-muted hover:text-foreground"
              >
                ← Back to QR Scanner
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
                    {(cameraState === "denied" || cameraState === "permanently-denied") && (
                      <>
                        <span className="material-symbols-outlined text-[28px] text-danger">
                          videocam_off
                        </span>
                        <p className="font-display text-body-sm font-bold text-foreground">
                          Camera permission required
                        </p>
                        <p className="text-caption text-muted">
                          Allow camera access to scan customer Order QR codes.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="rounded-lg bg-primary px-3 py-1.5 font-display text-caption font-bold text-on-primary shadow-glow-primary transition-all active:scale-95 hover:opacity-90"
                          >
                            Retry Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => openAppSettings()}
                            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 font-display text-caption font-bold text-foreground transition-all active:scale-95 hover:bg-surface"
                          >
                            Open Settings
                          </button>
                        </div>
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

              <div className="flex items-center gap-3 text-caption font-bold uppercase tracking-wider text-faint">
                <div className="h-px flex-1 bg-border" />
                OR
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={switchToOtp}
                className="w-full rounded-xl border border-primary/40 py-3 font-display text-body-sm font-extrabold uppercase tracking-widest text-primary transition-all active:scale-[0.98] hover:bg-primary/10"
              >
                Enter OTP Manually
              </button>

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
