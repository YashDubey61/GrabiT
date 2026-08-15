export type TransactionType = "credit" | "debit";
export type TransactionCategory = "food" | "topup" | "refund" | "cashback";

export interface WalletTransaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: TransactionType;
  icon: string;
  category: TransactionCategory;
  orderNumber?: string;
}

export interface TopUpOption {
  id: string;
  amount: number;
  bonusLabel?: string;
  isRecommended?: boolean;
}

export interface Wallet {
  balance: number;
  currency: string;
  cashbackBalance: number;
  linkedBank: string;
  status: "active" | "frozen";
  lastUpdated: string;
}

export const MOCK_WALLET: Wallet = {
  balance: 1240.5,
  currency: "₹",
  cashbackBalance: 124.5,
  linkedBank: "HDFC •••• 8821",
  status: "active",
  lastUpdated: "Just now",
};

export const MOCK_TOPUP_OPTIONS: TopUpOption[] = [
  { id: "topup_100", amount: 100 },
  { id: "topup_200", amount: 200, bonusLabel: "+ ₹20 Bonus" },
  {
    id: "topup_500",
    amount: 500,
    bonusLabel: "+ ₹50 Bonus",
    isRecommended: true,
  },
  { id: "topup_1000", amount: 1000, bonusLabel: "+ ₹120 Bonus" },
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: "tx_1",
    title: "Order #41 — Main Canteen",
    subtitle: "Today, 2:45 PM",
    amount: 210.0,
    type: "debit",
    icon: "restaurant",
    category: "food",
    orderNumber: "#41",
  },
  {
    id: "tx_2",
    title: "Wallet Top-up (UPI)",
    subtitle: "Yesterday, 10:15 AM",
    amount: 500.0,
    type: "credit",
    icon: "account_balance_wallet",
    category: "topup",
  },
  {
    id: "tx_3",
    title: "Order Refund — Cancelled Item",
    subtitle: "Oct 12, 4:20 PM",
    amount: 120.0,
    type: "credit",
    icon: "replay",
    category: "refund",
    orderNumber: "#38",
  },
  {
    id: "tx_4",
    title: "CyberCafe — Cold Coffee",
    subtitle: "Oct 10, 1:12 PM",
    amount: 180.0,
    type: "debit",
    icon: "lunch_dining",
    category: "food",
    orderNumber: "#35",
  },
];
