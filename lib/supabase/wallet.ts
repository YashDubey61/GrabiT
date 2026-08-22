import { createClient } from "./client";
import type { Wallet, WalletTransaction, TransactionCategory } from "@/lib/mock/wallet";

export interface SupabaseWalletRow {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface SupabaseWalletTransactionRow {
  id: string;
  wallet_id: string;
  type: "topup" | "spend" | "refund" | "bonus";
  amount: number;
  related_order_id?: string;
  created_at: string;
}

const DEMO_STUDENT_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Fetch or auto-initialize live student wallet from Supabase database.
 * Default wallet balance for new students is strictly ₹0.00.
 */
export async function getLiveWalletForStudent(): Promise<Wallet> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = user ? user.id : DEMO_STUDENT_ID;

    // Fetch wallet for student
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", targetUserId)
      .limit(1);

    if (error || !wallets || wallets.length === 0) {
      // Auto-create initial wallet with ₹0.00 balance
      const { data: createdWallet, error: createErr } = await supabase
        .from("wallets")
        .insert({
          user_id: targetUserId,
          balance: 0.0,
        })
        .select()
        .single();

      if (createErr || !createdWallet) {
        return getFallbackWallet();
      }

      return mapSupabaseWalletToUI(createdWallet as SupabaseWalletRow);
    }

    return mapSupabaseWalletToUI(wallets[0] as SupabaseWalletRow);
  } catch {
    return getFallbackWallet();
  }
}

/**
 * Fetch live wallet transaction ledger for current student.
 */
export async function getLiveWalletTransactions(): Promise<WalletTransaction[]> {
  try {
    const supabase = createClient();

    // Query transactions for student wallet
    const { data: txs, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !txs || txs.length === 0) {
      return getFallbackTransactions();
    }

    return txs.map(mapSupabaseTxToUI);
  } catch {
    return getFallbackTransactions();
  }
}

function mapSupabaseWalletToUI(row: SupabaseWalletRow): Wallet {
  const balance = Number(row.balance);
  return {
    balance,
    currency: "₹",
    cashbackBalance: parseFloat((balance * 0.1).toFixed(2)),
    linkedBank: "HDFC •••• 8821",
    status: "active",
    lastUpdated: new Date(row.updated_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function mapSupabaseTxToUI(row: SupabaseWalletTransactionRow): WalletTransaction {
  const amount = Number(row.amount);
  const isCredit = row.type === "topup" || row.type === "refund" || row.type === "bonus";

  const catMap: Record<string, TransactionCategory> = {
    topup: "topup",
    spend: "food",
    refund: "refund",
    bonus: "cashback",
  };

  const iconMap: Record<string, string> = {
    topup: "account_balance_wallet",
    spend: "restaurant",
    refund: "replay",
    bonus: "card_giftcard",
  };

  const titleMap: Record<string, string> = {
    topup: "Wallet Top-up",
    spend: "Canteen Food Order",
    refund: "Order Refund — Cancelled Item",
    bonus: "Wallet Top-up Bonus",
  };

  const timeLabel = new Date(row.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: row.id,
    title: titleMap[row.type] ?? "Wallet Transaction",
    subtitle: timeLabel,
    amount,
    type: isCredit ? "credit" : "debit",
    icon: iconMap[row.type] ?? "account_balance_wallet",
    category: catMap[row.type] ?? "topup",
    orderNumber: row.related_order_id ? `#GRB-${row.related_order_id.slice(0, 4)}` : undefined,
  };
}

function getFallbackWallet(): Wallet {
  return {
    balance: 0.0,
    currency: "₹",
    cashbackBalance: 0.0,
    linkedBank: "HDFC •••• 8821",
    status: "active",
    lastUpdated: "Just now",
  };
}

function getFallbackTransactions(): WalletTransaction[] {
  return [];
}
