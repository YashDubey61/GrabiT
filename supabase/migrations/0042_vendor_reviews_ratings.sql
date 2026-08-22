-- Migration 0042: Order Reviews & Vendor Rating System
-- Creates authoritative order_reviews table for student ratings, vendor replies, and admin moderation reporting

CREATE TABLE IF NOT EXISTS public.order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  vendor_reply TEXT,
  vendor_replied_at TIMESTAMPTZ,
  vendor_replied_by UUID REFERENCES public.users(id),
  report_status TEXT NOT NULL DEFAULT 'none' CHECK (report_status IN ('none', 'reported', 'flagged', 'hidden')),
  report_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing for fast vendor review queries
CREATE INDEX IF NOT EXISTS idx_order_reviews_canteen ON public.order_reviews (canteen_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_rating ON public.order_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON public.order_reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_student ON public.order_reviews (student_id);

-- Enable RLS
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

-- Allow super admins full access
CREATE POLICY "Super admins manage all order reviews"
  ON public.order_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- Allow students to read non-hidden reviews
CREATE POLICY "Students read public order reviews"
  ON public.order_reviews
  FOR SELECT
  USING (report_status <> 'hidden');

-- Allow students to create reviews for their own orders
CREATE POLICY "Students create own order reviews"
  ON public.order_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Allow vendors to view reviews for their own canteen
CREATE POLICY "Vendors view canteen order reviews"
  ON public.order_reviews
  FOR SELECT
  USING (
    canteen_id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Allow vendors to update vendor_reply and report_status on their own canteen's reviews
CREATE POLICY "Vendors reply and report canteen order reviews"
  ON public.order_reviews
  FOR UPDATE
  USING (
    canteen_id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid()
    )
  );
