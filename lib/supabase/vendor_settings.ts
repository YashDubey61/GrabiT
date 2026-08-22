export interface VendorStoreSettingsData {
  canteenId: string;
  campusId: string;
  campusName: string;
  name: string;
  status: "active" | "inactive" | "closed" | "busy";
  category: string;
  tier: string;
  commissionRate: number;
  description: string;
  imageUrl: string;
  photoUrls: string[];
  cuisineTags: string;
  phone: string;
  email: string;
  prepTimeMinutes: number;
  openingTime: string;
  closingTime: string;
  operatingDays: string;
  announcementMessage: string;
  account: {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  };
  payoutAccount: {
    isConfigured: boolean;
    bankName: string;
    maskedAccountNumber: string;
    ifscCode: string;
    isVerified: boolean;
  };
}

export async function getLiveVendorStoreSettings(): Promise<{
  ok: boolean;
  data?: VendorStoreSettingsData;
  error?: string;
}> {
  try {
    const res = await fetch("/api/vendor/profile", {
      headers: { "Cache-Control": "no-cache" },
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to fetch store settings." };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    console.error("Fetch vendor store settings error:", err);
    return { ok: false, error: "Network error loading store settings." };
  }
}

export async function updateVendorStoreSettings(
  payload: Partial<{
    name: string;
    description: string;
    category: string;
    imageUrl: string;
    photoUrls: string[];
    cuisineTags: string;
    phone: string;
    email: string;
    status: "active" | "inactive" | "closed" | "busy";
    prepTimeMinutes: number;
    openingTime: string;
    closingTime: string;
    operatingDays: string;
    announcementMessage: string;
  }>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/vendor/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { ok: false, error: result.error ?? "Failed to save settings." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error saving settings." };
  }
}
