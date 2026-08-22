-- GrabIt — Dispute & Refund Management Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Dispute & Refund Processing)

-- 1. Create superadmin_disputes table for Super Admin dispute and refund workflows
CREATE TABLE IF NOT EXISTS public.superadmin_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_number TEXT UNIQUE NOT NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
  dispute_type TEXT NOT NULL CHECK (dispute_type IN ('ORDER_NOT_RECEIVED', 'WRONG_ITEM', 'MISSING_ITEM', 'QUALITY_ISSUE', 'PAYMENT_ISSUE', 'REFUND_ISSUE', 'OTHER')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'WAITING_FOR_VENDOR', 'WAITING_FOR_STUDENT', 'REFUND_APPROVED', 'REFUND_REJECTED', 'RESOLVED')),
  dispute_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  refund_status TEXT NOT NULL DEFAULT 'NONE' CHECK (refund_status IN ('NONE', 'REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED')),
  description TEXT NOT NULL,
  assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_response TEXT,
  vendor_responded_at TIMESTAMPTZ,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for status, priority, order, campus, user, and canteen
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.superadmin_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_priority ON public.superadmin_disputes(priority);
CREATE INDEX IF NOT EXISTS idx_disputes_refund_status ON public.superadmin_disputes(refund_status);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.superadmin_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_user ON public.superadmin_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_canteen ON public.superadmin_disputes(canteen_id);
CREATE INDEX IF NOT EXISTS idx_disputes_campus ON public.superadmin_disputes(campus_id);
CREATE INDEX IF NOT EXISTS idx_disputes_created ON public.superadmin_disputes(created_at);

-- 2. Row Level Security for superadmin_disputes
ALTER TABLE public.superadmin_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage disputes" ON public.superadmin_disputes;
CREATE POLICY "Super Admins can manage disputes"
  ON public.superadmin_disputes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Students view own disputes" ON public.superadmin_disputes;
CREATE POLICY "Students view own disputes"
  ON public.superadmin_disputes
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Vendors view canteen disputes" ON public.superadmin_disputes;
CREATE POLICY "Vendors view canteen disputes"
  ON public.superadmin_disputes
  FOR SELECT
  USING (
    canteen_id IN (SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor')
  );
