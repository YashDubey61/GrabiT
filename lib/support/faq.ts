import type { SupportCategoryId } from "./categories";

export interface FaqItem {
  id: string;
  category: SupportCategoryId;
  question: string;
  answer: string;
  keywords: string[];
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "place-order",
    category: "ORDERS",
    question: "How do I place an order?",
    answer:
      "Pick your campus canteen from Home, browse the menu, add items to your cart, and check out. You'll get a pickup slot and a QR/OTP to collect your order at the counter.",
    keywords: ["order", "place", "menu", "cart", "checkout"],
  },
  {
    id: "cancel-order",
    category: "ORDERS",
    question: "How can I cancel an order?",
    answer:
      "You can cancel from Orders → order details while it's still Placed. Once a vendor starts preparing it, cancellation isn't available — contact the vendor directly or raise a support request below.",
    keywords: ["cancel", "order", "stop"],
  },
  {
    id: "order-delayed",
    category: "ORDERS",
    question: "What happens if my order is delayed?",
    answer:
      "Track live status on the order's tracking screen — it updates as the vendor prepares your order. If it's significantly past the estimated pickup time, use \"Get help\" on that order below to reach us.",
    keywords: ["delay", "late", "wait", "time", "order"],
  },
  {
    id: "how-refund",
    category: "REFUNDS",
    question: "How do I get a refund?",
    answer:
      "Refunds for cancelled or failed orders are processed automatically to your original payment method or GrabIt Wallet. If a refund hasn't appeared within a few business days, raise a support request with your order ID.",
    keywords: ["refund", "money back", "cancel"],
  },
  {
    id: "payment-deducted-order-failed",
    category: "PAYMENTS",
    question: "My payment was deducted but the order failed. What should I do?",
    answer:
      "This is usually resolved automatically within minutes — failed payments are never silently kept, they're refunded or the order is retried once the gateway confirms status. If it's been more than 30 minutes, raise a support request with the order ID and payment amount.",
    keywords: ["payment", "deducted", "failed", "money", "charged"],
  },
  {
    id: "gold-how-it-works",
    category: "GOLD",
    question: "How does GRABIT Gold work?",
    answer:
      "GRABIT Gold is a subscription pass (Monthly ₹49/30 days or Semester ₹199/120 days) that gives you zero platform fees and priority pickup. Purchase or extend it from Profile → GRABIT Gold Pass.",
    keywords: ["gold", "subscription", "pass", "premium", "membership"],
  },
  {
    id: "redeem-reward",
    category: "REWARDS",
    question: "How do I redeem my reward?",
    answer:
      "Open Rewards, pick a reward you have enough points for, and confirm redemption. A unique 16-digit code is generated instantly under My Rewards — apply it in the Promo Code section at checkout.",
    keywords: ["reward", "redeem", "points"],
  },
  {
    id: "find-promo-code",
    category: "REWARDS",
    question: "Where can I find my reward promo code?",
    answer:
      "Go to Rewards → My Rewards. Every redeemed reward shows its code there, along with its status (Available/Used/Expired) and a copy button.",
    keywords: ["promo", "code", "reward", "coupon"],
  },
  {
    id: "change-profile",
    category: "ACCOUNT",
    question: "How do I change my profile details?",
    answer:
      "Go to Profile and tap Edit Profile Details to update your name, phone, or photo. Your GRABIT User ID and email are permanent and can't be changed.",
    keywords: ["profile", "name", "phone", "edit", "account"],
  },
  {
    id: "contact-vendor",
    category: "VENDOR",
    question: "How do I contact a vendor?",
    answer:
      "Open your order's tracking screen — vendor contact actions are available there once your order is placed. For issues after pickup, use \"Get help\" on that order instead.",
    keywords: ["vendor", "canteen", "contact", "stall"],
  },
  {
    id: "app-not-working",
    category: "TECHNICAL",
    question: "What should I do if the app is not working?",
    answer:
      "Try refreshing or reopening the app first. If a specific screen keeps failing, note what you were doing and raise a Technical Issues support request so we can look into it.",
    keywords: ["app", "bug", "crash", "not working", "error", "technical"],
  },
];
