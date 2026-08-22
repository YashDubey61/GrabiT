-- Migration 0032: Vendor Settlements & Telegram Reporting System
-- Enables daily 6 PM IST vendor settlement tracking, Telegram reporting metadata, and payout audit trail.

CREATE TABLE IF NOT EXISTS public.vendor_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  gross_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gross_revenue >= 0),
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (commission_rate >= 0),
  commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (commission_amount >= 0),
  payout_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (payout_amount >= 0),
  already_paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (already_paid_amount >= 0),
  payout_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (payout_due >= 0),
  cancelled_orders_count INTEGER NOT NULL DEFAULT 0 CHECK (cancelled_orders_count >= 0),
  cancelled_orders_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cancelled_orders_amount >= 0),
  telegram_delivery_status TEXT NOT NULL DEFAULT 'CALCULATED' CHECK (telegram_delivery_status IN ('CALCULATED', 'SENDING', 'SENT', 'FAILED')),
  telegram_sending_at TIMESTAMPTZ,
  telegram_message_id TEXT,
  telegram_sent_at TIMESTAMPTZ,
  telegram_error TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PARTIALLY_PAID')),
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  payment_telegram_sent BOOLEAN NOT NULL DEFAULT FALSE,
  payment_telegram_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vendor_settlement_window UNIQUE (canteen_id, settlement_date, window_end)
);

-- Indexing for fast queries by date, vendor, status, and reporting window
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_date ON public.vendor_settlements (settlement_date);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_canteen ON public.vendor_settlements (canteen_id);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_status ON public.vendor_settlements (status);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_window ON public.vendor_settlements (window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_telegram_status ON public.vendor_settlements (telegram_delivery_status);

-- Enable RLS
ALTER TABLE public.vendor_settlements ENABLE ROW LEVEL SECURITY;

-- Allow Super Admin full access
CREATE POLICY "Super admins can manage all vendor settlements"
  ON public.vendor_settlements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
    )
  );

-- Allow vendors to read their own canteen's settlements
CREATE POLICY "Vendors can view their own settlements"
  ON public.vendor_settlements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'vendor'
        AND public.users.canteen_id = public.vendor_settlements.canteen_id
    )
  );
