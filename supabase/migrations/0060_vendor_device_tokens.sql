-- Day 60: Vendor Push Device Tokens Migration
-- Stores FCM / Push device registration tokens for vendor devices to deliver background order alerts.

CREATE TABLE IF NOT EXISTS public.vendor_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL DEFAULT 'android',
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_tokens_user_id ON public.vendor_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_tokens_canteen_id ON public.vendor_device_tokens(canteen_id);
CREATE INDEX IF NOT EXISTS idx_vendor_tokens_token ON public.vendor_device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_vendor_tokens_active ON public.vendor_device_tokens(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vendor_device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Vendors can view, insert, update, and delete their own device tokens
DROP POLICY IF EXISTS "Vendors can view own device tokens" ON public.vendor_device_tokens;
CREATE POLICY "Vendors can view own device tokens"
    ON public.vendor_device_tokens
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can insert own device tokens" ON public.vendor_device_tokens;
CREATE POLICY "Vendors can insert own device tokens"
    ON public.vendor_device_tokens
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can update own device tokens" ON public.vendor_device_tokens;
CREATE POLICY "Vendors can update own device tokens"
    ON public.vendor_device_tokens
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can delete own device tokens" ON public.vendor_device_tokens;
CREATE POLICY "Vendors can delete own device tokens"
    ON public.vendor_device_tokens
    FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies: Super Admins can view and manage all vendor device tokens
DROP POLICY IF EXISTS "Admins can view all vendor device tokens" ON public.vendor_device_tokens;
CREATE POLICY "Admins can view all vendor device tokens"
    ON public.vendor_device_tokens
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );
