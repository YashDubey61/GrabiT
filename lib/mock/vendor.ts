export type VendorOrderStatus = "placed" | "preparing" | "ready" | "picked_up" | "completed" | "cancelled";

export interface VendorOrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  elapsedTimeText: string;
  paymentType: "PREPAID" | "CASH";
  status: VendorOrderStatus;
  totalAmount: number;
  items: VendorOrderItem[];
  otpCode?: string;
  prepProgressPercent?: number;
  createdAtIso: string;
  acceptedAtIso?: string;
  pickedUpAtIso?: string;
  completedAtIso?: string;
  cancelledAtIso?: string;
  cancellationReason?: string;
}

export interface VendorStoreConfig {
  name: string;
  hubTitle: string;
  campus: string;
  isOpen: boolean;
  prepTimeMinutes: number;
  avatarUrl: string;
}

export interface VendorStats {
  pendingOrders: number;
  readyOrders: number;
  dailyRevenue: number;
  avgCompletionMinutes: number;
}

// Vendor-defined — not a fixed set. Defaults ("Breakfast", "Lunch", …)
// are just the seeded starting rows in `vendor_categories`.
export type VendorMenuCategory = string;

export interface VendorMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: VendorMenuCategory;
  inStock: boolean;
  imageUrl: string;
}

export interface VendorAnalyticsSummary {
  todaysSales: number;
  salesGrowthPercent: number;
  totalOrders: number;
  targetOrders: number;
  avgPrepTimeMinutes: number;
  prepTimeDeltaMinutes: number;
}

export interface VendorHourlyPoint {
  label: string;
  heightPercent: number;
  isPeak?: boolean;
}

export interface VendorTopItemMetric {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  imageUrl: string;
}

export interface VendorPayoutRecord {
  id: string;
  reference: string;
  status: "Pending" | "Settled";
  date: string;
  amount: number;
}

// Store open/closed + prep-time are still UI-only state (not yet
// persisted to canteens); name/campus are placeholder display text until
// the vendor header is wired to the authenticated vendor's own
// canteen/campus record (see getLiveVendorCanteenId).
export const MOCK_VENDOR_STORE: VendorStoreConfig = {
  name: "My Store",
  hubTitle: "CAMPUS VENDOR HUB",
  campus: "",
  isOpen: true,
  prepTimeMinutes: 12,
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAua9YvOtGZtXiapTD8d8Zbglbjosvc-Hfn0Tk9IxxayF5iaqfDrMAq63P8X_tanb5o0UsWXecRgpxmcjPsYd6Ti_Q9qpwWuDx2NPStuLcmzezRJWCMbOaLcG76Jlih-58cogk6GCDfjqAXknFNtVexJAe5vWzbIN690G55sTDVifosjj8OsftmibSlHwDefts-4237-_zL2wSQYRdRm4SeqRrhDloeILENBGRrzH5B5OXEcxGLb3uz",
};

export const MOCK_VENDOR_STATS: VendorStats = {
  pendingOrders: 8,
  readyOrders: 4,
  dailyRevenue: 4250,
  avgCompletionMinutes: 11.4,
};

export const INITIAL_VENDOR_MENU_ITEMS: VendorMenuItem[] = [
  {
    id: "v_item_1",
    name: "Morning Burrito",
    description: "Scrambled eggs, hash browns, melted cheese & salsa.",
    price: 180,
    category: "Breakfast",
    inStock: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDZJOsZC2WTR9Mf_IxY3m4yqQ8Y8wMwd2TS6HxDopTGA_DGGQamchaCR_uoLZ-zRhN1JFjCmYfXP4zclth26t59-EeFbwZpUCTDyW8EZk-8TsYcVNjZXJEJi87-S8-GPjoZamBExSnAbseaZzmiPjSMV52hUibuKRjDHXc2JH9QhumI7atkXb-HwcnHPc5OOAnRIK2-_cnvFElwxcluIyVRnee766ArY2JO-wO9Hclr0O1UOJDy6c0g",
  },
  {
    id: "v_item_2",
    name: "Berry Pancakes",
    description: "Triple stack fluffy pancakes with maple syrup & fresh berries.",
    price: 220,
    category: "Breakfast",
    inStock: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4fKSeM5aE66JA_380VloeMO1yyxrZzhnY6zGsSbE8U6-S7jQxaWMYzrQikLetTJLsKcdSz2Hds-zqLGs5JpsYli9pkywNChBpdX-zIHG8SbHDTIHNcqTi2p0KIocM60gafeU10FldS0UhUQyFAeAJypE_3e2fi0L94YOcFl0NSjNCKxsB0_kDSA3M_mUhXvHRToYeoqgbh_pjKGChWzBvSISnMmfXOPA_NKAznd3ZKzqHj5ZB_-1F",
  },
  {
    id: "v_item_3",
    name: "Stealth Burger",
    description: "Signature beef/veggie patty with secret campus sauce.",
    price: 240,
    category: "Lunch",
    inStock: false,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHC2GhE_iQMXpe1jyJzNZXIVZtfOw5_avgsE_jHg3qts46VulvQYn2vMPunxFwdI0DAF8vN-oMcUoo4tzUtukppl2g-FMVdl9Mj3UI9ODriqXkCtj-XCogYB20L9XwjUSEka0pc3PhJi-VfSgPur4B-wshceDf3KBR3ReWsEizsBZ6zRCNu1wT199gbGqay_JenKSI2AyWn10PzxNLteTLpf8w3N1Df-0uPOKrFuFG-rSxLSCcOtXI",
  },
  {
    id: "v_item_4",
    name: "Campus Power Bowl",
    description: "High protein grains, grilled chicken/paneer & veggies.",
    price: 260,
    category: "Lunch",
    inStock: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAol8gL0PYVMEayMLRc8KtT_2E0fBJo8i87BLvLXRRTpT-k5-JMHoJQ-l0yD-wdjFoHzhLyp1EoLLP7Q3KOxz8a_DKmv8Ac7d2ZrPuchA7_4ss1ifuBkkeptcZ8BehPAd98IQDrPVdHrJkOjRHX525GO2hoTG1xOQe-OCcDQiC9oNpI0UQNjvz2e9hGg9FMXwQmNRDBPBuWDwU20bS9jQ7iDas7omEC_YCVCyyZuO-7YRX-JgZ4aAlD",
  },
  {
    id: "v_item_5",
    name: "Cheese Vada Pav (2x)",
    description: "Spicy potato fritter in soft bun with melted cheese.",
    price: 90,
    category: "Snacks",
    inStock: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAtr8OZgRwOgTgFTiJYarO_wqMR0o961ikN78OdZnO9W0zK2MsIhRU8igrwZAEsX1OfQE4MnlknbidLvOYecTAROkHaVJBTSzI-RaXqybG-oYJgh51-hZjWyT7Ok-7AVzi-2WhDBFcSfnnGO2pxHfv_xa2w6sdk7C7YOdptJuJnFGmXa0KsT9u7TW9W-Hl2OB5nEMRVIdT7UuWBfNiddOVpgoDL0OktT62X6IdqXxhc259tKmKhaxB",
  },
  {
    id: "v_item_6",
    name: "Hazelnut Cold Coffee",
    description: "Chilled espresso blend with hazelnut syrup & ice cream.",
    price: 130,
    category: "Beverages",
    inStock: true,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiniHJLh_lHHwBLzWH9y6cc9d4XJUhDOBngyBDtgNruIG22uqUDJAoURjyqMURuPP4u2mkMMGrAyzVG9e8SL5Dd693ScKynXX7IP60woft0N0v6BjWXKHgvPsz2-vIuJy8mG86tDc6oiY1NqSSK4OhFRHaPQAwcipy_hxxTOa_pdSfcOohTG0o_SOL84wXuxogdg8OdufTXWBzDnHC-rde5mos4Q-lDbN34o1B5_Uw3_8kM9j2JUao",
  },
];

export const MOCK_ANALYTICS_SUMMARY: VendorAnalyticsSummary = {
  todaysSales: 4250.5,
  salesGrowthPercent: 12,
  totalOrders: 142,
  targetOrders: 200,
  avgPrepTimeMinutes: 8.4,
  prepTimeDeltaMinutes: -0.5,
};

export const MOCK_HOURLY_VOLUME_POINTS: VendorHourlyPoint[] = [
  { label: "10A", heightPercent: 20 },
  { label: "11A", heightPercent: 45 },
  { label: "12P", heightPercent: 90, isPeak: true },
  { label: "1P", heightPercent: 75, isPeak: true },
  { label: "2P", heightPercent: 30 },
  { label: "3P", heightPercent: 25 },
  { label: "4P", heightPercent: 40 },
  { label: "5P", heightPercent: 85, isPeak: true },
];

export const MOCK_TOP_ITEMS: VendorTopItemMetric[] = [
  {
    id: "top_1",
    name: "Spicy Campus Burger",
    orderCount: 48,
    revenue: 5760,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYyDJlcK1nzWWPU_aB5kKEETdxvuuCOxgmobxGOiNATAry3Q921sbG4Zc-RcUfIRzmbDp0HxRN1lBQCD-Nnq0K9OUiw307FYg1kadsbQIZBIkV_kboiV10jJa4WqKep6XhuawSxlM6aFcq2ozJ-VPVkobP5PC8kwWLfG8iRu4qBPa4q5SwM1ANvJbmQVUzReCOYfm-r-FsQU8dU0khFEpCXsSakmxTwNFtBbDBVCpEdUZxJ_q96Grn",
  },
  {
    id: "top_2",
    name: "Hazelnut Cold Coffee",
    orderCount: 32,
    revenue: 4160,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiniHJLh_lHHwBLzWH9y6cc9d4XJUhDOBngyBDtgNruIG22uqUDJAoURjyqMURuPP4u2mkMMGrAyzVG9e8SL5Dd693ScKynXX7IP60woft0N0v6BjWXKHgvPsz2-vIuJy8mG86tDc6oiY1NqSSK4OhFRHaPQAwcipy_hxxTOa_pdSfcOohTG0o_SOL84wXuxogdg8OdufTXWBzDnHC-rde5mos4Q-lDbN34o1B5_Uw3_8kM9j2JUao",
  },
  {
    id: "top_3",
    name: "Stealth Taco Bowl",
    orderCount: 24,
    revenue: 3120,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAol8gL0PYVMEayMLRc8KtT_2E0fBJo8i87BLvLXRRTpT-k5-JMHoJQ-l0yD-wdjFoHzhLyp1EoLLP7Q3KOxz8a_DKmv8Ac7d2ZrPuchA7_4ss1ifuBkkeptcZ8BehPAd98IQDrPVdHrJkOjRHX525GO2hoTG1xOQe-OCcDQiC9oNpI0UQNjvz2e9hGg9FMXwQmNRDBPBuWDwU20bS9jQ7iDas7omEC_YCVCyyZuO-7YRX-JgZ4aAlD",
  },
];

export const MOCK_PAYOUT_RECORDS: VendorPayoutRecord[] = [
  {
    id: "pay_1",
    reference: "PAY-89240-X",
    status: "Pending",
    date: "Oct 24, 2026",
    amount: 14500.0,
  },
  {
    id: "pay_2",
    reference: "PAY-89132-Y",
    status: "Settled",
    date: "Oct 22, 2026",
    amount: 21005.5,
  },
  {
    id: "pay_3",
    reference: "PAY-89011-Z",
    status: "Settled",
    date: "Oct 20, 2026",
    amount: 9802.5,
  },
];
