-- Day 47: Student Engagement, Notifications & Lifecycle Intelligence Migration
-- Creates student_notifications and student_notification_preferences tables with strict RLS policies.

CREATE TABLE IF NOT EXISTS public.student_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'INFO',
    category TEXT DEFAULT 'GENERAL',
    related_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    related_menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    related_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    action_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    dedupe_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS public.student_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    order_updates_enabled BOOLEAN DEFAULT true,
    payment_updates_enabled BOOLEAN DEFAULT true,
    wallet_updates_enabled BOOLEAN DEFAULT true,
    gold_updates_enabled BOOLEAN DEFAULT true,
    recommendation_updates_enabled BOOLEAN DEFAULT true,
    marketing_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_id ON public.student_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_created_at ON public.student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notifications_read_at ON public.student_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_student_notifications_type ON public.student_notifications(type);
CREATE INDEX IF NOT EXISTS idx_student_notifications_dedupe_key ON public.student_notifications(dedupe_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_notifications
DROP POLICY IF EXISTS "Students can view own notifications" ON public.student_notifications;
CREATE POLICY "Students can view own notifications"
    ON public.student_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can mark own notifications as read" ON public.student_notifications;
CREATE POLICY "Students can mark own notifications as read"
    ON public.student_notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for student_notification_preferences
DROP POLICY IF EXISTS "Students can view own preferences" ON public.student_notification_preferences;
CREATE POLICY "Students can view own preferences"
    ON public.student_notification_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can insert own preferences" ON public.student_notification_preferences;
CREATE POLICY "Students can insert own preferences"
    ON public.student_notification_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can update own preferences" ON public.student_notification_preferences;
CREATE POLICY "Students can update own preferences"
    ON public.student_notification_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
