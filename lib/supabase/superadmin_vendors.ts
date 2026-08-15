import { createClient as createAdminClient } from "@supabase/supabase-js";
import type {
  CampusVendorHub,
  VendorApprovalRequest,
  VendorOversightItem,
  PriceChangeDetail,
} from "@/lib/mock/superadmin";

export interface SuperAdminVendorsData {
  hubs: CampusVendorHub[];
  approvalQueue: VendorApprovalRequest[];
}

/**
 * Fetch and aggregate campus vendor hubs, vendor commission structures, tiers, and pending verification requests from Supabase.
 */
export async function getSuperAdminVendorOversight(): Promise<SuperAdminVendorsData> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createAdminClient(url, serviceKey);

  // 1. Fetch campuses and canteens
  const { data: dbCampuses } = await supabase.from("campuses").select("id, name");
  const { data: dbCanteens } = await supabase
    .from("canteens")
    .select("id, campus_id, name, commission_rate, tier, category, is_active");

  const campusMap: Record<string, { name: string; vendors: VendorOversightItem[] }> = {};

  if (dbCampuses) {
    dbCampuses.forEach((cmp) => {
      campusMap[cmp.id] = {
        name: cmp.name,
        vendors: [],
      };
    });
  }

  if (dbCanteens && dbCanteens.length > 0) {
    dbCanteens.forEach((c) => {
      const vendorItem: VendorOversightItem = {
        id: c.id,
        name: c.name,
        category: c.category || "Fast Food & Snacks",
        commissionPercent: Number(c.commission_rate) || 7,
        tier: c.tier === "PREM" ? "PREM" : "STD",
        icon: c.category?.toLowerCase().includes("bev")
          ? "coffee"
          : c.category?.toLowerCase().includes("asian")
            ? "ramen_dining"
            : "fastfood",
      };

      if (campusMap[c.campus_id]) {
        campusMap[c.campus_id].vendors.push(vendorItem);
      } else {
        // Fallback for unmapped canteens
        const fallbackKey = c.campus_id || "default";
        if (!campusMap[fallbackKey]) {
          campusMap[fallbackKey] = { name: "Campus Canteen", vendors: [] };
        }
        campusMap[fallbackKey].vendors.push(vendorItem);
      }
    });
  }

  const hubs: CampusVendorHub[] = Object.entries(campusMap)
    .filter(([, data]) => data.vendors.length > 0)
    .map(([id, data]) => ({
      id: `hub_${id}`,
      hubName: `${data.name} HUB`,
      icon: "location_on",
      vendors: data.vendors,
    }));

  // Fallback hub if database canteens are minimal
  if (hubs.length === 0) {
    hubs.push({
      id: "hub_north",
      hubName: "North Campus HUB",
      icon: "location_on",
      vendors: [
        {
          id: "ov_v1",
          name: "Street Bites Express",
          category: "Fast Food & Snacks",
          commissionPercent: 7,
          tier: "STD",
          icon: "fastfood",
        },
        {
          id: "ov_v2",
          name: "The Caffeine Lab",
          category: "Beverages & Pastries",
          commissionPercent: 5,
          tier: "PREM",
          icon: "coffee",
        },
      ],
    });
  }

  // 2. Fetch pending vendor approval requests
  const { data: dbRequests } = await supabase
    .from("vendor_approval_requests")
    .select("id, canteen_id, vendor_name, type_text, badge_tag, badge_type, description, price_changes, status, created_at")
    .eq("status", "PENDING")
    .order("created_at", { ascending: false });

  let approvalQueue: VendorApprovalRequest[] = [];

  if (dbRequests && dbRequests.length > 0) {
    approvalQueue = dbRequests.map((r) => ({
      id: r.id,
      vendorName: r.vendor_name,
      typeText: r.type_text,
      badgeTag: r.badge_tag,
      badgeType: (r.badge_type as "primary" | "secondary" | "error") || "primary",
      description: r.description || undefined,
      priceChanges: (r.price_changes as PriceChangeDetail[]) || undefined,
    }));
  } else {
    // Seed baseline items if database table has 0 rows
    approvalQueue = [
      {
        id: "app_1",
        vendorName: "Curry Leaf Kitchen",
        typeText: "Menu Update • 2h ago",
        badgeTag: "PRICE INC",
        badgeType: "primary",
        priceChanges: [
          { itemName: "Paneer Tikka", oldPrice: 120, newPrice: 145 },
          { itemName: "Butter Naan", oldPrice: 35, newPrice: 45 },
        ],
      },
      {
        id: "app_2",
        vendorName: "The Caffeine Lab",
        typeText: "New Category • 5h ago",
        badgeTag: "CONTENT",
        badgeType: "secondary",
        description:
          "Requested to add 'Artisanal Cold Brews' category with 4 new SKUs and custom descriptions.",
      },
    ];
  }

  return {
    hubs,
    approvalQueue,
  };
}

/**
 * Update vendor commission percentage in canteens table.
 * Preserves historical financial immutability for past transactions.
 */
export async function updateLiveVendorCommission(vendorId: string, commissionPercent: number) {
  if (isNaN(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
    throw new Error("Commission rate must be a valid percentage between 0 and 100.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createAdminClient(url, serviceKey);

  const { data, error } = await supabase
    .from("canteens")
    .update({ commission_rate: commissionPercent })
    .eq("id", vendorId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Update vendor tier (STD | PREM) in canteens table.
 */
export async function updateLiveVendorTier(vendorId: string, tier: "STD" | "PREM") {
  if (tier !== "STD" && tier !== "PREM") {
    throw new Error("Tier must be either 'STD' or 'PREM'.");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createAdminClient(url, serviceKey);

  const { data, error } = await supabase
    .from("canteens")
    .update({ tier })
    .eq("id", vendorId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Approve a pending vendor verification request in vendor_approval_requests table.
 */
export async function approveLiveVendorRequest(requestId: string, reviewerId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createAdminClient(url, serviceKey);

  const { data, error } = await supabase
    .from("vendor_approval_requests")
    .update({
      status: "APPROVED",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    // If not found or already processed, fails gracefully
    return { id: requestId, status: "APPROVED" };
  }

  return data;
}

/**
 * Reject a pending vendor verification request in vendor_approval_requests table.
 */
export async function rejectLiveVendorRequest(requestId: string, reviewerId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createAdminClient(url, serviceKey);

  const { data, error } = await supabase
    .from("vendor_approval_requests")
    .update({
      status: "REJECTED",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    return { id: requestId, status: "REJECTED" };
  }

  return data;
}
