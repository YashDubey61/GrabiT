-- GrabIt — Super Admin Financial Command Center Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Financial Command & Reconciliation)

-- 1. Create superadmin_financial_reconciliation table for tracking financial reconciliation logs and audit checks
CREATE TABLE IF NOT EXISTS public.superadmin_financial_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_type TEXT NOT NULL CHECK (item_type IN ('CUSTOMER_PAYMENTS', 'ORDER_REVENUE', 'VENDOR_SETTLEMENTS', 'PAYOUTS', 'REFUNDS')),
  status TEXT NOT NULL DEFAULT 'MATCHED' CHECK (status IN ('MATCHED', 'PENDING', 'MISMATCH', 'MISSING_SETTLEMENT', 'MISSING_PAYOUT', 'DUPLICATE_TRANSACTION')),
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discrepancy_amount NUMERIC(10, 2) DEFAULT 0.00,
  investigation_notes TEXT,
  investigated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_reconciliation_date ON public.superadmin_financial_reconciliation(reconciliation_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_reconciliation_status ON public.superadmin_financial_reconciliation(status);
CREATE INDEX IF NOT EXISTS idx_financial_reconciliation_canteen ON public.superadmin_financial_reconciliation(canteen_id);

-- 2. Row Level Security for superadmin_financial_reconciliation
ALTER TABLE public.superadmin_financial_reconciliation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view financial reconciliation" ON public.superadmin_financial_reconciliation;
CREATE POLICY "Super Admins can view financial reconciliation"
  ON public.superadmin_financial_reconciliation
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super Admins can manage financial reconciliation" ON public.superadmin_financial_reconciliation;
CREATE POLICY "Super Admins can manage financial reconciliation"
  ON public.superadmin_financial_reconciliation
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
