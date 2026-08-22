"use client";

import { useState } from "react";

export interface OrderContactActionsProps {
  vendorName?: string;
  vendorPhone?: string;
  orderNumber?: string;
}

export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

export function OrderContactActions({
  vendorName = "Stall",
  vendorPhone,
  orderNumber,
}: OrderContactActionsProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCallStall = () => {
    const rawPhone = vendorPhone?.trim();
    if (!rawPhone) {
      showToast("Vendor phone number is not available.");
      return;
    }

    window.location.href = `tel:${rawPhone}`;
  };

  const handleWhatsAppMessage = () => {
    const rawPhone = vendorPhone?.trim();
    if (!rawPhone) {
      showToast("Vendor WhatsApp number is not available.");
      return;
    }

    const cleanNumber = normalizeWhatsAppNumber(rawPhone);
    const orderLabel = orderNumber ? `\nOrder: ${orderNumber}` : "";
    const messageText = `Hi ${vendorName}, I have a GRABIT order and need some help.${orderLabel}`;
    const encodedText = encodeURIComponent(messageText);

    const waUrl = `https://wa.me/${cleanNumber}?text=${encodedText}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-2">
      {toastMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center text-caption font-semibold text-amber-400 animate-fade-in">
          {toastMessage}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleCallStall}
          aria-label={`Call ${vendorName}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface py-4 text-caption font-700 text-foreground transition-transform active:scale-95 hover:border-primary/40 hover:bg-surface-elevated"
        >
          <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">
            call
          </span>
          Call Stall
        </button>
        <button
          type="button"
          onClick={handleWhatsAppMessage}
          aria-label={`Message ${vendorName} on WhatsApp`}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface py-4 text-caption font-700 text-foreground transition-transform active:scale-95 hover:border-emerald-500/40 hover:bg-surface-elevated"
        >
          <span className="material-symbols-outlined text-lg text-emerald-400" aria-hidden="true">
            chat_bubble
          </span>
          Message
        </button>
      </div>
    </div>
  );
}
