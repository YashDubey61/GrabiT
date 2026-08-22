export interface VendorOffer {
  id: string;
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit?: number;
  perUserLimit: number;
  startsAtIso?: string;
  expiresAtIso?: string;
  isActive: boolean;
  isPublished: boolean;
  status: "ACTIVE" | "SCHEDULED" | "PAUSED" | "EXPIRED";
  canteenId?: string;
  usageCount: number;
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
  createdAtIso: string;
}

export interface OfferRedemptionLog {
  id: string;
  orderId?: string;
  orderNumber?: string;
  studentName?: string;
  discountAmount: number;
  orderTotal?: number;
  createdAtIso: string;
}

export function calculateOfferStatus(
  isActive: boolean,
  startsAt?: string,
  expiresAt?: string,
): "ACTIVE" | "SCHEDULED" | "PAUSED" | "EXPIRED" {
  if (!isActive) return "PAUSED";
  const now = new Date();
  if (startsAt && new Date(startsAt) > now) return "SCHEDULED";
  if (expiresAt && new Date(expiresAt) < now) return "EXPIRED";
  return "ACTIVE";
}

/**
 * Fetch vendor offers from server API.
 */
export async function getLiveVendorOffers(): Promise<{
  offers: VendorOffer[];
  stats: {
    activeOffersCount: number;
    scheduledOffersCount: number;
    expiredOffersCount: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    totalRevenueGenerated: number;
  };
}> {
  try {
    const res = await fetch("/api/vendor/offers", {
      headers: { "Cache-Control": "no-cache" },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        offers: [],
        stats: {
          activeOffersCount: 0,
          scheduledOffersCount: 0,
          expiredOffersCount: 0,
          totalRedemptions: 0,
          totalDiscountGiven: 0,
          totalRevenueGenerated: 0,
        },
      };
    }
    return {
      offers: data.offers ?? [],
      stats: data.stats ?? {
        activeOffersCount: 0,
        scheduledOffersCount: 0,
        expiredOffersCount: 0,
        totalRedemptions: 0,
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0,
      },
    };
  } catch {
    return {
      offers: [],
      stats: {
        activeOffersCount: 0,
        scheduledOffersCount: 0,
        expiredOffersCount: 0,
        totalRedemptions: 0,
        totalDiscountGiven: 0,
        totalRevenueGenerated: 0,
      },
    };
  }
}

/**
 * Create a new vendor offer via server API.
 */
export async function createLiveVendorOffer(payload: {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/vendor/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Failed to create offer." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error creating offer." };
  }
}

/**
 * Update an existing vendor offer via server API.
 */
export async function updateLiveVendorOffer(
  id: string,
  payload: Partial<{
    code: string;
    description: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    maxDiscount: number;
    minOrderValue: number;
    usageLimit: number;
    perUserLimit: number;
    startsAt: string;
    expiresAt: string;
    isActive: boolean;
  }>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/vendor/offers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Failed to update offer." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error updating offer." };
  }
}

/**
 * Delete a vendor offer via server API.
 */
export async function deleteLiveVendorOffer(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/vendor/offers/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error ?? "Failed to delete offer." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error deleting offer." };
  }
}

/**
 * Fetch redemption logs for a specific offer.
 */
export async function getLiveVendorOfferRedemptions(
  offerId: string,
): Promise<OfferRedemptionLog[]> {
  try {
    const res = await fetch(`/api/vendor/offers/${offerId}/redemptions`);
    const data = await res.json();
    if (!res.ok || !data.ok || !data.redemptions) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.redemptions.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      orderNumber: r.orders?.order_number ?? "Order",
      studentName: "Campus Student",
      discountAmount: Number(r.discount_amount),
      orderTotal: Number(r.orders?.total_amount ?? 0),
      createdAtIso: r.created_at,
    }));
  } catch {
    return [];
  }
}
