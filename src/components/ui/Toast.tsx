"use client";

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  info: "ℹ",
};

const COLORS: Record<ToastType, string> = {
  success: "border-success/40 bg-success/10",
  error: "border-error/40 bg-error/10",
  info: "border-accent/40 bg-accent/10",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  useEffect(() => {
    addToastFn = (message: string, type: ToastType = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setExiting((prev) => new Set(prev).add(id));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
          setExiting((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 250);
      }, 3000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto rounded-xl border px-4 py-3
            backdrop-blur-md shadow-lg max-w-sm w-full
            flex items-center gap-3
            ${COLORS[t.type]}
            ${exiting.has(t.id) ? "animate-toast-out" : "animate-toast-in"}
          `}
        >
          <span className="text-sm font-semibold">{ICONS[t.type]}</span>
          <p className="text-sm text-text">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
