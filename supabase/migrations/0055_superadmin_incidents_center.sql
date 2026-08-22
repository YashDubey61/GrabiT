-- GrabIt — Super Admin Module 14: Incident Management & Operations Command Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Incident Command)

-- 1. Create superadmin_incidents table
CREATE TABLE IF NOT EXISTS public.superadmin_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('SEV1', 'SEV2', 'SEV3', 'SEV4')),
  status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (status IN ('DETECTED', 'INVESTIGATING', 'MITIGATING', 'MONITORING', 'RESOLVED', 'CLOSED')),
  category TEXT NOT NULL DEFAULT 'SYSTEM',
  affected_service TEXT NOT NULL DEFAULT 'Core Platform',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  mitigated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  incident_commander_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  campus_ids TEXT[] DEFAULT '{}',
  vendor_ids TEXT[] DEFAULT '{}',
  affected_user_count INTEGER DEFAULT 0,
  affected_order_count INTEGER DEFAULT 0,
  affected_payment_count INTEGER DEFAULT 0,
  estimated_revenue_impact NUMERIC(10, 2) DEFAULT 0.00,
  root_cause TEXT,
  resolution TEXT,
  customer_impact TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create superadmin_incident_events table (immutable event timeline)
CREATE TABLE IF NOT EXISTS public.superadmin_incident_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.superadmin_incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create superadmin_incident_postmortems table
CREATE TABLE IF NOT EXISTS public.superadmin_incident_postmortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL UNIQUE REFERENCES public.superadmin_incidents(id) ON DELETE CASCADE,
  root_cause TEXT NOT NULL,
  impact_summary TEXT NOT NULL,
  timeline_summary TEXT NOT NULL,
  what_went_well TEXT,
  what_went_wrong TEXT,
  corrective_actions TEXT,
  preventive_actions TEXT,
  owner_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_superadmin_incidents_number ON public.superadmin_incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_superadmin_incidents_status ON public.superadmin_incidents(status);
CREATE INDEX IF NOT EXISTS idx_superadmin_incidents_severity ON public.superadmin_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_superadmin_incidents_detected ON public.superadmin_incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_incident_events_inc ON public.superadmin_incident_events(incident_id, created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE public.superadmin_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_incident_postmortems ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Super Admins Only
DROP POLICY IF EXISTS "Super Admins view incidents" ON public.superadmin_incidents;
CREATE POLICY "Super Admins view incidents"
  ON public.superadmin_incidents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Super Admins manage incidents" ON public.superadmin_incidents;
CREATE POLICY "Super Admins manage incidents"
  ON public.superadmin_incidents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Super Admins view incident events" ON public.superadmin_incident_events;
CREATE POLICY "Super Admins view incident events"
  ON public.superadmin_incident_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Super Admins manage incident events" ON public.superadmin_incident_events;
CREATE POLICY "Super Admins manage incident events"
  ON public.superadmin_incident_events FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Super Admins view incident postmortems" ON public.superadmin_incident_postmortems;
CREATE POLICY "Super Admins view incident postmortems"
  ON public.superadmin_incident_postmortems FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Super Admins manage incident postmortems" ON public.superadmin_incident_postmortems;
CREATE POLICY "Super Admins manage incident postmortems"
  ON public.superadmin_incident_postmortems FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
