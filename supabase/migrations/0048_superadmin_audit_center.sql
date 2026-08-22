-- GrabIt — Super Admin Audit Logs & Activity Center Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Centralized Audit System)

-- 1. Create superadmin_audit_logs table
CREATE TABLE IF NOT EXISTS public.superadmin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_email TEXT,
  actor_role TEXT NOT NULL DEFAULT 'admin',
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for fast searching, filtering, and pagination
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_created ON public.superadmin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_actor ON public.superadmin_audit_logs(actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_action ON public.superadmin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_module ON public.superadmin_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_target ON public.superadmin_audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_audit_severity ON public.superadmin_audit_logs(severity);

-- 2. Row Level Security for superadmin_audit_logs
ALTER TABLE public.superadmin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view audit logs" ON public.superadmin_audit_logs;
CREATE POLICY "Super Admins can view audit logs"
  ON public.superadmin_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Super Admins can insert audit logs" ON public.superadmin_audit_logs;
CREATE POLICY "Super Admins can insert audit logs"
  ON public.superadmin_audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- No UPDATE or DELETE RLS policies are created for superadmin_audit_logs to enforce immutability at RLS layer.

-- 3. Immutability Enforcement Function & Trigger
CREATE OR REPLACE FUNCTION public.prevent_superadmin_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ERR_AUDIT_LOG_IMMUTABLE: Audit log events are append-only and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON public.superadmin_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
  BEFORE UPDATE OR DELETE ON public.superadmin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_superadmin_audit_log_mutation();

-- 4. Backwards-compatibility data migration from superadmin_user_audit_log if present
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'superadmin_user_audit_log') THEN
    INSERT INTO public.superadmin_audit_logs (actor_admin_id, action, module, target_type, target_id, previous_state, new_state, reason, metadata, created_at)
    SELECT 
      actor_admin_id,
      action,
      'Users' AS module,
      'USER' AS target_type,
      target_user_id::text AS target_id,
      jsonb_build_object('role', previous_role, 'status', previous_status) AS previous_state,
      jsonb_build_object('role', new_role, 'status', new_status) AS new_state,
      reason,
      metadata,
      created_at
    FROM public.superadmin_user_audit_log
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
