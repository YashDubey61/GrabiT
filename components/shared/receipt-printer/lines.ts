import type { ReceiptOrder } from "./types";

export type ReceiptLine =
  | { kind: "text"; text: string; cls?: string }
  | { kind: "row"; label: string; value: string; cls?: string }
  | { kind: "barcode"; orderId: string };

function divider(width = 32): ReceiptLine {
  return { kind: "text", text: "-".repeat(width), cls: "text-[#b9b3a2]" };
}

function money(n: number): string {
  return "₹" + Math.round(n).toString();
}

function formatDateTime(date: Date): { date: string; time: string } {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  let hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return {
    date: `${day} ${month} ${year}`,
    time: `${hours.toString().padStart(2, "0")}:${mins} ${ampm}`,
  };
}

/** Student order receipt — confirmation + order/payment summary. */
export function buildStudentLines(order: ReceiptOrder): ReceiptLine[] {
  const { date, time } = formatDateTime(order.createdAt);
  const lines: ReceiptLine[] = [];

  lines.push({ kind: "text", text: "GRABIT", cls: "text-center font-bold tracking-[0.22em] text-[13px]" });
  lines.push({ kind: "text", text: "ORDER RECEIPT", cls: "text-center font-bold tracking-[0.14em] text-[11px] mt-0.5" });
  lines.push({ kind: "text", text: "#" + order.id, cls: "text-center font-semibold" });
  lines.push({ kind: "text", text: "" });
  lines.push({ kind: "text", text: order.vendorName, cls: "text-center text-[#3c3a35]" });
  lines.push(divider());

  order.items.forEach((item) => {
    lines.push({
      kind: "row",
      label: `${item.quantity} × ${item.name}`,
      value: item.price != null ? money(item.price * item.quantity) : "",
      cls: "font-bold",
    });
    (item.variants || []).forEach((v) => {
      lines.push({ kind: "text", text: "+ " + v, cls: "pl-3.5 text-[#57534b]" });
    });
  });

  lines.push(divider());
  lines.push({ kind: "row", label: "Subtotal", value: money(order.subtotal), cls: "text-[#57534b]" });
  lines.push({ kind: "row", label: "Tax", value: money(order.tax ?? 0), cls: "text-[#57534b]" });
  lines.push(divider());
  lines.push({ kind: "row", label: "TOTAL", value: money(order.total), cls: "font-bold" });
  lines.push(divider());

  lines.push({ kind: "row", label: "ORDER #", value: order.id });
  if (order.paymentMethod) lines.push({ kind: "row", label: "PAYMENT", value: order.paymentMethod });
  lines.push({ kind: "row", label: "STATUS", value: order.status });
  lines.push({ kind: "row", label: "DATE", value: date });
  lines.push({ kind: "row", label: "TIME", value: time });
  lines.push({ kind: "text", text: "" });
  lines.push({ kind: "barcode", orderId: order.id });
  lines.push(divider());
  lines.push({ kind: "text", text: "Thank you for using GRABIT", cls: "text-center text-[#57534b]" });

  return lines;
}

/** Vendor kitchen receipt — preparation instructions, never payment info. */
export function buildVendorLines(order: ReceiptOrder): ReceiptLine[] {
  const { time } = formatDateTime(order.createdAt);
  const totalItems = order.items.length;
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

  const specialInstructions: string[] = [];
  if (order.specialInstructions) specialInstructions.push(order.specialInstructions);
  order.items.forEach((it) => {
    if (it.specialInstructions) specialInstructions.push(it.specialInstructions);
  });

  const lines: ReceiptLine[] = [];
  lines.push({ kind: "text", text: "GRABIT", cls: "text-center font-bold tracking-[0.22em] text-[13px]" });
  lines.push({ kind: "text", text: "KITCHEN ORDER", cls: "text-center font-bold tracking-[0.14em] text-[11px] mt-0.5" });
  lines.push({ kind: "text", text: "#" + order.id, cls: "text-center font-semibold" });
  lines.push({ kind: "text", text: "" });
  lines.push({ kind: "text", text: order.vendorName, cls: "text-center text-[#3c3a35]" });
  lines.push(divider());

  lines.push({ kind: "row", label: "ORDER TYPE", value: order.orderType });
  lines.push({ kind: "row", label: "ORDER TIME", value: time });
  if (order.customerName) lines.push({ kind: "row", label: "CUSTOMER", value: order.customerName });
  lines.push(divider());

  order.items.forEach((item, idx) => {
    lines.push({ kind: "text", text: `${item.quantity} × ${item.name.toUpperCase()}`, cls: "font-bold text-[13px]" });
    (item.variants || []).forEach((v) => {
      lines.push({ kind: "text", text: "+ " + v.toUpperCase(), cls: "pl-3.5 font-semibold text-[#2c2a26]" });
    });
    if (idx < order.items.length - 1) lines.push({ kind: "text", text: "" });
  });

  if (specialInstructions.length) {
    lines.push(divider());
    lines.push({ kind: "text", text: "SPECIAL INSTRUCTIONS", cls: "font-bold tracking-[0.08em]" });
    specialInstructions.forEach((note) => {
      lines.push({
        kind: "text",
        text: note.toUpperCase(),
        cls: "font-bold rounded border border-dashed border-[rgba(217,107,95,0.55)] bg-[rgba(217,107,95,0.14)] px-2 py-1",
      });
    });
  }

  lines.push(divider());
  lines.push({ kind: "row", label: "TOTAL ITEMS", value: String(totalItems) });
  lines.push({ kind: "row", label: "TOTAL QUANTITY", value: String(totalQty) });
  lines.push(divider());

  lines.push({ kind: "text", text: "ORDER # " + order.id, cls: "text-center font-semibold" });
  lines.push({ kind: "barcode", orderId: order.id });
  lines.push(divider());
  lines.push({ kind: "text", text: "PREPARE ORDER", cls: "text-center font-bold tracking-[0.12em]" });
  lines.push({ kind: "text", text: "GRABIT", cls: "text-center" });

  return lines;
}
