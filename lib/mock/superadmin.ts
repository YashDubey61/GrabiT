export interface SuperAdminKpis {
  totalGmv: number;
  gmvGrowthPercent: number;
  activeCampuses: number;
  activeStudents: number;
  studentsGrowthText: string;
  platformCommissionPercent: number;
  netRevenue: number;
}

export interface SystemAlertItem {
  id: string;
  title: string;
  subtitle: string;
  timestampText: string;
  severity: "error" | "warning" | "info";
}

export interface TransactionStreamLog {
  id: string;
  txCode: string;
  campusName: string;
  amount: number;
  status: "Settled" | "Pending";
  timeText: string;
}

export interface SuperAdminCampus {
  id: string;
  name: string;
  location: string;
  vendorCount: number;
  vendorNewDelta?: number;
  dailyOrders: number;
  ordersCapacityPercent: number;
  logisticsLeadName: string;
  logisticsLeadInitials: string;
  status: "ACTIVE" | "MAINTENANCE" | "PRE_ONBOARDING";
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface CampusActivityFeedItem {
  id: string;
  title: string;
  description: string;
  timestampText: string;
  type: "new" | "milestone" | "alert";
}

export interface VendorOversightItem {
  id: string;
  name: string;
  category: string;
  commissionPercent: number;
  tier: "STD" | "PREM";
  icon: string;
}

export interface CampusVendorHub {
  id: string;
  hubName: string;
  icon: string;
  vendors: VendorOversightItem[];
}

export interface PriceChangeDetail {
  itemName: string;
  oldPrice: number;
  newPrice: number;
}

export interface VendorApprovalRequest {
  id: string;
  vendorName: string;
  typeText: string;
  badgeTag: string;
  badgeType: "primary" | "secondary" | "error";
  description?: string;
  priceChanges?: PriceChangeDetail[];
}

// Live KPIs/alerts/transactions are fetched from Supabase via
// GET /api/superadmin/dashboard — no hardcoded sample data here.

// Live campus/vendor data is fetched from Supabase via
// getSuperAdminCampuses() (lib/supabase/superadmin_campuses.ts) — no
// hardcoded sample campuses/activities here.

export const INITIAL_VENDOR_OVERSIGHT_HUBS: CampusVendorHub[] = [
  {
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
  },
  {
    id: "hub_south",
    hubName: "South Quad Dining",
    icon: "map",
    vendors: [
      {
        id: "ov_v3",
        name: "Wok N Roll",
        category: "Pan-Asian Cuisine",
        commissionPercent: 8,
        tier: "STD",
        icon: "ramen_dining",
      },
      {
        id: "ov_v4",
        name: "Curry Leaf Kitchen",
        category: "North Indian Thali",
        commissionPercent: 6,
        tier: "PREM",
        icon: "restaurant_menu",
      },
    ],
  },
];

export const INITIAL_VENDOR_APPROVAL_QUEUE: VendorApprovalRequest[] = [
  {
    id: "app_1",
    vendorName: "Curry Leaf",
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
  {
    id: "app_3",
    vendorName: "Street Bites Express",
    typeText: "Inventory • 8h ago",
    badgeTag: "URGENT",
    badgeType: "error",
    description:
      "Emergency delisting of 'Monsoon Special Pakodas' due to ingredient shortage.",
  },
];
