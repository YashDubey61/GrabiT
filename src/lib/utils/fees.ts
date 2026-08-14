import {
  FEE_THRESHOLD,
  TOTAL_PLATFORM_FEE,
  STUDENT_FEE_SHARE,
  VENDOR_FEE_SHARE,
} from "@/lib/constants";

export type FeeBreakdown = {
  platformFee: number; // total fee in paise
  studentFee: number;
  vendorFee: number;
};

/**
 * Calculate platform fees for an order.
 * - Orders ≤ ₹30 (3000 paise) = free
 * - Orders > ₹30 = ₹3.50 flat (₹2.50 student + ₹1.00 vendor)
 * - Gold subscribers = waived entirely
 */
export function calculateFees(
  orderTotalPaise: number,
  hasGoldSubscription: boolean
): FeeBreakdown {
  if (hasGoldSubscription || orderTotalPaise <= FEE_THRESHOLD) {
    return { platformFee: 0, studentFee: 0, vendorFee: 0 };
  }

  return {
    platformFee: TOTAL_PLATFORM_FEE,
    studentFee: STUDENT_FEE_SHARE,
    vendorFee: VENDOR_FEE_SHARE,
  };
}
