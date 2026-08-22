-- GrabIt — Super Admin Security & Access Monitoring Center Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Security Monitoring & Incident Investigations)

-- 1. Create superadmin_security_investigations table for security case tracking
CREATE TABLE IF NOT EXISTS public.superadmin_security_investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
  investigating_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  resolution_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_investigations_event ON public.superadmin_security_investigations(event_id);
CREATE INDEX IF NOT EXISTS idx_security_investigations_status ON public.superadmin_security_investigations(status);
CREATE INDEX IF NOT EXISTS idx_security_investigations_severity ON public.superadmin_security_investigations(severity);

-- 2. Row Level Security for superadmin_security_investigations
ALTER TABLE public.superadmin_security_investigations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view security investigations" ON public.superadmin_security_investigations;
CREATE POLICY "Super Admins can view security investigations"
  ON public.superadmin_security_investigations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super Admins can manage security investigations" ON public.superadmin_security_investigations;
CREATE POLICY "Super Admins can manage security investigations"
  ON public.superadmin_security_investigations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );
