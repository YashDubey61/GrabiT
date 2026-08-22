-- GrabIt — User & Role Management Schema Extension
-- Adds account status and suspension fields to public.users and creates superadmin_user_audit_log table.

-- 1. Extend public.users table with account status fields
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'disabled')),
    ADD COLUMN IF NOT EXISTS status_reason TEXT,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. Audit Trail for Super Admin User & Role Mutations
CREATE TABLE IF NOT EXISTS public.superadmin_user_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'role_changed', 'status_changed', 'user_created', etc.
    previous_role TEXT,
    new_role TEXT,
    previous_status TEXT,
    new_status TEXT,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_superadmin_user_audit_actor ON public.superadmin_user_audit_log(actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_user_audit_target ON public.superadmin_user_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_user_audit_created ON public.superadmin_user_audit_log(created_at);

-- 3. Row Level Security for superadmin_user_audit_log
ALTER TABLE public.superadmin_user_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view user audit logs" ON public.superadmin_user_audit_log;
CREATE POLICY "Super Admins can view user audit logs"
    ON public.superadmin_user_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Super Admins can insert user audit logs" ON public.superadmin_user_audit_log;
CREATE POLICY "Super Admins can insert user audit logs"
    ON public.superadmin_user_audit_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE public.users.id = auth.uid()
              AND public.users.role = 'admin'
        )
    );

-- 4. RLS update policy for public.users by Super Admin
DROP POLICY IF EXISTS "Super Admins can manage all users" ON public.users;
CREATE POLICY "Super Admins can manage all users"
    ON public.users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
              AND role = 'admin'
        )
    );
