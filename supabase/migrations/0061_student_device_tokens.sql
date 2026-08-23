-- Student Push Device Tokens Migration
-- Stores FCM device registration tokens for Student App devices, mirroring
-- 0060_vendor_device_tokens.sql's pattern so order-status push notifications
-- can be delivered to a student's registered Android device(s).

CREATE TABLE IF NOT EXISTS public.student_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL DEFAULT 'android',
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_device_tokens_user_id ON public.student_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_student_device_tokens_token ON public.student_device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_student_device_tokens_active ON public.student_device_tokens(is_active);

ALTER TABLE public.student_device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own device tokens" ON public.student_device_tokens;
CREATE POLICY "Students can view own device tokens"
    ON public.student_device_tokens
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert own device tokens" ON public.student_device_tokens;
CREATE POLICY "Students can insert own device tokens"
    ON public.student_device_tokens
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own device tokens" ON public.student_device_tokens;
CREATE POLICY "Students can update own device tokens"
    ON public.student_device_tokens
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can delete own device tokens" ON public.student_device_tokens;
CREATE POLICY "Students can delete own device tokens"
    ON public.student_device_tokens
    FOR DELETE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all student device tokens" ON public.student_device_tokens;
CREATE POLICY "Admins can view all student device tokens"
    ON public.student_device_tokens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
