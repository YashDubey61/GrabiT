-- ============================================================================
-- Migration 0056: Manual Cash Orders & Fallback Offline Architecture
-- Enables Vendor Panel Manual Cash Orders with idempotency & offline queueing.
-- ============================================================================

-- 1. Add order_type column to orders table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_type'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN order_type text NOT NULL DEFAULT 'ONLINE_ORDER';
  END IF;
END $$;

-- 2. Add client_order_id (idempotency key for offline sync duplicate protection)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'client_order_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN client_order_id text UNIQUE;
  END IF;
END $$;

-- 3. Add customer metadata fields for walk-in and manual cash orders
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'student_identifier'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN student_identifier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'is_manual'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN is_manual boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'cash';
  END IF;
END $$;

-- 4. Allow student_id to be nullable for walk-in manual cash orders
ALTER TABLE public.orders ALTER COLUMN student_id DROP NOT NULL;

-- 5. Allow slot to be nullable or default for manual cash orders
ALTER TABLE public.orders ALTER COLUMN slot DROP NOT NULL;

-- 6. Indexes for performant filtering and idempotency lookups
CREATE INDEX IF NOT EXISTS idx_orders_client_order_id ON public.orders(client_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_is_manual ON public.orders(is_manual);
