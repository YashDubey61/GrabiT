-- GrabIt — Super Admin Platform Intelligence & Advanced Analytics Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Executive Intelligence)

-- 1. Create superadmin_intelligence_snapshots table for daily health scores and insight logs
CREATE TABLE IF NOT EXISTS public.superadmin_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  operations_score INTEGER NOT NULL DEFAULT 95 CHECK (operations_score >= 0 AND operations_score <= 100),
  payments_score INTEGER NOT NULL DEFAULT 97 CHECK (payments_score >= 0 AND payments_score <= 100),
  customer_experience_score INTEGER NOT NULL DEFAULT 89 CHECK (customer_experience_score >= 0 AND customer_experience_score <= 100),
  vendor_health_score INTEGER NOT NULL DEFAULT 91 CHECK (vendor_health_score >= 0 AND vendor_health_score <= 100),
  security_score INTEGER NOT NULL DEFAULT 94 CHECK (security_score >= 0 AND security_score <= 100),
  insights_json JSONB DEFAULT '[]'::jsonb,
  alerts_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_intelligence_snapshot_date UNIQUE (snapshot_date)
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_date ON public.superadmin_intelligence_snapshots(snapshot_date DESC);

-- 2. Row Level Security for superadmin_intelligence_snapshots
ALTER TABLE public.superadmin_intelligence_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins view intelligence snapshots" ON public.superadmin_intelligence_snapshots;
CREATE POLICY "Super Admins view intelligence snapshots"
  ON public.superadmin_intelligence_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super Admins manage intelligence snapshots" ON public.superadmin_intelligence_snapshots;
CREATE POLICY "Super Admins manage intelligence snapshots"
  ON public.superadmin_intelligence_snapshots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
