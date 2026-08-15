-- Migration 0014: Product Analytics Events Table and RLS
-- First-party event instrumentation for GrabIt Campus Canteen OS

CREATE TABLE IF NOT EXISTS public.product_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  anonymous_session_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  role TEXT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for fast aggregation
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_name ON public.product_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_created_at ON public.product_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_user_id ON public.product_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_campus_id ON public.product_analytics_events(campus_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_canteen_id ON public.product_analytics_events(canteen_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_events_order_id ON public.product_analytics_events(order_id);

-- Enable Row Level Security
ALTER TABLE public.product_analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super Admin Read-Only
-- Only users with role === 'admin' can query analytics events directly via RLS.
CREATE POLICY "Super Admins can read analytics events"
  ON public.product_analytics_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Service role bypasses RLS for server-side event insertion.
-- Zero direct INSERT/UPDATE/DELETE policies for public anon, student, or vendor roles.
