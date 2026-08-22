-- GrabIt — Fraud & Risk Center Schema Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Fraud & Risk Oversight)

-- 1. Create superadmin_risk_cases table
CREATE TABLE IF NOT EXISTS public.superadmin_risk_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'vendor', 'order', 'payment', 'coupon')),
  entity_id TEXT NOT NULL,
  entity_name TEXT,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE SET NULL,
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  signals JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes JSONB DEFAULT '[]'::jsonb,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create superadmin_risk_events table for risk timeline audit
CREATE TABLE IF NOT EXISTS public.superadmin_risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.superadmin_risk_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for status, risk level, entity, and campus queries
CREATE INDEX IF NOT EXISTS idx_risk_cases_status ON public.superadmin_risk_cases(status);
CREATE INDEX IF NOT EXISTS idx_risk_cases_risk_level ON public.superadmin_risk_cases(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_cases_entity ON public.superadmin_risk_cases(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_campus ON public.superadmin_risk_cases(campus_id);
CREATE INDEX IF NOT EXISTS idx_risk_cases_created ON public.superadmin_risk_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_risk_events_case ON public.superadmin_risk_events(case_id);

-- 3. Enable Row Level Security
ALTER TABLE public.superadmin_risk_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_risk_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage risk cases" ON public.superadmin_risk_cases;
CREATE POLICY "Super Admins can manage risk cases"
  ON public.superadmin_risk_cases
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super Admins can read risk events" ON public.superadmin_risk_events;
CREATE POLICY "Super Admins can read risk events"
  ON public.superadmin_risk_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
