-- Day 60: Order Fulfillment Lifecycle Migration
-- Extends order_status enum to include 'picked_up', adds tracking timestamps, and creates order_status_history audit table.

-- 1. Extend order_status Enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.order_status'::regtype
      AND enumlabel = 'picked_up'
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'picked_up' AFTER 'ready';
  END IF;
END $$;

-- 2. Add Lifecycle Timestamps to orders Table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 3. Create order_status_history Audit Table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL DEFAULT 'vendor', -- 'student' | 'vendor' | 'admin' | 'system'
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view status history of their own orders
DROP POLICY IF EXISTS "Students can view status history of own orders" ON public.order_status_history;
CREATE POLICY "Students can view status history of own orders"
    ON public.order_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_status_history.order_id
              AND student_id = auth.uid()
        )
    );

-- RLS Policy: Vendors can view status history for orders belonging to their canteen
DROP POLICY IF EXISTS "Vendors can view status history of canteen orders" ON public.order_status_history;
CREATE POLICY "Vendors can view status history of canteen orders"
    ON public.order_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.users u ON u.canteen_id = o.canteen_id
            WHERE o.id = order_status_history.order_id
              AND u.id = auth.uid()
              AND u.role = 'vendor'
        )
    );

-- Enable Realtime for order_status_history if publication exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
