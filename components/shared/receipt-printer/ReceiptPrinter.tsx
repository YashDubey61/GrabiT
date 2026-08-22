"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Barcode } from "./Barcode";
import { buildStudentLines, buildVendorLines, type ReceiptLine } from "./lines";
import type { ReceiptMode, ReceiptOrder } from "./types";

type PrinterState = "idle" | "printing" | "printed" | "tearing";

/**
 * Reusable receipt-printer widget shared by the Student and Vendor apps.
 * `mode` drives everything (screen copy, receipt content/emphasis, action
 * labels) from the same component — there is exactly one printer, not one
 * per app. Business/order data is passed in as a normalized `ReceiptOrder`;
 * this component never touches Supabase or app-specific order types.
 */
export function ReceiptPrinter({
  mode,
  order,
  open,
  onClose,
  onViewOrder,
  onDone,
  onPrinted,
}: {
  mode: ReceiptMode;
  order: ReceiptOrder;
  open: boolean;
  onClose: () => void;
  onViewOrder?: () => void;
  onDone?: () => void;
  onPrinted?: () => void;
}) {
  const [state, setState] = useState<PrinterState>("idle");
  const [visibleCount, setVisibleCount] = useState(0);
  const [printedToday, setPrintedToday] = useState(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staggerTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const paperRef = useRef<HTMLDivElement>(null);
  const [paperHeight, setPaperHeight] = useState(10);
  const [tearing, setTearing] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lines: ReceiptLine[] = useMemo(
    () => (mode === "student" ? buildStudentLines(order) : buildVendorLines(order)),
    [mode, order],
  );

  const clearTimers = () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    staggerTimersRef.current.forEach(clearTimeout);
    staggerTimersRef.current = [];
    fallbackTimerRef.current = null;
  };

  useEffect(() => clearTimers, []);

  // Reset to a clean idle printer whenever a different order is shown.
  useEffect(() => {
    if (open) {
      clearTimers();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("idle");
      setVisibleCount(0);
      setPaperHeight(10);
      setTearing(false);
    }
  }, [open, order.id]);

  const startPrint = () => {
    if (state !== "idle") return; // re-entrancy guard
    setState("printing");
    setVisibleCount(0);

    requestAnimationFrame(() => {
      const target = paperRef.current?.scrollHeight ?? 400;
      setPaperHeight(target);
    });

    const stagger = prefersReducedMotion ? 0 : 60;
    const revealDelayBase = prefersReducedMotion ? 0 : 250;

    if (prefersReducedMotion) {
      setVisibleCount(lines.length);
    } else {
      lines.forEach((_, i) => {
        const t = setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), revealDelayBase + i * stagger);
        staggerTimersRef.current.push(t);
      });
    }

    const totalDuration = prefersReducedMotion
      ? 50
      : Math.max(1500, revealDelayBase + lines.length * stagger + 250);

    // Timeout fallback — never rely solely on animation/transition events.
    fallbackTimerRef.current = setTimeout(() => {
      setState((s) => (s === "printing" ? "printed" : s));
      onPrinted?.();
    }, totalDuration + 400);
  };

  const startTear = () => {
    if (state !== "printed") return; // re-entrancy guard
    setState("tearing");

    if (prefersReducedMotion) {
      completeTear();
      return;
    }

    setTearing(true);
    fallbackTimerRef.current = setTimeout(completeTear, 900);
  };

  const completeTear = () => {
    clearTimers();
    setTearing(false);
    setPaperHeight(10);
    setVisibleCount(0);
    if (mode === "vendor") setPrintedToday((n) => n + 1);
    setState("idle");
  };

  const statusText =
    state === "idle"
      ? "Ready to print"
      : state === "printing"
        ? mode === "student"
          ? "Printing receipt…"
          : "Printing kitchen receipt…"
        : state === "printed"
          ? mode === "student"
            ? "Receipt ready"
            : "Kitchen receipt ready"
          : "Tearing off receipt…";

  const total = order.total;
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <Modal open={open} onClose={onClose} title={mode === "student" ? "Order Receipt" : "Kitchen Receipt"}>
      <div className="text-foreground">
        {/* Screen */}
        <div className="rounded-xl border border-white/5 bg-black p-3.5 font-mono shadow-[inset_0_2px_10px_rgba(0,0,0,.6)]">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            {mode === "student" ? "Order Confirmed" : "Kitchen Order"}
          </div>
          <div className="flex items-baseline justify-between text-[15px] font-semibold text-white">
            <span>#{order.id}</span>
            <span>{mode === "student" ? `₹${Math.round(total)}` : `${totalQty} ITEMS`}</span>
          </div>
          <div className="mt-1 text-[11px] text-muted">
            {mode === "student" ? order.vendorName : state === "idle" ? "Ready to print" : statusText}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
            <span
              className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                state === "printing" ? "bg-primary" : "bg-success"
              }`}
            />
            <span>{mode === "student" ? "Payment successful" : "Ready"}</span>
          </div>
        </div>

        {/* Paper */}
        <div
          className="mx-auto mt-4 w-[85%] overflow-hidden drop-shadow-[0_10px_14px_rgba(0,0,0,.35)]"
          style={{
            height: paperHeight,
            transition: prefersReducedMotion ? "none" : "height 1.4s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1), opacity .45s ease",
            transform: tearing ? "translateY(50px) rotate(-2deg)" : "none",
            opacity: tearing ? 0 : 1,
          }}
        >
          <div ref={paperRef} className="bg-[#f6f1e4] px-3.5 pb-6 pt-4 text-[11.5px] leading-[1.55] text-[#191817]" style={{ fontFamily: "var(--font-body), ui-monospace, monospace" }}>
            {lines.map((line, i) => (
              <ReceiptLineView key={i} line={line} visible={i < visibleCount} />
            ))}
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted" role="status" aria-live="polite">
          {statusText}
        </p>

        {mode === "vendor" && (
          <p className="mt-1 text-center text-[11px] text-faint">Printed today: {printedToday}</p>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          {mode === "student" && onViewOrder && (
            <button
              type="button"
              onClick={onViewOrder}
              className="h-11 rounded-full border border-border text-body-sm font-semibold text-foreground hover:bg-white/5"
            >
              View Order
            </button>
          )}

          {state === "idle" && (
            <button
              type="button"
              onClick={startPrint}
              className="h-11 rounded-full bg-primary text-body-sm font-bold text-on-primary hover:opacity-90 active:scale-[0.98]"
            >
              {mode === "student" ? "Print Receipt" : "Print Kitchen Receipt"}
            </button>
          )}
          {state === "printing" && (
            <button type="button" disabled className="h-11 rounded-full bg-primary text-body-sm font-bold text-on-primary opacity-50">
              Printing…
            </button>
          )}
          {state === "printed" && (
            <button
              type="button"
              onClick={startTear}
              className="h-11 rounded-full bg-primary text-body-sm font-bold text-on-primary hover:opacity-90 active:scale-[0.98]"
            >
              Tear Off Receipt
            </button>
          )}
          {state === "tearing" && (
            <button type="button" disabled className="h-11 rounded-full bg-primary text-body-sm font-bold text-on-primary opacity-50">
              Tearing…
            </button>
          )}

          {mode === "student" ? (
            <button
              type="button"
              onClick={onDone ?? onClose}
              className="h-11 rounded-full border border-border text-body-sm font-semibold text-muted hover:bg-white/5"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full border border-border text-body-sm font-semibold text-muted hover:bg-white/5"
            >
              Return to Order
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ReceiptLineView({ line, visible }: { line: ReceiptLine; visible: boolean }) {
  const base = "transition-all duration-300";
  const style = { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" };

  if (line.kind === "barcode") {
    return (
      <div className={`${base} my-0.5`} style={style}>
        <Barcode orderId={line.orderId} />
      </div>
    );
  }
  if (line.kind === "row") {
    return (
      <div className={`${base} flex justify-between gap-2 ${line.cls ?? ""}`} style={style}>
        <span>{line.label}</span>
        <span>{line.value}</span>
      </div>
    );
  }
  return (
    <div className={`${base} ${line.cls ?? ""}`} style={style}>
      {line.text || " "}
    </div>
  );
}
