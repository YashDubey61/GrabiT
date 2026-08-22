-- GrabIt — Vendor Approval & KYC Management Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Vendor Onboarding & KYC Control)

-- 1. Create vendor_applications table for Super Admin vendor onboarding and KYC verification
CREATE TABLE IF NOT EXISTS public.vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID REFERENCES public.canteens(id) ON DELETE SET NULL,
  vendor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Fast Food & Snacks',
  description TEXT,
  address TEXT,
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'under_review', 'approved', 'rejected')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  vendor_status TEXT NOT NULL DEFAULT 'active' CHECK (vendor_status IN ('active', 'suspended', 'closed')),
  kyc_documents JSONB DEFAULT '[]'::jsonb,
  rejection_reason TEXT,
  suspension_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for status filtering and search
CREATE INDEX IF NOT EXISTS idx_vendor_app_campus ON public.vendor_applications(campus_id);
CREATE INDEX IF NOT EXISTS idx_vendor_app_status ON public.vendor_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_vendor_app_kyc_status ON public.vendor_applications(kyc_status);
CREATE INDEX IF NOT EXISTS idx_vendor_app_vendor_status ON public.vendor_applications(vendor_status);
CREATE INDEX IF NOT EXISTS idx_vendor_app_created ON public.vendor_applications(created_at);

-- 2. Row Level Security for vendor_applications
ALTER TABLE public.vendor_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage vendor applications" ON public.vendor_applications;
CREATE POLICY "Super Admins can manage vendor applications"
  ON public.vendor_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Vendors can view own application" ON public.vendor_applications;
CREATE POLICY "Vendors can view own application"
  ON public.vendor_applications
  FOR SELECT
  USING (
    vendor_user_id = auth.uid()
    OR canteen_id IN (SELECT canteen_id FROM public.users WHERE id = auth.uid() AND role = 'vendor')
  );
