-- Day 48: Vendor & Super Admin Operational Notifications Migration
-- Creates operational_notifications table with vendor canteen isolation and admin RLS policies.

CREATE TABLE IF NOT EXISTS public.operational_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type TEXT NOT NULL, -- 'vendor' | 'admin'
    recipient_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO' | 'WARNING' | 'CRITICAL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    related_menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    related_canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
    dedupe_key TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_operational_notif_recipient_user ON public.operational_notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_operational_notif_recipient_type ON public.operational_notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_operational_notif_canteen_id ON public.operational_notifications(canteen_id);
CREATE INDEX IF NOT EXISTS idx_operational_notif_campus_id ON public.operational_notifications(campus_id);
CREATE INDEX IF NOT EXISTS idx_operational_notif_status ON public.operational_notifications(status);
CREATE INDEX IF NOT EXISTS idx_operational_notif_severity ON public.operational_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_operational_notif_type ON public.operational_notifications(type);
CREATE INDEX IF NOT EXISTS idx_operational_notif_created_at ON public.operational_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_notif_dedupe_key ON public.operational_notifications(dedupe_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.operational_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Vendors can view operational notifications for their own canteen
DROP POLICY IF EXISTS "Vendors can view own canteen operational notifications" ON public.operational_notifications;
CREATE POLICY "Vendors can view own canteen operational notifications"
    ON public.operational_notifications
    FOR SELECT
    USING (
        recipient_type = 'vendor' AND
        canteen_id IN (
            SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor'
        )
    );

-- RLS Policy: Vendors can acknowledge/update notifications for their own canteen
DROP POLICY IF EXISTS "Vendors can update own canteen operational notifications" ON public.operational_notifications;
CREATE POLICY "Vendors can update own canteen operational notifications"
    ON public.operational_notifications
    FOR UPDATE
    USING (
        recipient_type = 'vendor' AND
        canteen_id IN (
            SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor'
        )
    )
    WITH CHECK (
        recipient_type = 'vendor' AND
        canteen_id IN (
            SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor'
        )
    );

-- RLS Policy: Super Admins can view all admin operational notifications
DROP POLICY IF EXISTS "Admins can view admin operational notifications" ON public.operational_notifications;
CREATE POLICY "Admins can view admin operational notifications"
    ON public.operational_notifications
    FOR SELECT
    USING (
        recipient_type = 'admin' AND
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policy: Super Admins can acknowledge/resolve admin operational notifications
DROP POLICY IF EXISTS "Admins can update admin operational notifications" ON public.operational_notifications;
CREATE POLICY "Admins can update admin operational notifications"
    ON public.operational_notifications
    FOR UPDATE
    USING (
        recipient_type = 'admin' AND
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        recipient_type = 'admin' AND
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
