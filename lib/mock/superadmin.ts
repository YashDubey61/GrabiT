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

export const MOCK_SUPERADMIN_KPIS: SuperAdminKpis = {
  totalGmv: 1420892,
  gmvGrowthPercent: 12.4,
  activeCampuses: 142,
  activeStudents: 54302,
  studentsGrowthText: "+2.1k",
  platformCommissionPercent: 15.2,
  netRevenue: 215900,
};

export const MOCK_SYSTEM_ALERTS: SystemAlertItem[] = [
  {
    id: "alt_1",
    title: "Payment Gateway Latency Spike",
    subtitle: "Razorpay / UPI latency spike in North region",
    timestampText: "2 mins ago",
    severity: "error",
  },
  {
    id: "alt_2",
    title: "Campus Overload: PSIT Kanpur",
    subtitle: "Kitchen order density at 92% capacity during lunch rush",
    timestampText: "14 mins ago",
    severity: "warning",
  },
  {
    id: "alt_3",
    title: "New Vendor Verification",
    subtitle: '"Fresh Bites Canteen" submitted FSSAI credentials',
    timestampText: "42 mins ago",
    severity: "info",
  },
];

export const MOCK_TRANSACTION_LOGS: TransactionStreamLog[] = [
  {
    id: "tx_1",
    txCode: "#TX-9421",
    campusName: "PSIT Kanpur",
    amount: 245.0,
    status: "Settled",
    timeText: "12:04:01",
  },
  {
    id: "tx_2",
    txCode: "#TX-9420",
    campusName: "IIT Kanpur",
    amount: 1120.0,
    status: "Pending",
    timeText: "12:03:45",
  },
  {
    id: "tx_3",
    txCode: "#TX-9419",
    campusName: "BITS Pilani",
    amount: 189.9,
    status: "Settled",
    timeText: "12:03:12",
  },
  {
    id: "tx_4",
    txCode: "#TX-9418",
    campusName: "DU North Campus",
    amount: 562.0,
    status: "Settled",
    timeText: "12:02:59",
  },
  {
    id: "tx_5",
    txCode: "#TX-9417",
    campusName: "BHU Varanasi",
    amount: 340.5,
    status: "Settled",
    timeText: "12:01:30",
  },
];

export const INITIAL_SUPERADMIN_CAMPUSES: SuperAdminCampus[] = [
  {
    id: "cmp_1",
    name: "PSIT Kanpur",
    location: "Uttar Pradesh, India",
    vendorCount: 42,
    vendorNewDelta: 3,
    dailyOrders: 1840,
    ordersCapacityPercent: 80,
    logisticsLeadName: "Aryan Kapoor",
    logisticsLeadInitials: "AK",
    status: "ACTIVE",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnL6yucAYd9Pmi4RFLLpjUqnREaSik4Hr8cWfjb_4cRgTLKjsvS1FXpojDeCHE8K5sL6y2DCUvdoJ0pNqrVEjEw-dMlChm-A_NrJ2OaCiJIldBlaBdRTnVf2-RblrCkWjmGmv6KifqsrKdjlP4lECNuKWiq7ZWjQ4CTVDmEvDunlXkXpwIxncN-rjEu_Ty0TB2hrpsN07nWk_H2n7QqWcUVVC7lsZtqdx49maJ5ZUruKWncwZ8yTEk",
  },
  {
    id: "cmp_2",
    name: "Galgotias University",
    location: "Greater Noida, Delhi NCR",
    vendorCount: 58,
    dailyOrders: 2610,
    ordersCapacityPercent: 95,
    logisticsLeadName: "Sania Mirza",
    logisticsLeadInitials: "SM",
    status: "ACTIVE",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDXh1ho0ZzcaPiPBN4XmOTiDB-UC-u1D7hvaHopybSX5Tcy3mqbfr4r-3MHerbjQxbkE-q_tzYtBi7TKNkEpbiC8qVkxoiEyXnlw4SkwIjNjTZULB7bJrWGjV8JgYNgayi60peLaIF9GplOTIOLh5OjGZPtZbea7b26dyv93QLDKFUfnVAJmZxt9Xlit0afjB-n5sJ-4hCsyzwwlG37eAzHnZe2UVAtNSB8Fpg-X3T-jLieKFqyWFPd",
  },
  {
    id: "cmp_3",
    name: "SRM KTR",
    location: "Chennai, Tamil Nadu",
    vendorCount: 31,
    dailyOrders: 920,
    ordersCapacityPercent: 45,
    logisticsLeadName: "Rohan Verma",
    logisticsLeadInitials: "RV",
    status: "MAINTENANCE",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuABszicRTmp2V2katFBUUwEt-EzRDFZmOA0tAQs5p-e5bY3cnbc32DwAIUQTORc1fxlnKo01m_AGZBDqC3ehL2oJqXePT0QsJ87RRpDYsRKjYFP_Ba6mz6aI7G-nViAtxQX-bnHdJax6M69dlyGVnlAqtA76bsh7KnFWHcUyh2JWI8mEBY51F1yLOQuoEZrMRT7zuMLunZb_CuzGf6aGYvejpDPkD-muURuZOYtMJIxsC5gss1IVDJf",
  },
  {
    id: "cmp_4",
    name: "LPU Punjab",
    location: "Phagwara, Punjab",
    vendorCount: 104,
    dailyOrders: 5420,
    ordersCapacityPercent: 100,
    logisticsLeadName: "Deepak Singh",
    logisticsLeadInitials: "DS",
    status: "ACTIVE",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCplM-hOF-_VV1ektq9WsvFS6E39mYrLxjv4ZzKV2JEv3Pz22B4fpWBKx0MFA_AiM_0Oi5y3m6Xms7yyTjnFdlgS16XXfIAgH0iV4K_3hvivrSsz3J2QZcr8OkIL--e3bdESQ8XFgn_89y1Aqoe57T-aymSCyPy4ZPx-hYvr37DtRXLxnrBLLGhKU4-RfPCLlKedCG6QpNaABAm__P_H_YtNzRTWtd50ZMb49ktoOEkR1PPpvwMOEVP",
  },
  {
    id: "cmp_5",
    name: "Amity University",
    location: "Noida, Uttar Pradesh",
    vendorCount: 18,
    dailyOrders: 410,
    ordersCapacityPercent: 30,
    logisticsLeadName: "Pooja Sharma",
    logisticsLeadInitials: "PS",
    status: "PRE_ONBOARDING",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnL6yucAYd9Pmi4RFLLpjUqnREaSik4Hr8cWfjb_4cRgTLKjsvS1FXpojDeCHE8K5sL6y2DCUvdoJ0pNqrVEjEw-dMlChm-A_NrJ2OaCiJIldBlaBdRTnVf2-RblrCkWjmGmv6KifqsrKdjlP4lECNuKWiq7ZWjQ4CTVDmEvDunlXkXpwIxncN-rjEu_Ty0TB2hrpsN07nWk_H2n7QqWcUVVC7lsZtqdx49maJ5ZUruKWncwZ8yTEk",
  },
];

export const MOCK_CAMPUS_ACTIVITIES: CampusActivityFeedItem[] = [
  {
    id: "act_1",
    title: "New Campus Onboarding",
    description: "Amity University, Noida enters pre-onboarding integration phase.",
    timestampText: "2 HOURS AGO",
    type: "new",
  },
  {
    id: "act_2",
    title: "Vendor Milestone Achieved",
    description: "LPU Punjab reached 100+ active campus vendor storefronts.",
    timestampText: "5 HOURS AGO",
    type: "milestone",
  },
  {
    id: "act_3",
    title: "Network System Alert",
    description: "SRM KTR logistics nodes experiencing peak lunch latency.",
    timestampText: "8 HOURS AGO",
    type: "alert",
  },
];

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
