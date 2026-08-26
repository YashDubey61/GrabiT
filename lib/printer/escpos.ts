import type { ReceiptOrder } from "@/components/shared/receipt-printer/types";
import type { PaperWidth, TestPrintData } from "./types";

// Common ESC/POS Command Constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Helper: Wrap text to max columns with word boundaries
export function wrapText(text: string, maxCols: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    if (word.length > maxCols) {
      // If single word exceeds maxCols, split by chunk
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      for (let i = 0; i < word.length; i += maxCols) {
        lines.push(word.substring(i, i + maxCols));
      }
      continue;
    }

    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCols) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Helper: Format a 2-column row (left text, right text)
export function formatRow(left: string, right: string, maxCols: number): string[] {
  const cleanLeft = left.trim();
  const cleanRight = right.trim();

  // If both fit on a single line
  if (cleanLeft.length + 1 + cleanRight.length <= maxCols) {
    const spaces = " ".repeat(maxCols - cleanLeft.length - cleanRight.length);
    return [cleanLeft + spaces + cleanRight];
  }

  // If right value fits on the first line with some space for left
  if (cleanRight.length < maxCols - 4) {
    const maxLeftWidth = maxCols - cleanRight.length - 1;
    const leftLines = wrapText(cleanLeft, maxLeftWidth);
    if (leftLines.length > 0) {
      const firstLine = leftLines[0];
      const spaces = " ".repeat(maxCols - firstLine.length - cleanRight.length);
      const res = [firstLine + spaces + cleanRight];
      for (let i = 1; i < leftLines.length; i++) {
        res.push(leftLines[i]);
      }
      return res;
    }
  }

  // Fallback for very long left and right: print left line(s), then right right-aligned
  const leftLines = wrapText(cleanLeft, maxCols);
  const rightLines = wrapText(cleanRight, maxCols);
  return [...leftLines, ...rightLines.map((r) => r.padStart(maxCols, " "))];
}

/**
 * Low-level ESC/POS buffer builder
 */
export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.buffer.push(ESC, 0x40); // Initialize printer
    return this;
  }

  alignLeft(): this {
    this.buffer.push(ESC, 0x61, 0x00);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(ESC, 0x61, 0x01);
    return this;
  }

  alignRight(): this {
    this.buffer.push(ESC, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean): this {
    this.buffer.push(ESC, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  textNormal(): this {
    this.buffer.push(GS, 0x21, 0x00); // Normal size
    return this;
  }

  textDoubleHeight(): this {
    this.buffer.push(GS, 0x21, 0x01);
    return this;
  }

  textDoubleWidth(): this {
    this.buffer.push(GS, 0x21, 0x10);
    return this;
  }

  textLarge(): this {
    this.buffer.push(GS, 0x21, 0x11); // Double height & double width
    return this;
  }

  text(str: string): this {
    // Convert string to bytes (ASCII/Latin-1 compatible for thermal printer)
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // Map rupee symbol '₹' to 'Rs.' if encountered
      if (str[i] === "₹") {
        this.buffer.push(0x52, 0x73, 0x2e); // "Rs."
      } else if (code <= 0x7f) {
        this.buffer.push(code);
      } else {
        // Fallback ASCII replacement
        this.buffer.push(0x3f); // '?'
      }
    }
    return this;
  }

  line(str: string = ""): this {
    if (str) {
      this.text(str);
    }
    this.buffer.push(LF);
    return this;
  }

  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  divider(cols: number, char: string = "-"): this {
    this.alignCenter();
    this.line(char.repeat(cols));
    this.alignLeft();
    return this;
  }

  cutPaper(): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, 0x41, 0x03); // GS V 'A' 3 -> partial/full cut with feed
    return this;
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  toBase64(): string {
    const bytes = this.getUint8Array();
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Formats a Date object to readable date and 12-hour time
 */
function formatDateTime(date: Date): { dateStr: string; timeStr: string } {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  let hours = date.getHours();
  const mins = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return {
    dateStr: `${day} ${month} ${year}`,
    timeStr: `${hours.toString().padStart(2, "0")}:${mins} ${ampm}`,
  };
}

/**
 * Builds the complete ESC/POS binary data for a Kitchen Receipt
 */
export function buildKitchenReceiptEscPos(order: ReceiptOrder, paperWidth: PaperWidth = "58mm"): Uint8Array {
  const maxCols = paperWidth === "80mm" ? 48 : 32;
  const builder = new EscPosBuilder();

  const { timeStr } = formatDateTime(order.createdAt || new Date());
  const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);

  // 1. Header & Branding
  builder.alignCenter();
  builder.bold(true);
  builder.textLarge();
  builder.line("GRABIT");

  builder.textNormal();
  builder.bold(true);
  builder.line("KITCHEN ORDER");
  builder.bold(false);
  builder.feed(1);

  // 2. Big Prominent Order Number
  builder.bold(true);
  builder.textLarge();
  builder.line(`ORDER #${order.id}`);
  builder.textNormal();
  builder.bold(false);

  // Vendor / Canteen Name
  if (order.vendorName) {
    const vendorLines = wrapText(order.vendorName.toUpperCase(), maxCols);
    vendorLines.forEach((vl) => builder.line(vl));
  }

  // Divider
  builder.divider(maxCols, "=");

  // 3. Order Metadata (Type, Time, Customer)
  builder.alignLeft();
  if (order.orderType) {
    formatRow("ORDER TYPE:", order.orderType.toUpperCase(), maxCols).forEach((l) => builder.line(l));
  }
  formatRow("ORDER TIME:", timeStr, maxCols).forEach((l) => builder.line(l));
  if (order.customerName) {
    formatRow("CUSTOMER:", order.customerName, maxCols).forEach((l) => builder.line(l));
  }

  builder.divider(maxCols, "-");

  // 4. Kitchen Items List
  order.items.forEach((item, idx) => {
    builder.alignLeft();
    builder.bold(true);
    builder.textDoubleHeight();
    const itemHeader = `${item.quantity}x ${item.name.toUpperCase()}`;
    const wrappedHeader = wrapText(itemHeader, maxCols);
    wrappedHeader.forEach((line) => builder.line(line));
    builder.textNormal();
    builder.bold(false);

    // Variants / Add-ons
    if (item.variants && item.variants.length > 0) {
      item.variants.forEach((v) => {
        const varLines = wrapText(`  + ${v}`, maxCols);
        varLines.forEach((vl) => builder.line(vl));
      });
    }

    // Item-specific instructions/notes
    if (item.specialInstructions) {
      const noteLines = wrapText(`  NOTE: ${item.specialInstructions}`, maxCols);
      builder.bold(true);
      noteLines.forEach((nl) => builder.line(nl));
      builder.bold(false);
    }

    if (idx < order.items.length - 1) {
      builder.feed(1);
    }
  });

  // 5. Global Special Instructions / Kitchen Notes
  if (order.specialInstructions) {
    builder.divider(maxCols, "-");
    builder.bold(true);
    builder.alignCenter();
    builder.line("** SPECIAL INSTRUCTIONS **");
    builder.alignLeft();
    const notes = wrapText(order.specialInstructions.toUpperCase(), maxCols);
    notes.forEach((nl) => builder.line(nl));
    builder.bold(false);
  }

  // 6. Summary Section
  builder.divider(maxCols, "=");
  builder.alignLeft();
  builder.bold(true);
  formatRow("TOTAL ITEMS:", String(order.items.length), maxCols).forEach((l) => builder.line(l));
  formatRow("TOTAL QUANTITY:", String(totalQty), maxCols).forEach((l) => builder.line(l));
  builder.bold(false);

  // 7. Order Status & Footer
  builder.divider(maxCols, "-");
  builder.alignCenter();
  builder.bold(true);
  builder.line(`STATUS: ${order.status || "PREPARING"}`);
  builder.bold(false);
  builder.line("--- KITCHEN COPY ---");

  // Feed and cut
  builder.cutPaper();

  return builder.getUint8Array();
}

/**
 * Builds the ESC/POS binary data for a Test Print
 */
export function buildTestPrintEscPos(data: TestPrintData): Uint8Array {
  const maxCols = data.paperWidth === "80mm" ? 48 : 32;
  const builder = new EscPosBuilder();
  const now = new Date();
  const { dateStr, timeStr } = formatDateTime(now);

  builder.alignCenter();
  builder.bold(true);
  builder.textLarge();
  builder.line("GRABIT");
  builder.textNormal();
  builder.line("VENDOR TEST PRINT");
  builder.feed(1);

  builder.divider(maxCols, "=");

  builder.alignLeft();
  formatRow("Printer:", data.printerName, maxCols).forEach((l) => builder.line(l));
  formatRow("Paper Size:", data.paperWidth, maxCols).forEach((l) => builder.line(l));
  formatRow("Connection:", data.connectionType.toUpperCase(), maxCols).forEach((l) => builder.line(l));
  if (data.addressOrIp) {
    formatRow("Identifier:", data.addressOrIp, maxCols).forEach((l) => builder.line(l));
  }
  formatRow("Date:", dateStr, maxCols).forEach((l) => builder.line(l));
  formatRow("Time:", timeStr, maxCols).forEach((l) => builder.line(l));

  builder.divider(maxCols, "-");

  builder.alignCenter();
  builder.bold(true);
  builder.line("Printer Connection OK");
  builder.line("Thermal Head Status: READY");
  builder.bold(false);

  builder.divider(maxCols, "=");
  builder.alignCenter();
  builder.line("Thank You");

  builder.cutPaper();

  return builder.getUint8Array();
}

/**
 * Converts a Uint8Array into a Base64 string for native bridge transport
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
