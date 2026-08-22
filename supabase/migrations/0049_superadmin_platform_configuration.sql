-- GrabIt — Super Admin Platform Configuration Migration
-- Source of truth: TRD §4 Data Model & TRD §8 Security Architecture (Centralized Configuration Control)

-- 1. Create/Ensure platform_settings table with full schema
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add configuration metadata columns if they do not exist
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS value_type TEXT NOT NULL DEFAULT 'json' CHECK (value_type IN ('integer', 'decimal', 'boolean', 'string', 'enum', 'json'));
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS is_high_impact BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS impact_warning TEXT;
ALTER TABLE public.platform_settings ADD COLUMN IF NOT EXISTS used_by_modules JSONB DEFAULT '[]'::jsonb;

-- Indexes for fast querying by category and high impact
CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON public.platform_settings(category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_high_impact ON public.platform_settings(is_high_impact);

-- 2. Row Level Security for platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read platform settings" ON public.platform_settings;
CREATE POLICY "Anyone authenticated can read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Super Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Super Admins can manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
        AND public.users.role = 'admin'
    )
  );

-- 3. Seed baseline business configuration entries across 7 categories
INSERT INTO public.platform_settings (key, value, category, description, value_type, is_active, is_high_impact, impact_warning, used_by_modules)
VALUES
  -- GENERAL
  ('general_platform_name', '"GRABIT Campus Canteen OS"'::jsonb, 'GENERAL', 'Official platform brand name displayed across student and vendor applications', 'string', true, false, NULL, '["Student App", "Vendor OS", "Super Admin"]'::jsonb),
  ('general_default_timezone', '"Asia/Kolkata"'::jsonb, 'GENERAL', 'Default system timezone for settlements, orders, and timestamps', 'string', true, false, NULL, '["Settlements", "Workflows", "Incidents"]'::jsonb),
  ('general_default_currency', '"INR"'::jsonb, 'GENERAL', 'Default ISO currency code for all financial transactions', 'string', true, false, NULL, '["Payments", "Payouts", "Wallet"]'::jsonb),
  ('general_maintenance_mode', 'false'::jsonb, 'GENERAL', 'Platform-wide maintenance mode toggle to block new order placement', 'boolean', true, true, 'Enabling maintenance mode prevents students from placing new canteen orders across all campuses.', '["Checkout", "Student App"]'::jsonb),

  -- ORDERS
  ('orders_min_order_value', '0.00'::jsonb, 'ORDERS', 'Minimum order total required for student checkout (₹)', 'decimal', true, false, NULL, '["Checkout", "Student Orders"]'::jsonb),
  ('orders_max_order_value', '5000.00'::jsonb, 'ORDERS', 'Maximum allowed single order transaction total (₹)', 'decimal', true, true, 'Restricts high-value single order placements to mitigate risk.', '["Checkout", "Fraud & Risk"]'::jsonb),
  ('orders_timeout_minutes', '15'::jsonb, 'ORDERS', 'Unpaid or unaccepted order expiration timeout in minutes', 'integer', true, false, NULL, '["Vendor Orders", "Order Lifecycle"]'::jsonb),
  ('orders_default_prep_time', '15'::jsonb, 'ORDERS', 'Default food preparation estimate shown to students (minutes)', 'integer', true, false, NULL, '["Live Tracking", "Vendor OS"]'::jsonb),
  ('orders_cancellation_window_mins', '2'::jsonb, 'ORDERS', 'Student order cancellation grace period after placement (minutes)', 'integer', true, true, 'Changing cancellation window impacts student cancellation refund rights and vendor prep workflows.', '["Student Orders", "Refund Logic", "Vendor OS"]'::jsonb),
  ('orders_max_active_orders_per_vendor', '50'::jsonb, 'ORDERS', 'Maximum concurrent active orders allowed per canteen kitchen', 'integer', true, false, NULL, '["Vendor Queue", "Order Placement"]'::jsonb),

  -- VENDOR
  ('vendor_default_commission_percent', '7.00'::jsonb, 'VENDOR', 'Default platform commission rate applied to vendor gross revenue (%)', 'decimal', true, true, 'Vendor earnings and daily settlement calculations will change for future transactions.', '["Vendor Settlements", "Vendor Payouts", "Financial Ledger"]'::jsonb),
  ('vendor_activation_auto_approve', 'false'::jsonb, 'VENDOR', 'Automatically approve new vendor onboarding applications without manual KYC review', 'boolean', true, true, 'Bypassing manual KYC review increases risk of unverified vendors onboarding.', '["Vendor Approvals", "KYC Center"]'::jsonb),
  ('vendor_default_operating_status', '"active"'::jsonb, 'VENDOR', 'Default operational status assigned to approved vendor canteens', 'enum', true, false, NULL, '["Vendor Oversight", "Campus Discovery"]'::jsonb),
  ('vendor_settlement_schedule_time', '"18:00 IST"'::jsonb, 'VENDOR', 'Daily vendor settlement cut-off time (e.g. 18:00 IST)', 'string', true, true, 'Modifies automated daily 6 PM IST settlement batch trigger window.', '["Vendor Settlements", "Telegram Bot", "Payouts"]'::jsonb),

  -- OFFERS
  ('offers_max_discount_percent', '50.00'::jsonb, 'OFFERS', 'Maximum promotional discount percentage allowed per coupon code (%)', 'decimal', true, true, 'Controls maximum discount cap on checkout promotions.', '["Promo Codes", "Checkout"]'::jsonb),
  ('offers_max_discount_amount', '100.00'::jsonb, 'OFFERS', 'Maximum monetary discount cap per promotional order (₹)', 'decimal', true, true, 'Controls maximum rupee discount cap on checkout promotions.', '["Promo Codes", "Checkout"]'::jsonb),
  ('offers_coupon_usage_limit_per_user', '5'::jsonb, 'OFFERS', 'Maximum lifetime redemptions per promo code per student', 'integer', true, false, NULL, '["Promo Codes", "Rewards Engine"]'::jsonb),
  ('offers_min_order_for_coupon', '99.00'::jsonb, 'OFFERS', 'Minimum cart total required to apply promo codes (₹)', 'decimal', true, false, NULL, '["Checkout", "Promo Codes"]'::jsonb),

  -- PAYMENTS
  ('payments_timeout_seconds', '300'::jsonb, 'PAYMENTS', 'Online payment gateway session expiration timeout (seconds)', 'integer', true, false, NULL, '["Cashfree Payments", "Razorpay"]'::jsonb),
  ('payments_allowed_methods', '["upi", "wallet", "razorpay", "cashfree"]'::jsonb, 'PAYMENTS', 'Allowed payment gateway and wallet transaction methods', 'json', true, true, 'Disabling payment methods impacts student payment options at checkout.', '["Checkout", "Payments Center"]'::jsonb),
  ('payments_retry_limit', '3'::jsonb, 'PAYMENTS', 'Maximum payment verification retry attempts before marking failed', 'integer', true, false, NULL, '["Payment Reconciler", "Cashfree Webhooks"]'::jsonb),

  -- REFUNDS
  ('refunds_max_refund_window_days', '7'::jsonb, 'REFUNDS', 'Maximum timeframe after order completion to file a dispute & refund (days)', 'integer', true, true, 'Determines dispute eligibility window for past student orders.', '["Dispute Center", "Refund Engine"]'::jsonb),
  ('refunds_approval_required_above', '500.00'::jsonb, 'REFUNDS', 'Refund amounts above this threshold require manual Super Admin approval (₹)', 'decimal', true, true, 'Controls automatic vs manual approval escalation threshold for refunds.', '["Dispute Center", "Financial Approvals"]'::jsonb),
  ('refunds_allow_partial_refunds', 'true'::jsonb, 'REFUNDS', 'Allow processing partial item refunds for incomplete order fulfillment', 'boolean', true, false, NULL, '["Dispute Center", "Wallet Refunds"]'::jsonb),

  -- NOTIFICATIONS
  ('notifications_order_alerts_enabled', 'true'::jsonb, 'NOTIFICATIONS', 'Enable real-time push and web notifications for order status transitions', 'boolean', true, false, NULL, '["Student Notifications", "Vendor Notifications"]'::jsonb),
  ('notifications_vendor_sms_enabled', 'true'::jsonb, 'NOTIFICATIONS', 'Enable SMS alerts to vendors for urgent order cancellations', 'boolean', true, false, NULL, '["Operational Notifications", "Vendor OS"]'::jsonb),
  ('notifications_student_push_enabled', 'true'::jsonb, 'NOTIFICATIONS', 'Enable student mobile push notifications for food ready alerts', 'boolean', true, false, NULL, '["Student App", "Push Engine"]'::jsonb),
  ('notifications_retry_limit', '3'::jsonb, 'NOTIFICATIONS', 'Maximum push notification delivery retries on gateway failure', 'integer', true, false, NULL, '["Notification Service"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
