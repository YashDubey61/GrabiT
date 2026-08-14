// ── Database Types ──────────────────────────────────
// Manually typed to match supabase/migrations/001_initial_schema.sql
// Run `supabase gen types typescript` to regenerate from live schema.

export type Campus = {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
  created_at: string;
};

export type Canteen = {
  id: string;
  campus_id: string;
  name: string;
  location_desc: string | null;
  image_url: string | null;
  is_open: boolean;
  opening_time: string; // HH:MM:SS
  closing_time: string;
  created_at: string;
};

export type Vendor = {
  id: string;
  canteen_id: string;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  vendor_id: string;
  canteen_id: string;
  name: string;
  description: string | null;
  price: number; // in paise
  category: string;
  image_url: string | null;
  in_stock: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type Student = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  campus_id: string;
  is_gold_subscriber: boolean;
  created_at: string;
};

export type TimeSlot = {
  id: string;
  canteen_id: string;
  name: string;
  start_time: string; // HH:MM:SS
  end_time: string;
  max_orders: number;
  is_active: boolean;
};

export type OrderStatus = "placed" | "preparing" | "ready";

export type Order = {
  id: string;
  student_id: string;
  canteen_id: string;
  time_slot_id: string;
  status: OrderStatus;
  total: number; // paise
  platform_fee: number;
  student_fee: number;
  vendor_fee: number;
  payment_method: "upi" | "wallet";
  payment_ref: string | null;
  is_delayed: boolean;
  group_order_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Joined
  menu_item?: MenuItem;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_at: string;
  changed_by: string | null;
};

export type Wallet = {
  id: string;
  student_id: string;
  balance: number; // paise
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  type: "credit" | "debit";
  amount: number;
  bonus_amount: number;
  reference: string | null;
  created_at: string;
};

export type GroupOrder = {
  id: string;
  creator_id: string;
  canteen_id: string;
  time_slot_id: string;
  share_code: string;
  status: "open" | "locked" | "checked_out";
  created_at: string;
};

export type GroupOrderParticipant = {
  id: string;
  group_order_id: string;
  student_id: string;
  order_id: string | null;
  payment_method: "upi" | "wallet" | "split" | null;
};

export type Subscription = {
  id: string;
  student_id: string;
  plan: "gold";
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

export type Payout = {
  id: string;
  vendor_id: string;
  amount: number;
  status: "pending" | "paid";
  requested_at: string;
  paid_at: string | null;
};

export type PlatformFee = {
  id: string;
  order_id: string;
  total_fee: number;
  student_share: number;
  vendor_share: number;
};

export type WalletBonusConfig = {
  id: string;
  min_amount: number;
  bonus_amount: number;
  is_active: boolean;
};

// ── Joined / View Types ─────────────────────────────

export type OrderWithItems = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
  student?: Pick<Student, "id" | "name" | "phone">;
  time_slot?: TimeSlot;
  canteen?: Canteen;
  status_history?: OrderStatusHistory[];
};

export type CanteenWithVendors = Canteen & {
  vendors: Vendor[];
};

export type MenuItemsByCategory = {
  category: string;
  items: MenuItem[];
};

// ── Cart Types (client-side only) ───────────────────

export type CartItem = {
  menu_item: MenuItem;
  quantity: number;
};

export type Cart = {
  canteen_id: string;
  items: CartItem[];
  time_slot_id: string | null;
};
