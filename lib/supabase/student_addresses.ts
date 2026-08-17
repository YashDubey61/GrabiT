export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  city: string;
  isDefault: boolean;
  createdAt: string;
}

export async function getLiveStudentAddresses(): Promise<SavedAddress[]> {
  try {
    const res = await fetch("/api/student/addresses", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.ok && Array.isArray(data.addresses)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.addresses.map((a: any) => ({
        id: a.id,
        userId: a.user_id,
        label: a.label,
        addressLine: a.address_line,
        city: a.city || "Kanpur",
        isDefault: Boolean(a.is_default),
        createdAt: a.created_at,
      }));
    }

    return [];
  } catch {
    return [];
  }
}

export async function createStudentAddress(payload: {
  label: string;
  addressLine: string;
  city?: string;
  isDefault?: boolean;
}): Promise<{ ok: boolean; error?: string; address?: SavedAddress }> {
  try {
    const res = await fetch("/api/student/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok && data.address) {
      return {
        ok: true,
        address: {
          id: data.address.id,
          userId: data.address.user_id,
          label: data.address.label,
          addressLine: data.address.address_line,
          city: data.address.city || "Kanpur",
          isDefault: Boolean(data.address.is_default),
          createdAt: data.address.created_at,
        },
      };
    }
    return { ok: false, error: data.error || "Failed to save address." };
  } catch {
    return { ok: false, error: "Network error saving address." };
  }
}

export async function deleteStudentAddress(addressId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/student/addresses?id=${encodeURIComponent(addressId)}`, {
      method: "DELETE",
    });

    const data = await res.json();
    return data;
  } catch {
    return { ok: false, error: "Network error deleting address." };
  }
}
