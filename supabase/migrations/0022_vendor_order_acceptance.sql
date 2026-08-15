-- Day 59: Vendor Order Acceptance & Cancellation Migration
-- Adds timestamp tracking and cancellation metadata to orders table.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Performance index for vendor canteen order queries
CREATE INDEX IF NOT EXISTS idx_orders_canteen_status ON public.orders(canteen_id, status);

-- Enable Supabase Realtime publication for orders & operational notifications
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
