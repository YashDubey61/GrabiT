export interface ReceiptItem {
  name: string;
  quantity: number;
  price?: number;
  variants?: string[];
  specialInstructions?: string;
}

/**
 * Normalized shape both Student `Order` and Vendor `VendorOrder` are
 * adapted into before reaching ReceiptPrinter — the printer never reads
 * either app-specific order type directly, so it stays reusable and the
 * receipt logic never duplicates between the two apps.
 */
export interface ReceiptOrder {
  id: string;
  vendorName: string;
  orderType: "PICKUP" | "DELIVERY" | "DINE-IN";
  status: string;
  createdAt: Date;
  paymentMethod?: string;
  customerName?: string;
  items: ReceiptItem[];
  specialInstructions?: string;
  subtotal: number;
  tax?: number;
  total: number;
}

export type ReceiptMode = "student" | "vendor";
