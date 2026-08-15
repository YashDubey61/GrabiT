# GrabIt Production Deployment Runbook

## 1. Overview

This runbook outlines the step-by-step procedure for deploying the GRABIT Campus Canteen platform to production on Vercel and Supabase.

- **Deployment Status**: PRODUCTION HARDENED ✅
- **Security & Performance Report**: [`docs/PRODUCTION_SECURITY_PERFORMANCE_DAY_58.md`](PRODUCTION_SECURITY_PERFORMANCE_DAY_58.md)
- **Launch Stabilization Report**: [`docs/PRODUCTION_STABILITY_DAY_57.md`](PRODUCTION_STABILITY_DAY_57.md)
- **Go-Live Certification Report**: [`docs/PRODUCTION_ACCEPTANCE_DAY_56.md`](PRODUCTION_ACCEPTANCE_DAY_56.md)
- **Disaster Recovery Report**: [`docs/DISASTER_RECOVERY_DAY_55.md`](DISASTER_RECOVERY_DAY_55.md)
- **Production Observability Report**: [`docs/PRODUCTION_OBSERVABILITY_DAY_54.md`](PRODUCTION_OBSERVABILITY_DAY_54.md)
- **Razorpay Mode**: Test / Live Mode Verified
- **Webhook Endpoint**: `POST /api/webhooks/razorpay` (Verified Active)
- **Health Check Endpoint**: `GET /api/health` (Verified Active)

---

## 2. Pre-Deployment Environment Setup

### 2.1 Supabase Project Setup
1. Create a production Supabase project at [database.new](https://database.new).
2. Execute database migrations in sequence (`supabase/migrations/0001_init.sql` through `0021_disaster_recovery.sql`).
3. Confirm PostgreSQL RPC function `debit_student_wallet` is deployed and compiled with `SECURITY DEFINER` privileges.
4. Verify RLS is enabled across all public schema tables.

### 2.2 Razorpay Gateway Setup
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Retrieve API Key ID and API Key Secret.
3. Configure Webhook Endpoint:
   - **URL**: `https://<your-domain>.com/api/webhooks/razorpay`
   - **Secret**: Generate a strong secret string.
   - **Active Events**: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.

---

## 3. Vercel Deployment

1. Import the GitHub repository into Vercel.
2. Set Framework Preset to **Next.js**.
3. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (production secret)
   - `RAZORPAY_KEY_ID`: Razorpay key ID
   - `RAZORPAY_KEY_SECRET`: Razorpay secret key
   - `RAZORPAY_WEBHOOK_SECRET`: Razorpay webhook signature secret
   - `CRON_SECRET`: Secret token protecting `POST /api/internal/workflows/run` scheduled jobs (e.g. Vercel Cron Jobs)
4. Trigger Production Build (`npm run build`).

---

## 4. Post-Deployment Verification & Health Check

1. **Health API Verification**:
   - Query `GET https://<your-domain>.com/api/health`
   - Expected response: `200 OK` with `{ "status": "ok", "services": { "database": "healthy" } }`.
2. **Smoke Test Sequence**:
   - Access Student Home (`/student`) -> Verify live campus canteens load.
   - Place a wallet test order -> Verify atomic balance deduction and order placement.
   - Open Vendor Board (`/vendor`) -> Transition order status to `preparing`, `ready`, `completed`.
   - Open Super Admin Dashboard (`/superadmin`) -> Verify GMV telemetry updates.
   - Access Super Admin Ops (`/superadmin/operations`), Notifications (`/superadmin/notifications`), and Reconciliation (`/superadmin/reconciliation`).
   - Trigger Razorpay test payment -> Verify HMAC signature check and subscription activation.

---

## 5. Rollback & Emergency Procedures

- **Deployment Rollback**: In Vercel Dashboard, select previous successful deployment build and click "Promote to Production".
- **Database Rollback**: Revert specific migrations using additive migration scripts (`supabase/migrations/`). Never run `DROP TABLE` on production database.
- **Webhook Failure**: Webhook retries are handled automatically by Razorpay. Replayed webhooks are deduplicated via `payment_webhook_events.event_id`.
