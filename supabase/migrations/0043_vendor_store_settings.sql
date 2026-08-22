-- Migration 0043: Vendor Store Settings & Canteen Operational Profile
-- Adds operational settings columns to public.canteens for store settings, prep times, operating hours, and announcements

ALTER TABLE public.canteens
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS opening_time TEXT NOT NULL DEFAULT '08:00 AM',
  ADD COLUMN IF NOT EXISTS closing_time TEXT NOT NULL DEFAULT '08:00 PM',
  ADD COLUMN IF NOT EXISTS operating_days TEXT NOT NULL DEFAULT 'Monday - Saturday',
  ADD COLUMN IF NOT EXISTS is_open_override BOOLEAN,
  ADD COLUMN IF NOT EXISTS announcement_message TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS Policy: Vendors can update their own canteen's operational settings
DROP POLICY IF EXISTS "Vendors can update own canteen settings" ON public.canteens;
CREATE POLICY "Vendors can update own canteen settings"
  ON public.canteens
  FOR UPDATE
  USING (
    id IN (
      SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor'
    )
  );
