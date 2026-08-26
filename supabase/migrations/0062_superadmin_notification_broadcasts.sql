-- Migration 0062: Super Admin Notification Broadcasts & History
-- Stores administrative custom notification broadcast history and delivery audits.

CREATE TABLE IF NOT EXISTS public.admin_notification_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_scope TEXT NOT NULL CHECK (target_scope IN ('all', 'campus', 'student')),
    target_id TEXT,
    target_label TEXT,
    action_url TEXT,
    total_targeted INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at ON public.admin_notification_broadcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_scope ON public.admin_notification_broadcasts(target_scope);

ALTER TABLE public.admin_notification_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view broadcast history" ON public.admin_notification_broadcasts;
CREATE POLICY "Super Admins can view broadcast history"
    ON public.admin_notification_broadcasts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Super Admins can insert broadcast history" ON public.admin_notification_broadcasts;
CREATE POLICY "Super Admins can insert broadcast history"
    ON public.admin_notification_broadcasts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
