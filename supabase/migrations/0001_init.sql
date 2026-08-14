-- GrabIt — initial schema
-- Source of truth: GrabIt_TRD.md §4 Data Model (Core Entities)
--
-- INTENTIONAL DEVIATION FROM THE TRD: the TRD's `orders` table includes
-- `fulfillment_type` (pickup/delivery) and `delivery_location`, and lists a
-- separate `delivery_runs` table. The current product direction is
-- pickup-only. Those fields/table are NOT created here. If delivery is
-- reintroduced, this migration is the place to add them back — see the
-- Day 1 foundation report for the full list of spec inconsistencies.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'vendor', 'admin');
create type order_status as enum ('placed', 'preparing', 'ready', 'completed', 'cancelled');
create type order_slot as enum ('short_break', 'lunch');
create type payment_method as enum ('upi', 'wallet');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type canteen_status as enum ('active', 'inactive');
create type menu_item_availability as enum ('available', 'unavailable');
create type wallet_transaction_type as enum ('topup', 'spend', 'refund', 'bonus');
create type group_order_status as enum ('open', 'locked', 'completed');
create type payout_status as enum ('requested', 'processing', 'settled', 'failed');
create type subscription_plan as enum ('gold_monthly', 'gold_semester');
create type subscription_status as enum ('active', 'expired', 'cancelled');

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null
);

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  role user_role not null,
  campus_id uuid references campuses (id),
  created_at timestamptz not null default now()
);

create table canteens (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references campuses (id) on delete cascade,
  name text not null,
  status canteen_status not null default 'active',
  qr_code_id text not null unique
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid not null references canteens (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  availability menu_item_availability not null default 'available',
  is_sponsored boolean not null default false
);

create table group_orders (
  id uuid primary key default gen_random_uuid(),
  initiator_id uuid not null references users (id),
  canteen_id uuid not null references canteens (id),
  join_code text not null unique,
  status group_order_status not null default 'open',
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references users (id),
  canteen_id uuid not null references canteens (id),
  slot order_slot not null,
  status order_status not null default 'placed',
  order_number text not null unique,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  group_order_id uuid references group_orders (id),
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id),
  quantity integer not null check (quantity > 0),
  price_at_order numeric(10, 2) not null check (price_at_order >= 0),
  contributed_by_user_id uuid references users (id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  method payment_method not null,
  razorpay_payment_id text,
  amount numeric(10, 2) not null check (amount >= 0),
  platform_fee numeric(10, 2) not null default 0,
  vendor_settlement numeric(10, 2) not null default 0,
  status payment_status not null default 'pending'
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  canteen_id uuid not null references canteens (id),
  amount numeric(10, 2) not null check (amount >= 0),
  status payout_status not null default 'requested',
  requested_at timestamptz not null default now(),
  settled_at timestamptz
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id),
  plan subscription_plan not null,
  status subscription_status not null default 'active',
  renews_at timestamptz not null
);

create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id),
  balance numeric(10, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets (id) on delete cascade,
  type wallet_transaction_type not null,
  amount numeric(10, 2) not null,
  related_order_id uuid references orders (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security
--
-- Enabled on every table now, per the rule that role authorization must be
-- server-side and never rely on client-side hiding. Policies here are
-- deliberately minimal (own-row access + role-based reads) — the full
-- policy set (e.g. vendor-scoped menu writes, admin override) is Day 2+
-- work once the API surface consuming them is built. An empty policy set
-- with RLS enabled fails closed; that is the safe default until then.
-- ---------------------------------------------------------------------------

alter table campuses enable row level security;
alter table users enable row level security;
alter table canteens enable row level security;
alter table menu_items enable row level security;
alter table group_orders enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payouts enable row level security;
alter table subscriptions enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;

create policy "users read own row" on users
  for select using (auth.uid() = id);

create policy "students read own orders" on orders
  for select using (auth.uid() = student_id);

create policy "students read own wallet" on wallets
  for select using (auth.uid() = user_id);

create policy "students read own wallet transactions" on wallet_transactions
  for select using (
    wallet_id in (select id from wallets where user_id = auth.uid())
  );

-- Canteens and menu_items are public-read (students browse without
-- per-row ownership) — PRD §7.1 "Campus canteen discovery".
create policy "menus are publicly readable" on canteens
  for select using (true);

create policy "menu items are publicly readable" on menu_items
  for select using (true);
