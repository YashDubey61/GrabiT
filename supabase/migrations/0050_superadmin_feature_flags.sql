-- GrabIt — Super Admin Feature Flags & Controlled Rollouts Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Feature Flagging & Controlled Rollouts)

-- 1. Create superadmin_feature_flags table
CREATE TABLE IF NOT EXISTS public.superadmin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'System' CHECK (category IN ('Student', 'Vendor', 'Super Admin', 'Payments', 'Orders', 'Offers', 'Analytics', 'Experimental', 'System')),
  status TEXT NOT NULL DEFAULT 'DISABLED' CHECK (status IN ('ENABLED', 'DISABLED', 'SCHEDULED', 'ROLLOUT')),
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  risk_level TEXT NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_high_impact BOOLEAN NOT NULL DEFAULT false,
  target_scope TEXT NOT NULL DEFAULT 'ALL USERS' CHECK (target_scope IN ('ALL USERS', 'CAMPUS', 'VENDOR', 'USER', 'PERCENTAGE')),
  target_campus_ids JSONB DEFAULT '[]'::jsonb,
  target_vendor_ids JSONB DEFAULT '[]'::jsonb,
  target_user_ids JSONB DEFAULT '[]'::jsonb,
  schedule_enable_at TIMESTAMPTZ,
  schedule_disable_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for fast querying, filtering, and evaluation lookup
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.superadmin_feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON public.superadmin_feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON public.superadmin_feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON public.superadmin_feature_flags(environment);

-- 2. Row Level Security for superadmin_feature_flags
ALTER TABLE public.superadmin_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated read feature flags" ON public.superadmin_feature_flags;
CREATE POLICY "Public and authenticated read feature flags"
  ON public.superadmin_feature_flags
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super Admins can manage feature flags" ON public.superadmin_feature_flags;
CREATE POLICY "Super Admins can manage feature flags"
  ON public.superadmin_feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- 3. Seed baseline feature flags
INSERT INTO public.superadmin_feature_flags (
  key, name, description, category, status, environment, rollout_percentage, risk_level, is_high_impact, target_scope
) VALUES
  ('student_rewards_v2', 'Student Rewards Points V2', 'Gamified reward points, tier badges, and transfer system for student app', 'Student', 'ENABLED', 'production', 100, 'LOW', false, 'ALL USERS'),
  ('vendor_instant_payouts', 'Vendor Instant Payout Engine', 'Direct T+0 Cashfree automated payout transfers for verified canteen vendors', 'Vendor', 'ROLLOUT', 'production', 25, 'HIGH', true, 'PERCENTAGE'),
  ('campus_geofencing_v2', 'Campus Geofence GPS Detection', 'Automatic GPS campus discovery and location verification at student checkout', 'System', 'ENABLED', 'production', 100, 'MEDIUM', false, 'ALL USERS'),
  ('cashfree_upi_intent', 'Cashfree Seamless UPI Intent', 'Direct UPI Intent deep-linking for PhonePe, GPay, and Paytm at checkout', 'Payments', 'ROLLOUT', 'production', 50, 'HIGH', true, 'PERCENTAGE'),
  ('order_pickup_otp_verify', 'Order Pickup OTP Verification', 'Mandatory 4-digit OTP fallback verification for canteen order pickup', 'Orders', 'ENABLED', 'production', 100, 'LOW', false, 'ALL USERS'),
  ('dispute_auto_refunds', 'Automatic Low-Value Refund Engine', 'Automate wallet refund credits for missing items under ₹100', 'Disputes', 'DISABLED', 'production', 0, 'CRITICAL', true, 'ALL USERS'),
  ('analytics_predictive_demand', 'Predictive Kitchen Demand Engine', 'AI ML demand forecasting widgets for vendor inventory management', 'Analytics', 'SCHEDULED', 'staging', 10, 'LOW', false, 'PERCENTAGE')
ON CONFLICT (key) DO NOTHING;
