-- GrabIt: Initial Database Schema
-- Run via: supabase db reset (applies migrations + seed)
-- Or paste into Supabase SQL editor

-- ══════════════════════════════════════════════════════
-- EXTENSIONS
-- ══════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════
-- CAMPUSES
-- ══════════════════════════════════════════════════════
CREATE TABLE campuses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════
-- CANTEENS
-- ══════════════════════════════════════════════════════
CREATE TABLE canteens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campus_id     UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  location_desc TEXT,
  image_url     TEXT,
  is_open       BOOLEAN NOT NULL DEFAULT false,
  opening_time  TIME NOT NULL DEFAULT '08:00:00',
  closing_time  TIME NOT NULL DEFAULT '20:00:00',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_canteens_campus ON canteens(campus_id);

-- ══════════════════════════════════════════════════════
-- VENDORS
-- ══════════════════════════════════════════════════════
CREATE TABLE vendors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canteen_id    UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendors_canteen ON vendors(canteen_id);

-- ══════════════════════════════════════════════════════
-- MENU ITEMS
-- ══════════════════════════════════════════════════════
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  canteen_id   UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        INTEGER NOT NULL, -- in paise
  category     TEXT NOT NULL DEFAULT 'Snacks',
  image_url    TEXT,
  in_stock     BOOLEAN NOT NULL DEFAULT true,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_vendor   ON menu_items(vendor_id);
CREATE INDEX idx_menu_canteen  ON menu_items(canteen_id);
CREATE INDEX idx_menu_category ON menu_items(category);

-- ══════════════════════════════════════════════════════
-- STUDENTS
-- ══════════════════════════════════════════════════════
CREATE TABLE students (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  phone               TEXT UNIQUE NOT NULL,
  email               TEXT,
  campus_id           UUID NOT NULL REFERENCES campuses(id),
  is_gold_subscriber  BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_phone  ON students(phone);
CREATE INDEX idx_students_campus ON students(campus_id);

-- ══════════════════════════════════════════════════════
-- TIME SLOTS
-- ══════════════════════════════════════════════════════
CREATE TABLE time_slots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  max_orders INTEGER NOT NULL DEFAULT 50,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_slots_canteen ON time_slots(canteen_id);

-- ══════════════════════════════════════════════════════
-- ORDERS
-- ══════════════════════════════════════════════════════
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES students(id),
  canteen_id      UUID NOT NULL REFERENCES canteens(id),
  time_slot_id    UUID NOT NULL REFERENCES time_slots(id),
  status          TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','preparing','ready')),
  total           INTEGER NOT NULL, -- paise
  platform_fee    INTEGER NOT NULL DEFAULT 0,
  student_fee     INTEGER NOT NULL DEFAULT 0,
  vendor_fee      INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('upi','wallet')),
  payment_ref     TEXT,
  is_delayed      BOOLEAN NOT NULL DEFAULT false,
  group_order_id  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_student  ON orders(student_id);
CREATE INDEX idx_orders_canteen  ON orders(canteen_id);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_slot     ON orders(time_slot_id);
CREATE INDEX idx_orders_created  ON orders(created_at DESC);

-- ══════════════════════════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════════════════════════
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit_price   INTEGER NOT NULL,
  subtotal     INTEGER NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ══════════════════════════════════════════════════════
-- ORDER STATUS HISTORY
-- ══════════════════════════════════════════════════════
CREATE TABLE order_status_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by TEXT
);

CREATE INDEX idx_status_history_order ON order_status_history(order_id);

-- ══════════════════════════════════════════════════════
-- WALLETS
-- ══════════════════════════════════════════════════════
CREATE TABLE wallets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  balance    INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════
-- WALLET TRANSACTIONS
-- ══════════════════════════════════════════════════════
CREATE TABLE wallet_transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id    UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount       INTEGER NOT NULL,
  bonus_amount INTEGER NOT NULL DEFAULT 0,
  reference    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);

-- ══════════════════════════════════════════════════════
-- GROUP ORDERS
-- ══════════════════════════════════════════════════════
CREATE TABLE group_orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id   UUID NOT NULL REFERENCES students(id),
  canteen_id   UUID NOT NULL REFERENCES canteens(id),
  time_slot_id UUID NOT NULL REFERENCES time_slots(id),
  share_code   TEXT UNIQUE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','locked','checked_out')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_orders_code ON group_orders(share_code);

-- ══════════════════════════════════════════════════════
-- GROUP ORDER PARTICIPANTS
-- ══════════════════════════════════════════════════════
CREATE TABLE group_order_participants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_order_id  UUID NOT NULL REFERENCES group_orders(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES students(id),
  order_id        UUID REFERENCES orders(id),
  payment_method  TEXT CHECK (payment_method IN ('upi','wallet','split'))
);

CREATE INDEX idx_group_participants_group ON group_order_participants(group_order_id);

-- ══════════════════════════════════════════════════════
-- SUBSCRIPTIONS (Gold)
-- ══════════════════════════════════════════════════════
CREATE TABLE subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  plan       TEXT NOT NULL DEFAULT 'gold' CHECK (plan IN ('gold')),
  starts_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_subs_student ON subscriptions(student_id);

-- ══════════════════════════════════════════════════════
-- PAYOUTS
-- ══════════════════════════════════════════════════════
CREATE TABLE payouts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  amount       INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at      TIMESTAMPTZ
);

CREATE INDEX idx_payouts_vendor ON payouts(vendor_id);

-- ══════════════════════════════════════════════════════
-- PLATFORM FEES
-- ══════════════════════════════════════════════════════
CREATE TABLE platform_fees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  total_fee     INTEGER NOT NULL,
  student_share INTEGER NOT NULL,
  vendor_share  INTEGER NOT NULL
);

-- ══════════════════════════════════════════════════════
-- WALLET BONUS CONFIG
-- ══════════════════════════════════════════════════════
CREATE TABLE wallet_bonus_config (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_amount   INTEGER NOT NULL, -- paise
  bonus_amount INTEGER NOT NULL, -- paise
  is_active    BOOLEAN NOT NULL DEFAULT true
);

-- ══════════════════════════════════════════════════════
-- ENABLE REALTIME
-- ══════════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE canteens;

-- ══════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
